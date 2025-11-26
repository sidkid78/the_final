import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { GoogleGenAI } from "@google/genai"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { imageUrl, modifications } = await req.json()

    if (!imageUrl || !modifications) {
      return NextResponse.json({ error: "Image URL and modifications are required" }, { status: 400 })
    }

    // Fetch the original image
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString("base64")
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg"

    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Google AI API key not configured" }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })
    
    // Create a detailed prompt for the visualization
    const modificationsText = modifications
      .map((m: { title: string; recommendation: string }) => `- ${m.title}: ${m.recommendation}`)
      .join("\n")

    const prompt = `Create a realistic visualization of this room with the following aging-in-place modifications applied:

${modificationsText}

The visualization should:
- Maintain the same room layout and perspective
- Show the modifications clearly integrated into the space
- Look realistic and professionally done
- Use appropriate colors and materials that match the existing decor

Please generate an image showing how this room would look after these accessibility modifications are installed.`

    // Use client.models.generateContent directly for image generation
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
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
    })

    // The image generation model returns the image in inlineData
    const images = []
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push({
            base64: part.inlineData.data,
            mediaType: part.inlineData.mimeType || "image/png",
          })
        }
      }
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "Failed to generate visualization" }, { status: 500 })
    }

    return NextResponse.json({
      visualization: images[0],
      text: "Visualization generated successfully",
    })
  } catch (error) {
    console.error("Visualization error:", error)
    return NextResponse.json({ error: "Failed to generate visualization" }, { status: 500 })
  }
}
