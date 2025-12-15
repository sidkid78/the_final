import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getContractorProfile, updateStripeAccountId } from "@/lib/server-admin-functions"
import Stripe from "stripe"
import { getBaseUrl } from "@/lib/url"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
})

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "contractor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contractor = await getContractorProfile(session.user.id)
    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 })
    }

    const baseUrl = getBaseUrl()

    // Check if contractor already has a Stripe account
    if (contractor.stripeAccountId) {
      // Create new account link for existing account
      const accountLink = await stripe.accountLinks.create({
        account: contractor.stripeAccountId,
        refresh_url: `${baseUrl}/dashboard/profile?stripe=refresh`,
        return_url: `${baseUrl}/dashboard/profile?stripe=success`,
        type: "account_onboarding",
      })

      return NextResponse.json({ url: accountLink.url })
    }

    // Create new Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: contractor.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        contractorId: contractor.uid,
      },
    })

    // Save Stripe account ID to Firestore
    await updateStripeAccountId(contractor.uid, account.id)

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/dashboard/profile?stripe=refresh`,
      return_url: `${baseUrl}/dashboard/profile?stripe=success`,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error("Stripe account creation error:", error)
    return NextResponse.json({ error: "Failed to create Stripe account" }, { status: 500 })
  }
}
