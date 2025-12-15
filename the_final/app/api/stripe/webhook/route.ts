import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getAdminDb } from "@/lib/admin"
import { FieldValue } from "firebase-admin/firestore"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
        console.error("Missing Stripe signature")
        return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
        console.error("Webhook signature verification failed:", err)
        return NextResponse.json(
            { error: "Webhook signature verification failed" },
            { status: 400 }
        )
    }

    const db = getAdminDb()

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session

                // Check if this is a lead purchase
                if (session.metadata?.type === "lead_purchase") {
                    await handleLeadPurchase(db, session)
                }
                break
            }

            case "account.updated": {
                // Handle Stripe Connect account updates (contractor verification)
                const account = event.data.object as Stripe.Account
                await handleAccountUpdated(db, account)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error("Webhook handler error:", error)
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        )
    }
}

async function handleLeadPurchase(
    db: FirebaseFirestore.Firestore,
    session: Stripe.Checkout.Session
) {
    const { leadId, contractorId } = session.metadata!

    if (!leadId || !contractorId) {
        console.error("Missing metadata in checkout session:", session.id)
        return
    }

    const leadRef = db.collection("leads").doc(leadId)
    const transactionRef = db.collection("transactions").doc(session.id)

    // Use a transaction to ensure atomicity and idempotency
    await db.runTransaction(async (transaction) => {
        // Check if transaction already processed (idempotency)
        const txDoc = await transaction.get(transactionRef)
        if (txDoc.exists) {
            console.log(`Transaction ${session.id} already processed`)
            return
        }

        // Update lead with purchasedBy
        transaction.update(leadRef, {
            purchasedBy: FieldValue.arrayUnion(contractorId),
            updatedAt: FieldValue.serverTimestamp(),
        })

        // Log the transaction for auditing
        transaction.set(transactionRef, {
            type: "lead_purchase",
            contractorId,
            leadId,
            amount: session.amount_total,
            currency: session.currency,
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent,
            status: "completed",
            createdAt: FieldValue.serverTimestamp(),
        })
    })

    console.log(`Lead ${leadId} purchased by contractor ${contractorId}`)
}

async function handleAccountUpdated(
    db: FirebaseFirestore.Firestore,
    account: Stripe.Account
) {
    const stripeAccountId = account.id

    // Find user with this Stripe account ID
    const usersRef = db.collection("users")
    const snapshot = await usersRef
        .where("stripeAccountId", "==", stripeAccountId)
        .limit(1)
        .get()

    if (snapshot.empty) {
        console.log(`No user found for Stripe account: ${stripeAccountId}`)
        return
    }

    const userDoc = snapshot.docs[0]
    const isVerified = account.charges_enabled && account.payouts_enabled

    // Update the user's Stripe onboarding status
    await userDoc.ref.update({
        stripeOnboardingComplete: isVerified,
        updatedAt: FieldValue.serverTimestamp(),
    })

    console.log(`Updated Stripe status for user ${userDoc.id}: verified=${isVerified}`)
}
