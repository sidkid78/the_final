import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect, notFound } from "next/navigation"
import { getLead, getLeadQuotes } from "@/lib/lead-functions"
import { getContractorProfile } from "@/lib/contractor-functions"
import { SubmitQuoteForm } from "@/components/submit-quote-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, MapPin, Clock, DollarSign, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface ContractorLeadDetailPageProps {
  params: Promise<{ id: string }>
}

const urgencyLabels: Record<string, string> = {
  low: "Flexible Timeline",
  medium: "1-2 Months",
  high: "Urgent - ASAP",
}

export default async function ContractorLeadDetailPage({ params }: ContractorLeadDetailPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "contractor") {
    redirect("/dashboard")
  }

  const [lead, profile, quotes] = await Promise.all([
    getLead(id),
    getContractorProfile(session.user.id),
    getLeadQuotes(id),
  ])

  if (!lead || !lead.matchedContractors.includes(session.user.id)) {
    notFound()
  }

  if (!profile) {
    redirect("/dashboard")
  }

  const myQuote = quotes.find((q) => q.contractorId === session.user.id)

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
          <h1 className="text-2xl font-semibold tracking-tight">Lead Details</h1>
          <p className="text-muted-foreground mt-1">
            {lead.address.city}, {lead.address.state}
          </p>
        </div>
      </div>

      {/* Stripe Warning */}
      {!profile.stripeOnboardingComplete && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Setup Required</AlertTitle>
          <AlertDescription>
            You need to complete your Stripe setup before you can submit quotes.{" "}
            <Link href="/dashboard/profile" className="underline font-medium">
              Set up payments
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Already Quoted */}
      {myQuote && (
        <Alert className="border-primary/20 bg-primary/5 text-primary">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Quote Submitted</AlertTitle>
          <AlertDescription>
            You submitted a quote of {formatCurrency(myQuote.amount)} on {formatDate(myQuote.createdAt)}. Status:{" "}
            <span className="font-medium capitalize">{myQuote.status}</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lead Info */}
        <div className="space-y-4">
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
                  <p className="text-sm text-muted-foreground">{urgencyLabels[lead.urgency]}</p>
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

        {/* Quote Form */}
        <div className="lg:col-span-2">
          {myQuote ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Quote</CardTitle>
                <CardDescription>Submitted on {formatDate(myQuote.createdAt)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="text-2xl font-bold">{formatCurrency(myQuote.amount)}</span>
                </div>

                {myQuote.breakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Breakdown</h4>
                    <div className="space-y-1">
                      {myQuote.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.item}</span>
                          <span>{formatCurrency(item.cost)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                  <div>
                    <span className="text-muted-foreground">Duration</span>
                    <p className="font-medium">{myQuote.estimatedDuration}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valid Until</span>
                    <p className="font-medium">{formatDate(myQuote.validUntil)}</p>
                  </div>
                </div>

                {myQuote.notes && (
                  <div className="pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <p className="text-sm mt-1">{myQuote.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : profile.stripeOnboardingComplete ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">Submit Your Quote</h2>
              <SubmitQuoteForm lead={lead} />
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">Payment Setup Required</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm">
                    Complete your Stripe setup to submit quotes to homeowners
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/profile">Set Up Payments</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
