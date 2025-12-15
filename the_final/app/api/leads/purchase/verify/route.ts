import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminDb } from "@/lib/admin"
import { FieldValue } from "firebase-admin/firestore"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
})

/**
 * This route verifies a Stripe checkout session after payment completion
 * and updates the lead's purchasedBy field if not already done by webhook.
 * This is especially useful in development/test mode where webhooks may not fire.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "contractor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { sessionId, leadId } = await req.json()
        if (!sessionId || !leadId) {
            return NextResponse.json(
                { error: "Session ID and Lead ID are required" },
                { status: 400 }
            )
        }

        const contractorId = session.user.id

        // Retrieve the Stripe checkout session
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

        // Verify the session is completed and metadata matches
        if (checkoutSession.payment_status !== "paid") {
            return NextResponse.json(
                { error: "Payment not completed" },
                { status: 400 }
            )
        }

        if (
            checkoutSession.metadata?.leadId !== leadId ||
            checkoutSession.metadata?.contractorId !== contractorId
        ) {
            return NextResponse.json(
                { error: "Session metadata mismatch" },
                { status: 403 }
            )
        }

        const db = getAdminDb()
        const leadRef = db.collection("leads").doc(leadId)
        const transactionRef = db.collection("transactions").doc(sessionId)

        // Use a transaction for idempotency
        await db.runTransaction(async (transaction) => {
            const leadDoc = await transaction.get(leadRef)
            if (!leadDoc.exists) {
                throw new Error("Lead not found")
            }

            const leadData = leadDoc.data()

            // Check if already purchased by this contractor
            if (leadData?.purchasedBy?.includes(contractorId)) {
                // Already processed, just return success
                return
            }

            // Update lead with purchasedBy
            transaction.update(leadRef, {
                purchasedBy: FieldValue.arrayUnion(contractorId),
                updatedAt: FieldValue.serverTimestamp(),
            })

            // Check if transaction record already exists
            const txDoc = await transaction.get(transactionRef)
            if (!txDoc.exists) {
                // Log the transaction for auditing
                transaction.set(transactionRef, {
                    type: "lead_purchase",
                    contractorId,
                    leadId,
                    amount: checkoutSession.amount_total,
                    currency: checkoutSession.currency,
                    stripeSessionId: sessionId,
                    stripePaymentIntentId: checkoutSession.payment_intent,
                    status: "completed",
                    verifiedViaApi: true, // Flag to indicate this was verified via API not webhook
                    createdAt: FieldValue.serverTimestamp(),
                })
            }
        })

        return NextResponse.json({ success: true, verified: true })

    } catch (error) {
        console.error("Purchase verification error:", error)
        return NextResponse.json(
            { error: "Failed to verify purchase" },
            { status: 500 }
        )
    }
}
