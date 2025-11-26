"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { UsersTable } from "@/components/users-table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"
import { getAllUsers } from "@/lib/admin-functions"
import type { AnyUserProfile } from "@/lib/user"

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<AnyUserProfile[]>([])
  const [roleFilter, setRoleFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllUsers(roleFilter)
      setUsers(data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }, [roleFilter])

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers()
    }
  }, [status, fetchUsers])

  if (status === "loading") {
    return <UsersSkeleton />
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">View and manage all platform users</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="homeowner">Homeowners</SelectItem>
            <SelectItem value="contractor">Contractors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <Skeleton className="h-96" /> : <UsersTable users={users} onRefresh={fetchUsers} />}
    </div>
  )
}

function UsersSkeleton() {
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
