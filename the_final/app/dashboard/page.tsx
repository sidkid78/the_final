import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { HomeownerDashboard } from "@/components/homeowner-dashboard"
import { ContractorDashboard } from "@/components/contractor-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"
import { getContractorProfile, getContractorLeadsAdmin } from "@/lib/server-admin-functions"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const { role } = session.user

  // Fetch contractor-specific data if user is a contractor
  let contractorProfile = null
  let contractorLeads: Awaited<ReturnType<typeof getContractorLeadsAdmin>> = []

  if (role === "contractor") {
    try {
      [contractorProfile, contractorLeads] = await Promise.all([
        getContractorProfile(session.user.id),
        getContractorLeadsAdmin(session.user.id)
      ])
    } catch (error) {
      console.error("Failed to fetch contractor data:", error)
    }
  }

  return (
    <DashboardLayout user={session.user}>
      {role === "homeowner" && <HomeownerDashboard user={session.user} />}
      {role === "contractor" && (
        <ContractorDashboard
          user={session.user}
          profile={contractorProfile}
          leads={contractorLeads}
        />
      )}
      {role === "admin" && <AdminDashboard />}
    </DashboardLayout>
  )
}

