import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect, notFound } from "next/navigation"
import { getLead, getLeadQuotes } from "@/lib/lead-functions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QuoteCard } from "@/components/quote-card"
import { ArrowLeft, MapPin, Clock, DollarSign, Users, FileText } from "lucide-react"
import Link from "next/link"

interface LeadDetailPageProps {
  params: Promise<{ id: string }>
}

const statusLabels: Record<string, string> = {
  pending: "Finding Contractors",
  matched: "Contractors Matched",
  quoted: "Quotes Received",
  accepted: "Quote Accepted",
  completed: "Completed",
  cancelled: "Cancelled",
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const lead = await getLead(id)

  if (!lead || lead.homeownerId !== session.user.id) {
    notFound()
  }

  const quotes = await getLeadQuotes(id)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/leads">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Lead Details</h1>
            <Badge>{statusLabels[lead.status]}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Created {formatDate(lead.createdAt)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lead Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {lead.address.street}
                    <br />
                    {lead.address.city}, {lead.address.state} {lead.address.zip}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Budget Range</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(lead.budget.min)} - {formatCurrency(lead.budget.max)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Timeline</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {lead.urgency === "low" ? "Flexible" : lead.urgency === "medium" ? "1-2 Months" : "Urgent"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Matched Contractors</p>
                  <p className="text-sm text-muted-foreground">
                    {lead.matchedContractors.length} contractor{lead.matchedContractors.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lead.projectType.map((type) => (
                  <Badge key={type} variant="outline" className="capitalize">
                    {type.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {lead.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{lead.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quotes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quotes ({quotes.length})</CardTitle>
              <CardDescription>
                {quotes.length === 0
                  ? "Waiting for contractors to submit quotes"
                  : "Review and compare quotes from contractors"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">No quotes yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Matched contractors have been notified and will submit quotes soon
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {quotes.map((quote) => (
                    <QuoteCard key={quote.id} quote={quote} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
