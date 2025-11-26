"use client"

import type { Assessment, AccessibilityIssue } from "@/lib/assessment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, ArrowRight, Download, Share2, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface AssessmentResultsProps {
  assessment: Assessment
}

function getSeverityColor(severity: AccessibilityIssue["severity"]) {
  switch (severity) {
    case "high":
      return "bg-destructive text-destructive-foreground"
    case "medium":
      return "bg-accent text-accent-foreground"
    case "low":
      return "bg-muted text-muted-foreground"
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-primary"
  if (score >= 60) return "text-accent"
  return "text-destructive"
}

export function AssessmentResults({ assessment }: AssessmentResultsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalIssues = assessment.rooms.reduce((sum, room) => sum + room.issues.length, 0)
  const highPriorityIssues = assessment.rooms.reduce(
    (sum, room) => sum + room.issues.filter((i) => i.severity === "high").length,
    0,
  )

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(assessment.overallScore)}`}>
              {assessment.overallScore}
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <Progress value={assessment.overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalIssues}</div>
            <p className="text-sm text-muted-foreground mt-1">{highPriorityIssues} high priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(assessment.totalEstimate.min)}</div>
            <p className="text-sm text-muted-foreground mt-1">to {formatCurrency(assessment.totalEstimate.max)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rooms Assessed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assessment.rooms.length}</div>
            <p className="text-sm text-muted-foreground mt-1">rooms analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{assessment.summary}</p>
        </CardContent>
      </Card>

      {/* Room Details */}
      <Card>
        <CardHeader>
          <CardTitle>Room-by-Room Analysis</CardTitle>
          <CardDescription>Detailed accessibility findings for each room</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={`room-0`}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {assessment.rooms.map((room, index) => (
                <TabsTrigger key={index} value={`room-${index}`} className="capitalize">
                  {room.roomType.replace("_", " ")}
                </TabsTrigger>
              ))}
            </TabsList>

            {assessment.rooms.map((room, roomIndex) => (
              <TabsContent key={roomIndex} value={`room-${roomIndex}`} className="mt-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Room Images */}
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={room.imageUrl || "/placeholder.svg"}
                        alt={`${room.roomType} original`}
                        fill
                        className="object-cover"
                      />
                      <Badge className="absolute top-2 left-2">Original</Badge>
                    </div>

                    {room.visualizationUrl && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={room.visualizationUrl || "/placeholder.svg"}
                          alt={`${room.roomType} with modifications`}
                          fill
                          className="object-cover"
                        />
                        <Badge className="absolute top-2 left-2 bg-primary">
                          <Eye className="mr-1 h-3 w-3" />
                          With Modifications
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Room Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(room.overallScore)}`}>
                          {room.overallScore}/100
                        </p>
                      </div>
                      <Progress value={room.overallScore} className="w-32" />
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-3">
                    <h4 className="font-medium">
                      Found {room.issues.length} issue{room.issues.length !== 1 ? "s" : ""}
                    </h4>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {room.issues.map((issue) => (
                        <Card key={issue.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {issue.category}
                                </Badge>
                                <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                              </div>
                              <h5 className="font-medium">{issue.title}</h5>
                              <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                <p className="text-sm font-medium">Recommendation:</p>
                                <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                              </div>
                              <div className="flex items-center gap-1 mt-3 text-sm">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {formatCurrency(issue.estimatedCost.min)} - {formatCurrency(issue.estimatedCost.max)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/dashboard/quotes">
            Get Contractor Quotes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share Assessment
        </Button>
      </div>
    </div>
  )
}
