import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "@/components/settings-form"
import { AppearanceSettings } from "@/components/appearance-settings"
import { getAdminDb } from "@/lib/admin"

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    // Get user profile from Firestore
    const db = getAdminDb()
    const userDoc = await db.collection("users").doc(session.user.id).get()

    const userData = userDoc.exists ? userDoc.data() : null

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your personal information and contact details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SettingsForm
                            user={{
                                id: session.user.id,
                                name: session.user.name || "",
                                email: session.user.email || "",
                                phone: userData?.phone || "",
                                address: userData?.address || undefined,
                                role: session.user.role as "homeowner" | "contractor" | "admin"
                            }}
                        />
                    </CardContent>
                </Card>

                <AppearanceSettings />

                <Card>
                    <CardHeader>
                        <CardTitle>Account Security</CardTitle>
                        <CardDescription>Manage your password and security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Password</p>
                                <p className="text-sm text-muted-foreground">Last changed: Never</p>
                            </div>
                            <p className="text-sm text-muted-foreground">Password management coming soon</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Configure how you receive updates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive updates about your projects and quotes</p>
                            </div>
                            <p className="text-sm text-muted-foreground">Notification preferences coming soon</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
