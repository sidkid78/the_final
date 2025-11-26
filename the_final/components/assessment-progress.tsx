"use client"

import type { AssessmentStatus } from "@/lib/assessment"
import { CheckCircle2, Upload, Brain, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AssessmentProgressProps {
  status: AssessmentStatus
  currentRoom?: number
  totalRooms?: number
}

const steps = [
  { id: "uploading", label: "Upload Photos", icon: Upload },
  { id: "analyzing", label: "AI Analysis", icon: Brain },
  { id: "generating", label: "Visualizations", icon: Sparkles },
  { id: "complete", label: "Complete", icon: CheckCircle2 },
]

export function AssessmentProgress({ status, currentRoom, totalRooms }: AssessmentProgressProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === status)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = index < currentStepIndex || status === "complete"
          const isCurrent = step.id === status && status !== "complete"
          const Icon = step.icon

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 transition-colors",
                      isComplete || isCurrent ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors",
                    isComplete && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary",
                    !isComplete && !isCurrent && "border-border text-muted-foreground",
                  )}
                >
                  {isCurrent ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 transition-colors",
                      index < currentStepIndex ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium",
                  isComplete || isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {currentRoom && totalRooms && status !== "complete" && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Processing room {currentRoom} of {totalRooms}...
        </p>
      )}
    </div>
  )
}
