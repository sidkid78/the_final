import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { getContractorLeadsAdmin } from "@/lib/server-admin-functions"
import { Card, CardContent } from "@/components/ui/card"
import { LeadCard } from "@/components/lead-card"
import { Briefcase } from "lucide-react"

export default async function ContractorLeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "contractor") {
    redirect("/dashboard")
  }

  let leads: Awaited<ReturnType<typeof getContractorLeadsAdmin>> = []

  try {
    leads = await getContractorLeadsAdmin(session.user.id)
  } catch (error) {
    console.error("Failed to fetch leads:", error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Available Leads</h1>
        <p className="text-muted-foreground mt-1">New opportunities matched to your service areas and expertise</p>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No leads available</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Make sure your profile is complete and you have service areas set up to receive matching leads
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} viewType="contractor" />
          ))}
        </div>
      )}
    </div>
  )
}
