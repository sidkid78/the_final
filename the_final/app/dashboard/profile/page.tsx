import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { getContractorProfile } from "@/lib/server-admin-functions"
import { ProfileForm } from "@/components/profile-form"
import { StripeConnect } from "@/components/stripe-connect"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Shield } from "lucide-react"

export default async function ContractorProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "contractor") {
    redirect("/dashboard")
  }

  const profile = await getContractorProfile(session.user.id)

  if (!profile) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Business Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your contractor profile and payment settings</p>
      </div>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              {profile.verified ? (
                <Badge className="bg-primary">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Pending Verification
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {profile.stripeOnboardingComplete ? (
                <Badge className="bg-primary">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Payments Active
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Payments Not Set Up
                </Badge>
              )}
            </div>
          </div>
          {!profile.verified && (
            <p className="text-sm text-muted-foreground mt-4">
              Your account is pending verification. Once verified, you&apos;ll start receiving leads in your service
              areas.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProfileForm profile={profile} />
        </div>
        <div>
          <StripeConnect />
        </div>
      </div>
    </div>
  )
}
