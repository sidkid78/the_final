"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageUpload } from "@/components/image-upload"
import { AssessmentProgress } from "@/components/assessment-progress"
import { AssessmentResults } from "@/components/assessment-results"
import type { Assessment, AssessmentStatus, AssessmentUpload, RoomAssessment } from "@/lib/assessment"
import { uploadAssessmentImage, uploadVisualization } from "@/lib/storage-functions"
import { createAssessment, updateAssessmentResults } from "@/lib/assessment-functions"
import { Loader2, AlertCircle, Camera, Trash2 } from "lucide-react"
import Image from "next/image"

interface PendingUpload extends AssessmentUpload {
  preview: string
}

export default function NewAssessmentPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [uploads, setUploads] = useState<PendingUpload[]>([])
  const [status, setStatus] = useState<AssessmentStatus>("uploading")
  const [currentRoom, setCurrentRoom] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpload = (upload: AssessmentUpload) => {
    const reader = new FileReader()
    reader.onload = () => {
      setUploads((prev) => [...prev, { ...upload, preview: reader.result as string }])
    }
    reader.readAsDataURL(upload.file)
  }

  const handleRemoveUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index))
  }

  const processAssessment = async () => {
    if (!session?.user?.id || uploads.length === 0) return

    setIsProcessing(true)
    setError(null)

    try {
      // Create assessment in Firestore
      const assessmentId = await createAssessment(session.user.id)

      // Upload images and analyze each room
      setStatus("analyzing")
      const rooms: RoomAssessment[] = []
      let totalMin = 0
      let totalMax = 0

      for (let i = 0; i < uploads.length; i++) {
        setCurrentRoom(i + 1)
        const upload = uploads[i]

        // Upload image to Firebase Storage
        const imageUrl = await uploadAssessmentImage(session.user.id, assessmentId, upload.file, i)

        // Analyze with Gemini
        const analysisResponse = await fetch("/api/assessment/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            roomType: upload.roomType,
            notes: upload.notes,
          }),
        })

        if (!analysisResponse.ok) {
          throw new Error("Failed to analyze room")
        }

        const analysis = await analysisResponse.json()

        // Calculate totals
        const roomMinCost = analysis.issues.reduce(
          (sum: number, issue: { estimatedCost: { min: number } }) => sum + issue.estimatedCost.min,
          0,
        )
        const roomMaxCost = analysis.issues.reduce(
          (sum: number, issue: { estimatedCost: { max: number } }) => sum + issue.estimatedCost.max,
          0,
        )
        totalMin += roomMinCost
        totalMax += roomMaxCost

        // Generate visualization
        setStatus("generating")
        let visualizationUrl: string | undefined

        if (analysis.issues.length > 0) {
          try {
            const vizResponse = await fetch("/api/assessment/visualize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl,
                modifications: analysis.issues.slice(0, 5), // Top 5 issues
              }),
            })

            if (vizResponse.ok) {
              const vizData = await vizResponse.json()
              if (vizData.visualization) {
                visualizationUrl = await uploadVisualization(
                  session.user.id,
                  assessmentId,
                  vizData.visualization.base64,
                  i,
                )
              }
            }
          } catch (vizError) {
            console.error("Visualization failed:", vizError)
            // Continue without visualization
          }
        }

        rooms.push({
          roomType: analysis.roomType,
          imageUrl,
          issues: analysis.issues,
          overallScore: analysis.overallScore,
          visualizationUrl,
          analyzedAt: new Date(),
        })
      }

      // Calculate overall score
      const overallScore = Math.round(rooms.reduce((sum, room) => sum + room.overallScore, 0) / rooms.length)

      // Generate summary
      const summaryParts = []
      if (overallScore >= 80) {
        summaryParts.push("Your home is in good shape for aging in place with minor improvements recommended.")
      } else if (overallScore >= 60) {
        summaryParts.push("Your home needs some modifications to be fully accessible for aging in place.")
      } else {
        summaryParts.push("Your home requires significant modifications for safe aging in place.")
      }

      const totalIssues = rooms.reduce((sum, room) => sum + room.issues.length, 0)
      const highPriority = rooms.reduce((sum, room) => sum + room.issues.filter((i) => i.severity === "high").length, 0)

      summaryParts.push(
        `We identified ${totalIssues} potential improvement${totalIssues !== 1 ? "s" : ""} across ${rooms.length} room${rooms.length !== 1 ? "s" : ""}, with ${highPriority} high-priority item${highPriority !== 1 ? "s" : ""} that should be addressed soon.`,
      )

      const completedAssessment: Assessment = {
        id: assessmentId,
        userId: session.user.id,
        status: "complete",
        rooms,
        totalEstimate: { min: totalMin, max: totalMax },
        overallScore,
        summary: summaryParts.join(" "),
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      }

      // Save results to Firestore
      await updateAssessmentResults(assessmentId, {
        rooms,
        totalEstimate: { min: totalMin, max: totalMax },
        overallScore,
        summary: completedAssessment.summary,
      })

      setAssessment(completedAssessment)
      setStatus("complete")
    } catch (err) {
      console.error("Assessment error:", err)
      setError(err instanceof Error ? err.message : "Failed to process assessment")
      setStatus("uploading")
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === "complete" && assessment) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assessment Complete</h1>
          <p className="text-muted-foreground mt-1">Review your AI-powered home accessibility assessment</p>
        </div>
        <AssessmentResults assessment={assessment} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Assessment</h1>
        <p className="text-muted-foreground mt-1">
          Upload photos of your rooms for an AI-powered accessibility evaluation
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <AssessmentProgress status={status} currentRoom={currentRoom} totalRooms={uploads.length} />
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isProcessing && status === "uploading" && (
        <>
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Add Room Photos
              </CardTitle>
              <CardDescription>
                Upload clear photos of each room you want assessed. Include different angles for better analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload onUpload={handleUpload} disabled={isProcessing} />
            </CardContent>
          </Card>

          {/* Pending Uploads */}
          {uploads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rooms to Assess ({uploads.length})</CardTitle>
                <CardDescription>Review your selected rooms before starting the assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {uploads.map((upload, index) => (
                    <div key={index} className="relative group">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={upload.preview || "/placeholder.svg"}
                          alt={`${upload.roomType} preview`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white font-medium capitalize text-sm">
                            {upload.roomType.replace("_", " ")}
                          </p>
                          {upload.notes && <p className="text-white/70 text-xs truncate">{upload.notes}</p>}
                        </div>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveUpload(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={processAssessment} disabled={uploads.length === 0} size="lg">
                    Start Assessment ({uploads.length} room{uploads.length !== 1 ? "s" : ""})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {isProcessing && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="font-semibold text-lg">
                {status === "analyzing" && "Analyzing your rooms..."}
                {status === "generating" && "Generating visualizations..."}
              </h3>
              <p className="text-muted-foreground mt-1">This may take a few minutes. Please don't close this page.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
