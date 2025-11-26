import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { GoogleGenAI } from "@google/genai"

// Manual Schema Definition for @google/genai SDK which uses string enums for types
const accessibilityAnalysisSchema = {
  type: "OBJECT",
  properties: {
    roomType: {
      type: "STRING",
      enum: ["bathroom", "bedroom", "kitchen", "stairs", "entrance", "hallway", "living_room", "other"],
    },
    issues: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          category: {
            type: "STRING",
            description: 'Category like "grab bars", "lighting", "flooring", etc.',
          },
          title: {
            type: "STRING",
            description: "Short title of the accessibility issue",
          },
          description: {
            type: "STRING",
            description: "Detailed description of the issue and why it matters for aging in place",
          },
          severity: {
            type: "STRING",
            enum: ["low", "medium", "high"],
          },
          estimatedCostMin: {
            type: "NUMBER",
            description: "Minimum estimated cost in USD",
          },
          estimatedCostMax: {
            type: "NUMBER",
            description: "Maximum estimated cost in USD",
          },
          recommendation: {
            type: "STRING",
            description: "Specific recommendation for modification",
          },
        },
        required: ["category", "title", "description", "severity", "estimatedCostMin", "estimatedCostMax", "recommendation"],
      },
    },
    overallScore: {
      type: "NUMBER",
      description: "Overall accessibility score from 0-100",
    },
    summary: {
      type: "STRING",
      description: "Brief summary of the room accessibility",
    },
  },
  required: ["roomType", "issues", "overallScore", "summary"],
}

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

    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Google AI API key not configured" }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })

    const prompt = `You are an expert in aging-in-place home assessments and accessibility modifications.

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
Score the room 0-100 where 100 is fully accessible.`

    // Use client.models.generateContent directly
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: accessibilityAnalysisSchema,
      }
    })

    // The response in the new SDK is often accessed via .text() helper or specific path
    // If result has a .text() method, use it. Otherwise access candidates[0].content.parts[0].text
    let responseText: string | undefined;
    
    if (result.text) {
        responseText = result.text;
    } else if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
        responseText = result.candidates[0].content.parts[0].text || "{}";
    }

    if (!responseText) {
        throw new Error("Empty response from AI");
    }
    
    const object = JSON.parse(responseText)

    // Transform the response to match our types
    const analysis = {
      roomType: object.roomType,
      issues: object.issues.map((issue: {
        category: string;
        title: string;
        description: string;
        severity: string;
        estimatedCostMin: number;
        estimatedCostMax: number;
        recommendation: string;
      }, index: number) => ({
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
