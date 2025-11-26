import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { getHomeownerLeads } from "@/lib/lead-functions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LeadCard } from "@/components/lead-card"
import { Briefcase, Plus } from "lucide-react"
import Link from "next/link"

export default async function LeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  let leads: Awaited<ReturnType<typeof getHomeownerLeads>> = []

  try {
    leads = await getHomeownerLeads(session.user.id)
  } catch (error) {
    console.error("Failed to fetch leads:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Leads</h1>
          <p className="text-muted-foreground mt-1">Track your project requests and contractor quotes</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/quotes">
            <Plus className="mr-2 h-4 w-4" />
            New Quote Request
          </Link>
        </Button>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No leads yet</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Complete an assessment and request quotes to connect with contractors
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/assessment">Start an Assessment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} viewType="homeowner" />
          ))}
        </div>
      )}
    </div>
  )
}
