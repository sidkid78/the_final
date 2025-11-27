import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { getAssessmentsForUser } from "@/lib/server-admin-functions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function QuotesPage() {
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

  const completedAssessments = assessments.filter((a) => a.status === "complete")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Get Contractor Quotes</h1>
        <p className="text-muted-foreground mt-1">Select an assessment to request quotes from local contractors</p>
      </div>

      {completedAssessments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No completed assessments</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Complete a home assessment first to request quotes from contractors
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/assessment">Start an Assessment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {completedAssessments.map((assessment) => (
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
                <Badge className="absolute top-2 right-2 bg-primary">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Complete
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardDescription>{formatDate(assessment.createdAt)}</CardDescription>
                <CardTitle className="text-lg">
                  {assessment.rooms.length} Room{assessment.rooms.length !== 1 ? "s" : ""} Assessed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Cost</span>
                  <span className="font-medium">
                    {formatCurrency(assessment.totalEstimate.min)} - {formatCurrency(assessment.totalEstimate.max)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-medium">{assessment.overallScore}/100</span>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/quotes/${assessment.id}`}>
                    Request Quotes
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
