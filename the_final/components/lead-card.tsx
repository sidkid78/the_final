import type { Lead } from "@/lib/lead"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, DollarSign, ArrowRight, Users } from "lucide-react"
import Link from "next/link"

interface LeadCardProps {
  lead: Lead
  viewType?: "homeowner" | "contractor"
}

const statusColors: Record<Lead["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  matched: "bg-accent text-accent-foreground",
  quoted: "bg-primary/10 text-primary",
  accepted: "bg-primary text-primary-foreground",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

const statusLabels: Record<Lead["status"], string> = {
  pending: "Finding Contractors",
  matched: "Contractors Matched",
  quoted: "Quotes Received",
  accepted: "Quote Accepted",
  completed: "Completed",
  cancelled: "Cancelled",
}

const urgencyLabels: Record<Lead["urgency"], string> = {
  low: "Flexible Timeline",
  medium: "1-2 Months",
  high: "Urgent",
}

export function LeadCard({ lead, viewType = "homeowner" }: LeadCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              {formatDate(lead.createdAt)}
            </div>
            <h3 className="font-semibold">
              {lead.projectType
                .slice(0, 3)
                .map((t) => t.replace("_", " "))
                .join(", ")}
              {lead.projectType.length > 3 && ` +${lead.projectType.length - 3} more`}
            </h3>
          </div>
          <Badge className={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {lead.address.city}, {lead.address.state} {lead.address.zip}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatCurrency(lead.budget.min)} - {formatCurrency(lead.budget.max)}
            </span>
          </div>
          <Badge variant="outline">{urgencyLabels[lead.urgency]}</Badge>
        </div>

        {viewType === "homeowner" && lead.matchedContractors.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {lead.matchedContractors.length} contractor{lead.matchedContractors.length !== 1 ? "s" : ""} matched
            </span>
          </div>
        )}

        <Button variant="outline" className="w-full bg-transparent" asChild>
          <Link href={viewType === "contractor" ? `/dashboard/leads/contractor/${lead.id}` : `/dashboard/leads/${lead.id}`}>
            {viewType === "homeowner" ? "View Quotes" : "View Lead"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
