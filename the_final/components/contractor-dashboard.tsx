import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, DollarSign, Star, Users, ArrowRight, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ContractorDashboardProps {
  user: {
    name: string
    email: string
  }
}

export function ContractorDashboard({ user }: ContractorDashboardProps) {
  // In a real app, these would be fetched from Firestore
  const stats = {
    activeLeads: 0,
    pendingQuotes: 0,
    completedJobs: 0,
    rating: null as number | null,
  }

  const stripeOnboarded = false // Would come from user profile
  const profileComplete = false // Would check services and service areas

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name?.split(" ")[0] || "there"}</h1>
        <p className="text-muted-foreground mt-1">Manage your leads and grow your business</p>
      </div>

      {/* Onboarding Alerts */}
      {(!stripeOnboarded || !profileComplete) && (
        <div className="space-y-3">
          {!profileComplete && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Complete Your Profile</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-3">Add your services and service areas to start receiving leads.</p>
                <Button asChild size="sm">
                  <Link href="/dashboard/profile">
                    Complete Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {!stripeOnboarded && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Set Up Payments</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-3">Connect your Stripe account to submit quotes and receive payments.</p>
                <Button asChild size="sm">
                  <Link href="/dashboard/profile">
                    Connect Stripe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Leads</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Quotes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingQuotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Jobs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rating ? `${stats.rating.toFixed(1)}` : "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>New opportunities in your service area</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/leads/contractor">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No leads yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Complete your profile to start receiving leads from homeowners in your area
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
