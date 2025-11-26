"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { format } from "date-fns"
import type { Lead } from "@/lib/lead"
import Link from "next/link"

interface LeadsTableProps {
  leads: Lead[]
}

export function LeadsTable({ leads }: LeadsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      pending: "secondary",
      matched: "outline",
      quoted: "default",
      accepted: "default",
      completed: "default",
      cancelled: "destructive",
    }
    const colors: Record<string, string> = {
      completed: "bg-green-600",
      accepted: "bg-blue-600",
    }
    return (
      <Badge variant={variants[status] || "outline"} className={colors[status] || ""}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Homeowner</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium max-w-[200px] truncate">{lead.title}</TableCell>
                <TableCell>{lead.homeownerName || "—"}</TableCell>
                <TableCell>
                  {lead.address.city}, {lead.address.state}
                </TableCell>
                <TableCell>
                  ${lead.budgetMin?.toLocaleString()} - ${lead.budgetMax?.toLocaleString()}
                </TableCell>
                <TableCell>{getStatusBadge(lead.status)}</TableCell>
                <TableCell>{format(lead.createdAt, "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/leads/${lead.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
