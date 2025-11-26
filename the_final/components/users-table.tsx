"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle, Ban, Eye } from "lucide-react"
import { format } from "date-fns"
import type { AnyUserProfile } from "@/lib/user"
import { suspendUser, verifyContractor } from "@/lib/admin-functions"

interface UsersTableProps {
  users: AnyUserProfile[]
  onRefresh: () => void
}

export function UsersTable({ users, onRefresh }: UsersTableProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleVerify = async (userId: string) => {
    setLoading(userId)
    try {
      await verifyContractor(userId)
      onRefresh()
    } catch (error) {
      console.error("Failed to verify contractor:", error)
    } finally {
      setLoading(null)
    }
  }

  const handleSuspend = async (userId: string, suspend: boolean) => {
    setLoading(userId)
    try {
      await suspendUser(userId, suspend)
      onRefresh()
    } catch (error) {
      console.error("Failed to update user:", error)
    } finally {
      setLoading(null)
    }
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      admin: "default",
      contractor: "secondary",
      homeowner: "outline",
    }
    return <Badge variant={variants[role] || "outline"}>{role}</Badge>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.displayName || "—"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>
                  {"suspended" in user && user.suspended ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : user.role === "contractor" && "verified" in user ? (
                    user.verified ? (
                      <Badge variant="default" className="bg-green-600">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </TableCell>
                <TableCell>{format(user.createdAt, "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={loading === user.uid}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {user.role === "contractor" && "verified" in user && !user.verified && (
                        <DropdownMenuItem onClick={() => handleVerify(user.uid)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify Contractor
                        </DropdownMenuItem>
                      )}
                      {"suspended" in user && user.suspended ? (
                        <DropdownMenuItem onClick={() => handleSuspend(user.uid, false)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Unsuspend User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleSuspend(user.uid, true)} className="text-destructive">
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
