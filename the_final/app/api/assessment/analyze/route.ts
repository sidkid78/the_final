import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { generateObject } from "ai"
import { z } from "zod"

const accessibilityAnalysisSchema = z.object({
  roomType: z.enum(["bathroom", "bedroom", "kitchen", "stairs", "entrance", "hallway", "living_room", "other"]),
  issues: z.array(
    z.object({
      category: z.string().describe('Category like "grab bars", "lighting", "flooring", etc.'),
      title: z.string().describe("Short title of the accessibility issue"),
      description: z.string().describe("Detailed description of the issue and why it matters for aging in place"),
      severity: z.enum(["low", "medium", "high"]),
      estimatedCostMin: z.number().describe("Minimum estimated cost in USD"),
      estimatedCostMax: z.number().describe("Maximum estimated cost in USD"),
      recommendation: z.string().describe("Specific recommendation for modification"),
    }),
  ),
  overallScore: z.number().min(0).max(100).describe("Overall accessibility score from 0-100"),
  summary: z.string().describe("Brief summary of the room accessibility"),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { imageUrl, roomType, notes } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString("base64")
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg"

    const { object } = await generateObject({
      model: "google/gemini-2.5-flash",
      schema: accessibilityAnalysisSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert in aging-in-place home assessments and accessibility modifications.

Analyze this ${roomType || "room"} image for accessibility issues that could affect someone aging in place. 
${notes ? `Additional context from homeowner: ${notes}` : ""}

Consider:
- Grab bar needs and placement opportunities
- Flooring hazards (slippery surfaces, transitions, rugs)
- Lighting adequacy
- Door width and handles
- Counter/cabinet heights
- Electrical outlet accessibility
- Step/stair hazards
- Emergency access concerns

Provide realistic cost estimates for modifications in USD.
Score the room 0-100 where 100 is fully accessible.`,
            },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64Image}`,
            },
          ],
        },
      ],
    })

    // Transform the response to match our types
    const analysis = {
      roomType: object.roomType,
      issues: object.issues.map((issue, index) => ({
        id: `issue-${index}`,
        category: issue.category,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        estimatedCost: {
          min: issue.estimatedCostMin,
          max: issue.estimatedCostMax,
        },
        recommendation: issue.recommendation,
      })),
      overallScore: object.overallScore,
      summary: object.summary,
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 })
  }
}
