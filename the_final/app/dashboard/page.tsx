import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { HomeownerDashboard } from "@/components/homeowner-dashboard"
import { ContractorDashboard } from "@/components/contractor-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const { role } = session.user

  return (
    <DashboardLayout user={session.user}>
      {role === "homeowner" && <HomeownerDashboard user={session.user} />}
      {role === "contractor" && <ContractorDashboard user={session.user} />}
      {role === "admin" && <AdminDashboard />}
    </DashboardLayout>
  )
}
