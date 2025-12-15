"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function AppearanceSettings() {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const getThemeLabel = () => {
        if (!mounted) return "Loading..."
        switch (theme) {
            case "light": return "Light"
            case "dark": return "Dark"
            case "system": return "System"
            default: return theme
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how HOMEase looks on your device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Theme</p>
                        <p className="text-sm text-muted-foreground">
                            Current: {getThemeLabel()}
                        </p>
                    </div>
                    <ThemeToggle />
                </div>
            </CardContent>
        </Card>
    )
}
