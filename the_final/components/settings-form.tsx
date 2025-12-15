"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import type { UserRole } from "@/lib/user"

interface SettingsFormProps {
    user: {
        id: string
        name: string
        email: string
        phone: string
        address?: {
            street: string
            city: string
            state: string
            zip: string
        }
        role: UserRole
    }
}

export function SettingsForm({ user }: SettingsFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        displayName: user.name,
        phone: user.phone,
        address: user.address || {
            street: "",
            city: "",
            state: "",
            zip: "",
        },
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const response = await fetch("/api/user/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to update profile")
            }

            setSuccess(true)
            setTimeout(() => {
                router.refresh()
            }, 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            {/* Address (Homeowners only) */}
            {user.role === "homeowner" && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Home Address</h3>
                    <p className="text-sm text-muted-foreground">
                        This will be used as the default location for your projects
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                            id="street"
                            placeholder="123 Main St"
                            value={formData.address.street}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    address: { ...formData.address, street: e.target.value },
                                })
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                placeholder="City"
                                value={formData.address.city}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        address: { ...formData.address, city: e.target.value },
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                placeholder="State"
                                value={formData.address.state}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        address: { ...formData.address, state: e.target.value },
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                            id="zip"
                            placeholder="12345"
                            value={formData.address.zip}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    address: { ...formData.address, zip: e.target.value },
                                })
                            }
                        />
                    </div>
                </div>
            )}

            {/* Messages */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="border-green-200 bg-green-50 text-green-900">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>Profile updated successfully!</AlertDescription>
                </Alert>
            )}

            {/* Submit */}
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>
        </form>
    )
}
