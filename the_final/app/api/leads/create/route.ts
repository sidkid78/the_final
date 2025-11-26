import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { createLead, getLead } from "@/lib/lead-functions"
import { matchLeadToContractors } from "@/lib/matching-functions"
import { getAssessment } from "@/lib/assessment-functions"
import { getUserProfile } from "@/lib/auth-functions"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assessmentId, address, phone, urgency, description } = await req.json()

    // Get assessment data
    const assessment = await getAssessment(assessmentId)
    if (!assessment || assessment.userId !== session.user.id) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    // Get user profile
    const userProfile = await getUserProfile(session.user.id)

    // Extract project types from assessment issues
    const projectTypes = new Set<string>()
    assessment.rooms.forEach((room) => {
      projectTypes.add(room.roomType)
      room.issues.forEach((issue) => {
        projectTypes.add(issue.category.toLowerCase())
      })
    })

    // Create lead
    const leadId = await createLead({
      assessmentId,
      homeownerId: session.user.id,
      homeownerName: session.user.name || "Homeowner",
      homeownerEmail: session.user.email,
      homeownerPhone: phone,
      address,
      projectType: Array.from(projectTypes),
      description: description || assessment.summary,
      urgency: urgency || "medium",
      budget: assessment.totalEstimate,
    })

    // Get the created lead
    const lead = await getLead(leadId)
    if (!lead) {
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
    }

    // Match to contractors
    const matchedContractors = await matchLeadToContractors(lead)

    return NextResponse.json({
      leadId,
      matchedContractors: matchedContractors.length,
    })
  } catch (error) {
    console.error("Lead creation error:", error)
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
