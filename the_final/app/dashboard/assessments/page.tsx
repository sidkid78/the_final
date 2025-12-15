import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { getAssessmentsForUser } from "@/lib/server-admin-functions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Camera, Clock, ArrowRight, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function AssessmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  let assessments: Awaited<ReturnType<typeof getAssessmentsForUser>> = []

  try {
    assessments = await getAssessmentsForUser(session.user.id)
  } catch (error) {
    console.error("Failed to fetch assessments:", error)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Assessments</h1>
          <p className="text-muted-foreground mt-1">View and manage your home accessibility assessments</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/assessment">
            <Camera className="mr-2 h-4 w-4" />
            New Assessment
          </Link>
        </Button>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No assessments yet</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Start your first assessment to get AI-powered recommendations for aging-in-place modifications
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/assessment">
                  Start Your First Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-video bg-muted">
                {assessment.rooms[0]?.imageUrl ? (
                  <Image
                    src={assessment.rooms[0].imageUrl || "/placeholder.svg"}
                    alt="Assessment preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={assessment.status === "complete" ? "default" : "secondary"}>
                    {assessment.status === "complete" ? "Complete" : "In Progress"}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDate(assessment.createdAt)}
                </div>
                <CardTitle className="text-lg">
                  {assessment.rooms.length} Room{assessment.rooms.length !== 1 ? "s" : ""} Assessed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assessment.status === "complete" && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium">{assessment.overallScore}/100</span>
                    </div>
                    <Progress value={assessment.overallScore} />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Cost</span>
                      <span className="font-medium">
                        {formatCurrency(assessment.totalEstimate.min)} - {formatCurrency(assessment.totalEstimate.max)}
                      </span>
                    </div>
                  </>
                )}
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href={`/dashboard/assessments/${assessment.id}`}>
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
