import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { 
  getAssessmentById, 
  createLeadAdmin, 
  getLeadAdmin, 
  matchLeadToContractorsAdmin 
} from "@/lib/server-admin-functions"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assessmentId, address, phone, urgency, description } = await req.json()

    // Get assessment data using Admin SDK
    const assessment = await getAssessmentById(assessmentId)
    if (!assessment || assessment.userId !== session.user.id) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    // Extract project types from assessment issues
    const projectTypes = new Set<string>()
    assessment.rooms.forEach((room) => {
      projectTypes.add(room.roomType)
      room.issues.forEach((issue) => {
        projectTypes.add(issue.category.toLowerCase())
      })
    })

    // Create lead using Admin SDK
    const leadId = await createLeadAdmin({
      assessmentId,
      homeownerId: session.user.id,
      homeownerName: session.user.name || "Homeowner",
      homeownerEmail: session.user.email || "",
      homeownerPhone: phone,
      address,
      projectType: Array.from(projectTypes),
      description: description || assessment.summary,
      urgency: urgency || "medium",
      budget: assessment.totalEstimate,
    })

    // Get the created lead using Admin SDK
    const lead = await getLeadAdmin(leadId)
    if (!lead) {
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
    }

    // Match to contractors using Admin SDK
    const matchedContractors = await matchLeadToContractorsAdmin(lead)

    return NextResponse.json({
      leadId,
      matchedContractors: matchedContractors.length,
    })
  } catch (error) {
    console.error("Lead creation error:", error)
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
