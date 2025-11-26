"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { StatsCards } from "@/components/stats-cards"
import { PendingVerifications } from "@/components/pending-verifications"
import { ActivityFeed } from "@/components/activity-feed"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getAdminStats,
  getPendingContractors,
  getRecentActivity,
  type AdminStats,
} from "@/lib/admin-functions"
import type { ContractorProfile } from "@/lib/user"

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingContractors, setPendingContractors] = useState<ContractorProfile[]>([])
  const [activities, setActivities] = useState<{ type: string; message: string; timestamp: Date }[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsData, contractorsData, activityData] = await Promise.all([
        getAdminStats(),
        getPendingContractors(),
        getRecentActivity(),
      ])
      setStats(statsData)
      setPendingContractors(contractorsData)
      setActivities(activityData)
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchData()
    }
  }, [status, fetchData])

  if (status === "loading") {
    return <AdminSkeleton />
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    redirect("/dashboard")
  }

  if (loading || !stats) {
    return <AdminSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor platform activity and manage users</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PendingVerifications contractors={pendingContractors} onRefresh={fetchData} />
        <ActivityFeed activities={activities} />
      </div>
    </div>
  )
}

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
