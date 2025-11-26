import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getContractorProfile, markStripeOnboardingComplete } from "@/lib/contractor-functions"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "contractor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contractor = await getContractorProfile(session.user.id)
    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 })
    }

    if (!contractor.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      })
    }

    const account = await stripe.accounts.retrieve(contractor.stripeAccountId)

    // Update onboarding status if complete
    if (account.charges_enabled && account.payouts_enabled && !contractor.stripeOnboardingComplete) {
      await markStripeOnboardingComplete(contractor.uid)
    }

    return NextResponse.json({
      connected: true,
      onboardingComplete: account.charges_enabled && account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    })
  } catch (error) {
    console.error("Stripe status error:", error)
    return NextResponse.json({ error: "Failed to get Stripe status" }, { status: 500 })
  }
}
