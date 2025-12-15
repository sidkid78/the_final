import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminDb } from "@/lib/admin"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
})

export async function POST(req: Request) {
    try {
        // 1. Authenticate and authorize
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "contractor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { leadId } = await req.json()
        if (!leadId) {
            return NextResponse.json({ error: "Lead ID is required" }, { status: 400 })
        }

        const db = getAdminDb()
        const contractorId = session.user.id

        // 2. Fetch contractor profile to verify they're approved
        const contractorDoc = await db.collection("users").doc(contractorId).get()
        const contractorData = contractorDoc.data()

        if (!contractorData?.stripeOnboardingComplete) {
            return NextResponse.json(
                { error: "Please complete Stripe onboarding first" },
                { status: 403 }
            )
        }

        if (!contractorData?.verified) {
            return NextResponse.json(
                { error: "Your account must be verified to purchase leads" },
                { status: 403 }
            )
        }

        // 3. Fetch lead and verify contractor is matched
        const leadDoc = await db.collection("leads").doc(leadId).get()
        if (!leadDoc.exists) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        const leadData = leadDoc.data()
        if (!leadData?.matchedContractors?.includes(contractorId)) {
            return NextResponse.json(
                { error: "You are not matched to this lead" },
                { status: 403 }
            )
        }

        // 4. Check if already purchased
        if (leadData.purchasedBy?.includes(contractorId)) {
            return NextResponse.json(
                { error: "You have already purchased this lead" },
                { status: 400 }
            )
        }

        // 5. Get lead price (default to $25 if not set)
        const priceInCents = leadData.price || 2500

        // 6. Create Stripe Checkout Session
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Lead: ${leadData.projectType?.slice(0, 3).join(", ") || "Home Modification"}`,
                            description: `${leadData.address?.city}, ${leadData.address?.state} - ${leadData.projectType?.length || 0} services`,
                        },
                        unit_amount: priceInCents,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                leadId,
                contractorId,
                type: "lead_purchase",
            },
            success_url: `${baseUrl}/dashboard/leads/contractor/${leadId}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/dashboard/leads/contractor/${leadId}?purchase=cancelled`,
        })

        return NextResponse.json({
            checkoutUrl: checkoutSession.url,
            sessionId: checkoutSession.id
        })

    } catch (error) {
        console.error("Lead purchase error:", error)
        return NextResponse.json(
            { error: "Failed to initiate lead purchase" },
            { status: 500 }
        )
    }
}
