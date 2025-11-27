import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect, notFound } from "next/navigation"
import { getAssessmentById } from "@/lib/server-admin-functions"
import { CreateLeadForm } from "@/components/create-lead-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CreateQuotePageProps {
  params: Promise<{ id: string }>
}

export default async function CreateQuotePage({ params }: CreateQuotePageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const assessment = await getAssessmentById(id)

  if (!assessment || assessment.userId !== session.user.id) {
    notFound()
  }

  if (assessment.status !== "complete") {
    redirect("/dashboard/assessments")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/quotes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Request Contractor Quotes</h1>
          <p className="text-muted-foreground mt-1">Provide your location to match with local contractors</p>
        </div>
      </div>

      <CreateLeadForm assessment={assessment} />
    </div>
  )
}
