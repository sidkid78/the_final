"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Assessment } from "@/lib/assessment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, MapPin, FileText, Clock } from "lucide-react"

interface CreateLeadFormProps {
  assessment: Assessment
  onSuccess?: (leadId: string) => void
}

export function CreateLeadForm({ assessment, onSuccess }: CreateLeadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
  })
  const [phone, setPhone] = useState("")
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium")
  const [description, setDescription] = useState(assessment.summary)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: assessment.id,
          address,
          phone: phone || undefined,
          urgency,
          description,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create lead")
      }

      const { leadId, matchedContractors } = await response.json()
      setSuccess(true)

      if (onSuccess) {
        onSuccess(leadId)
      } else {
        // Redirect after a short delay
        setTimeout(() => {
          router.push(`/dashboard/leads/${leadId}`)
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Lead Created Successfully!</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              We&apos;re matching you with qualified contractors in your area. You&apos;ll receive quotes soon.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assessment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Summary
            </CardTitle>
            <CardDescription>Based on your assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Rooms Assessed</span>
              <span className="font-medium">{assessment.rooms.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total Issues</span>
              <span className="font-medium">{assessment.rooms.reduce((sum, r) => sum + r.issues.length, 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Estimated Budget</span>
              <span className="font-medium">
                {formatCurrency(assessment.totalEstimate.min)} - {formatCurrency(assessment.totalEstimate.max)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Accessibility Score</span>
              <span className="font-medium">{assessment.overallScore}/100</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Project Location
            </CardTitle>
            <CardDescription>Where the work will be done</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                placeholder="123 Main St"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  placeholder="12345"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Project Details
            </CardTitle>
            <CardDescription>Help contractors understand your needs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="urgency">Timeline / Urgency</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Flexible - No rush</SelectItem>
                  <SelectItem value="medium">Within 1-2 months</SelectItem>
                  <SelectItem value="high">Urgent - ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Additional Notes</Label>
              <Textarea
                id="description"
                placeholder="Any additional information about your project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding Contractors...
                </>
              ) : (
                "Get Contractor Quotes"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
