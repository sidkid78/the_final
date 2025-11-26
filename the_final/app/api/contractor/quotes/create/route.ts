import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { createQuote, getLead } from "@/lib/lead-functions"
import { getContractorProfile } from "@/lib/contractor-functions"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "contractor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contractor = await getContractorProfile(session.user.id)
    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 })
    }

    if (!contractor.stripeOnboardingComplete) {
      return NextResponse.json({ error: "Please complete Stripe onboarding first" }, { status: 400 })
    }

    const { leadId, amount, breakdown, estimatedDuration, validDays, notes } = await req.json()

    // Verify lead exists and contractor is matched
    const lead = await getLead(leadId)
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    if (!lead.matchedContractors.includes(session.user.id)) {
      return NextResponse.json({ error: "Not authorized for this lead" }, { status: 403 })
    }

    // Create quote
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + (validDays || 14))

    const quoteId = await createQuote({
      leadId,
      contractorId: session.user.id,
      contractorName: contractor.displayName,
      contractorCompany: contractor.companyName || contractor.displayName,
      amount,
      breakdown: breakdown || [],
      estimatedDuration,
      validUntil,
      notes,
    })

    return NextResponse.json({ quoteId })
  } catch (error) {
    console.error("Quote creation error:", error)
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 })
  }
}
