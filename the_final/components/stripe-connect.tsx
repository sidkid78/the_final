"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"

interface StripeConnectProps {
  onStatusChange?: (status: StripeStatus) => void
}

interface StripeStatus {
  connected: boolean
  onboardingComplete: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted?: boolean
}

export function StripeConnect({ onStatusChange }: StripeConnectProps) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [status, setStatus] = useState<StripeStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stripeResult = searchParams.get("stripe")

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/contractor/stripe/status")
        if (response.ok) {
          const data = await response.json()
          setStatus(data)
          onStatusChange?.(data)
        }
      } catch (err) {
        console.error("Failed to fetch Stripe status:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
  }, [stripeResult, onStatusChange])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)

    try {
      const response = await fetch("/api/contractor/stripe/create-account", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to create Stripe account")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect Stripe")
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Payment Setup</CardTitle>
          </div>
          {status?.onboardingComplete && (
            <Badge className="bg-primary">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription>Connect your Stripe account to receive payments from homeowners</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stripeResult === "success" && (
          <Alert className="border-primary/20 bg-primary/5 text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Stripe account connected successfully! You can now submit quotes and receive payments.
            </AlertDescription>
          </Alert>
        )}

        {stripeResult === "refresh" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Your Stripe session expired. Please try connecting again.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status?.onboardingComplete ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Charges</span>
              <Badge variant={status.chargesEnabled ? "default" : "secondary"}>
                {status.chargesEnabled ? "Enabled" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Payouts</span>
              <Badge variant={status.payoutsEnabled ? "default" : "secondary"}>
                {status.payoutsEnabled ? "Enabled" : "Pending"}
              </Badge>
            </div>
            <Button variant="outline" className="w-full bg-transparent" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Manage Stripe Account
            </Button>
          </div>
        ) : status?.connected ? (
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your Stripe account setup is incomplete. Please finish the onboarding process.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Complete Setup
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to start receiving leads and submitting quotes. Stripe handles all payment
              processing securely.
            </p>
            <Button className="w-full" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Connect Stripe Account
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
