import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect, notFound } from "next/navigation"
import { getAssessment } from "@/lib/assessment-functions"
import { AssessmentResults } from "@/components/assessment-results"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface AssessmentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const assessment = await getAssessment(id)

  if (!assessment || assessment.userId !== session.user.id) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/assessments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assessment Details</h1>
          <p className="text-muted-foreground mt-1">
            {new Intl.DateTimeFormat("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }).format(assessment.createdAt)}
          </p>
        </div>
      </div>

      <AssessmentResults assessment={assessment} />
    </div>
  )
}
