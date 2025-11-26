"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  type: string
  message: string
  timestamp: Date
  userId?: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "user_joined":
        return <Users className="h-4 w-4 text-blue-500" />
      case "lead_created":
        return <FileText className="h-4 w-4 text-green-500" />
      case "verification":
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
