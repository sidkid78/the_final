"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { LeadsTable } from "@/components/leads-table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"
import { getAllLeads } from "@/lib/admin-functions"
import type { Lead } from "@/lib/lead"

export default function AdminLeadsPage() {
  const { data: session, status } = useSession()
  const [leads, setLeads] = useState<Lead[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllLeads(statusFilter)
      setLeads(data)
    } catch (error) {
      console.error("Failed to fetch leads:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (status === "authenticated") {
      fetchLeads()
    }
  }, [status, fetchLeads])

  if (status === "loading") {
    return <LeadsSkeleton />
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and oversee all platform leads</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchLeads}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leads</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="matched">Matched</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <Skeleton className="h-96" /> : <LeadsTable leads={leads} />}
    </div>
  )
}

function LeadsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-10" />
      </div>
      <Skeleton className="h-10 w-44" />
      <Skeleton className="h-96" />
    </div>
  )
}
