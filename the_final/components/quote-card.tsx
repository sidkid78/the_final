"use client"

import { useState } from "react"
import type { Quote } from "@/lib/lead"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Clock, Calendar, CheckCircle2, Loader2 } from "lucide-react"
import { acceptQuote } from "@/lib/lead-functions"

interface QuoteCardProps {
  quote: Quote
  onAccept?: () => void
  showActions?: boolean
}

const statusColors: Record<Quote["status"], string> = {
  pending: "bg-accent text-accent-foreground",
  accepted: "bg-primary text-primary-foreground",
  rejected: "bg-muted text-muted-foreground",
  expired: "bg-destructive/10 text-destructive",
}

export function QuoteCard({ quote, onAccept, showActions = true }: QuoteCardProps) {
  const [accepting, setAccepting] = useState(false)

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
      year: "numeric",
    }).format(date)
  }

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await acceptQuote(quote.id, quote.leadId)
      onAccept?.()
    } catch (error) {
      console.error("Failed to accept quote:", error)
    } finally {
      setAccepting(false)
    }
  }

  const initials = quote.contractorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const isExpired = quote.validUntil < new Date()
  const canAccept = quote.status === "pending" && !isExpired

  return (
    <Card className={quote.status === "accepted" ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{quote.contractorName}</h3>
              <p className="text-sm text-muted-foreground">{quote.contractorCompany}</p>
            </div>
          </div>
          <Badge className={statusColors[isExpired && quote.status === "pending" ? "expired" : quote.status]}>
            {quote.status === "accepted" && <CheckCircle2 className="mr-1 h-3 w-3" />}
            {isExpired && quote.status === "pending"
              ? "Expired"
              : quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="text-muted-foreground">Total Quote</span>
          <span className="text-2xl font-bold">{formatCurrency(quote.amount)}</span>
        </div>

        {/* Breakdown */}
        {quote.breakdown.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Breakdown</h4>
            <div className="space-y-1">
              {quote.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.item}</span>
                  <span>{formatCurrency(item.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{quote.estimatedDuration}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Valid until {formatDate(quote.validUntil)}</span>
          </div>
        </div>

        {quote.notes && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">{quote.notes}</p>
          </div>
        )}
      </CardContent>

      {showActions && canAccept && (
        <CardFooter>
          <Button className="w-full" onClick={handleAccept} disabled={accepting}>
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Accept Quote
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
