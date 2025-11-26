import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { generateText } from "ai"

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

    // Create a detailed prompt for the visualization
    const modificationsText = modifications
      .map((m: { title: string; recommendation: string }) => `- ${m.title}: ${m.recommendation}`)
      .join("\n")

    const result = await generateText({
      model: "google/gemini-3-pro-image-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Generate a realistic visualization of this room with the following aging-in-place modifications applied:

${modificationsText}

The visualization should:
- Maintain the same room layout and perspective
- Show the modifications clearly integrated into the space
- Look realistic and professionally done
- Use appropriate colors and materials that match the existing decor

Please generate an image showing how this room would look after these accessibility modifications are installed.`,
            },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64Image}`,
            },
          ],
        },
      ],
    })

    // Extract generated images from the result
    const images = []
    for (const file of result.files || []) {
      if (file.mediaType.startsWith("image/")) {
        images.push({
          base64: file.base64,
          mediaType: file.mediaType,
        })
      }
    }

    if (images.length === 0) {
      // If no image was generated, return an error
      return NextResponse.json({ error: "Failed to generate visualization", text: result.text }, { status: 500 })
    }

    return NextResponse.json({
      visualization: images[0],
      text: result.text,
    })
  } catch (error) {
    console.error("Visualization error:", error)
    return NextResponse.json({ error: "Failed to generate visualization" }, { status: 500 })
  }
}
