export type AssessmentStatus = "uploading" | "analyzing" | "generating" | "complete" | "failed"

export type RoomType = "bathroom" | "bedroom" | "kitchen" | "stairs" | "entrance" | "hallway" | "living_room" | "other"

export interface AccessibilityIssue {
  id: string
  category: string
  title: string
  description: string
  severity: "low" | "medium" | "high"
  estimatedCost: {
    min: number
    max: number
  }
  recommendation: string
}

export interface RoomAssessment {
  roomType: RoomType
  imageUrl: string
  thumbnailUrl?: string
  issues: AccessibilityIssue[]
  overallScore: number // 0-100
  visualizationUrl?: string
  analyzedAt: Date
}

export interface Assessment {
  id: string
  userId: string
  status: AssessmentStatus
  rooms: RoomAssessment[]
  totalEstimate: {
    min: number
    max: number
  }
  overallScore: number
  summary: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface AssessmentUpload {
  file: File
  roomType: RoomType
  notes?: string
}
