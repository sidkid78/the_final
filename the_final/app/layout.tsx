import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "HOMEase | AI - Aging in Place Home Modifications",
  description:
    "Connect with certified contractors for aging-in-place home modifications. AI-powered assessments and instant visualizations.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#2d8a6e",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
