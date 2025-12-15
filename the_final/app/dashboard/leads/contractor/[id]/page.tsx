import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect, notFound } from "next/navigation"
import { getLeadAdmin, getLeadQuotesAdmin, getContractorProfile } from "@/lib/server-admin-functions"
import { SubmitQuoteForm } from "@/components/submit-quote-form"
import { PurchaseLeadButton } from "@/components/purchase-lead-button"
import { PurchaseVerifier } from "@/components/purchase-verifier"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, MapPin, Clock, DollarSign, FileText, AlertCircle, CheckCircle2, Lock, User, Phone } from "lucide-react"
import Link from "next/link"

interface ContractorLeadDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ purchase?: string }>
}

const urgencyLabels: Record<string, string> = {
  low: "Flexible Timeline",
  medium: "1-2 Months",
  high: "Urgent - ASAP",
}

export default async function ContractorLeadDetailPage({ params, searchParams }: ContractorLeadDetailPageProps) {
  const { id } = await params
  const { purchase } = await searchParams
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "contractor") {
    redirect("/dashboard")
  }

  const [lead, profile, quotes] = await Promise.all([
    getLeadAdmin(id),
    getContractorProfile(session.user.id),
    getLeadQuotesAdmin(id),
  ])

  if (!lead || !lead.matchedContractors.includes(session.user.id)) {
    notFound()
  }

  if (!profile) {
    redirect("/dashboard")
  }

  // Check if contractor has purchased this lead
  const hasPurchased = lead.purchasedBy?.includes(session.user.id) ?? false
  const myQuote = quotes.find((q) => q.contractorId === session.user.id)
  const leadPrice = lead.price || 2500 // Default $25

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatCurrencyFromCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100)
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
          <Link href="/dashboard/leads/contractor">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Lead Details</h1>
          <p className="text-muted-foreground mt-1">
            {lead.address.city}, {lead.address.state}
          </p>
        </div>
        {hasPurchased && (
          <Badge className="bg-primary text-primary-foreground">Purchased</Badge>
        )}
      </div>

      {/* Purchase Success Message - uses client component for verification */}
      {purchase === "success" && !hasPurchased && (
        <PurchaseVerifier leadId={id} />
      )}

      {/* Already purchased success message */}
      {purchase === "success" && hasPurchased && (
        <Alert className="border-primary/20 bg-primary/5 text-primary">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Lead Purchased Successfully!</AlertTitle>
          <AlertDescription>
            You now have access to the homeowner's full contact details. Submit your quote below.
          </AlertDescription>
        </Alert>
      )}

      {/* Stripe Warning */}
      {!profile.stripeOnboardingComplete && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Setup Required</AlertTitle>
          <AlertDescription>
            You need to complete your Stripe setup before you can purchase leads.{" "}
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
                    {hasPurchased ? (
                      <>
                        {lead.address.street}<br />
                        {lead.address.city}, {lead.address.state} {lead.address.zip}
                      </>
                    ) : (
                      <>
                        {lead.address.city}, {lead.address.state} {lead.address.zip}
                      </>
                    )}
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

          {/* Contact Info - Only shown after purchase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {hasPurchased ? <User className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                Homeowner Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasPurchased ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lead.homeownerName}</span>
                  </div>
                  {lead.homeownerPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${lead.homeownerPhone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {lead.homeownerPhone}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Purchase this lead to view contact details
                  </p>
                </div>
              )}
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

        {/* Quote Form or Purchase Prompt */}
        <div className="lg:col-span-2">
          {!hasPurchased ? (
            // Not purchased - show purchase prompt
            <Card>
              <CardHeader>
                <CardTitle>Purchase This Lead</CardTitle>
                <CardDescription>
                  Get access to the homeowner's contact details and submit your quote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Lead Price</span>
                  <span className="text-2xl font-bold">{formatCurrencyFromCents(leadPrice)}</span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Full contact details (name, phone, address)</p>
                  <p>✓ Ability to submit a personalized quote</p>
                  <p>✓ Direct communication with the homeowner</p>
                </div>

                {profile.stripeOnboardingComplete && profile.verified ? (
                  <PurchaseLeadButton leadId={lead.id} price={leadPrice} />
                ) : (
                  <div className="space-y-3">
                    {!profile.verified && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your account must be verified by an admin before you can purchase leads.
                        </AlertDescription>
                      </Alert>
                    )}
                    {!profile.stripeOnboardingComplete && (
                      <Button asChild className="w-full">
                        <Link href="/dashboard/profile">Complete Stripe Setup</Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : myQuote ? (
            // Purchased and quoted - show quote details
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
            // Purchased but not quoted - show quote form
            <div>
              <h2 className="text-lg font-semibold mb-4">Submit Your Quote</h2>
              <SubmitQuoteForm lead={lead} />
            </div>
          ) : (
            // Purchased but Stripe not set up
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

