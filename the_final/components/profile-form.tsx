"use client"

import type React from "react"

import { useState } from "react"
import type { ContractorProfile } from "@/lib/user"
import { updateContractorProfile } from "@/lib/contractor-functions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2, Plus, X, Building2, MapPin, Wrench } from "lucide-react"

interface ProfileFormProps {
  profile: ContractorProfile
  onUpdate?: () => void
}

const availableServices = [
  "Grab Bars",
  "Bathroom Modifications",
  "Stairlifts",
  "Ramps",
  "Widened Doorways",
  "Flooring",
  "Lighting",
  "Kitchen Modifications",
  "Walk-in Tubs",
  "Handrails",
  "Non-slip Surfaces",
  "Lever Door Handles",
  "Smart Home",
  "General Accessibility",
]

export function ProfileForm({ profile, onUpdate }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [displayName, setDisplayName] = useState(profile.displayName)
  const [companyName, setCompanyName] = useState(profile.companyName || "")
  const [licenseNumber, setLicenseNumber] = useState(profile.licenseNumber || "")
  const [phone, setPhone] = useState(profile.phone || "")
  const [services, setServices] = useState<string[]>(profile.services || [])
  const [serviceAreas, setServiceAreas] = useState<string[]>(profile.serviceAreas || [])
  const [newArea, setNewArea] = useState("")

  const handleAddArea = () => {
    if (newArea.trim() && !serviceAreas.includes(newArea.trim())) {
      setServiceAreas([...serviceAreas, newArea.trim()])
      setNewArea("")
    }
  }

  const handleRemoveArea = (area: string) => {
    setServiceAreas(serviceAreas.filter((a) => a !== area))
  }

  const handleToggleService = (service: string) => {
    if (services.includes(service)) {
      setServices(services.filter((s) => s !== service))
    } else {
      setServices([...services, service])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await updateContractorProfile(profile.uid, {
        displayName,
        companyName,
        licenseNumber: licenseNumber || undefined,
        phone: phone || undefined,
        services,
        serviceAreas,
      })
      setSuccess(true)
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>Your company details shown to homeowners</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Contact Name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Business LLC"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number (optional)</Label>
              <Input
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="ABC123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Services Offered
          </CardTitle>
          <CardDescription>Select the accessibility services you provide</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableServices.map((service) => (
              <Badge
                key={service}
                variant={services.includes(service) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => handleToggleService(service)}
              >
                {services.includes(service) && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {service}
              </Badge>
            ))}
          </div>
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">Select at least one service to receive matching leads</p>
          )}
        </CardContent>
      </Card>

      {/* Service Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service Areas
          </CardTitle>
          <CardDescription>ZIP codes or cities where you provide services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              placeholder="Enter ZIP code or city name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddArea()
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={handleAddArea}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {serviceAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map((area) => (
                <Badge key={area} variant="secondary" className="gap-1">
                  {area}
                  <button type="button" onClick={() => handleRemoveArea(area)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {serviceAreas.length === 0 && (
            <p className="text-sm text-muted-foreground">Add service areas to receive leads from those locations</p>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <Card>
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 border-primary/20 bg-primary/5 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Profile updated successfully!</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
