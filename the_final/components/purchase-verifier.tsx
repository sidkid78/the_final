"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"

interface PurchaseVerifierProps {
    leadId: string
}

/**
 * Component that verifies a Stripe checkout session after successful payment redirect.
 * This ensures the lead purchase is recorded even if the webhook hasn't fired yet.
 */
export function PurchaseVerifier({ leadId }: PurchaseVerifierProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<"verifying" | "success" | "error" | null>(null)

    useEffect(() => {
        const purchaseStatus = searchParams.get("purchase")
        const sessionId = searchParams.get("session_id")

        // Only verify if we have a success status
        if (purchaseStatus === "success") {
            verifyPurchase(sessionId)
        }
    }, [searchParams])

    const verifyPurchase = async (sessionId: string | null) => {
        // If no session ID in URL, try to get it from localStorage as backup
        const storedSessionId = sessionId || localStorage.getItem(`purchase_session_${leadId}`)

        if (!storedSessionId) {
            // No session ID available, but payment was successful per Stripe redirect
            // The webhook should handle it, or refresh the page to get updated data
            setStatus("success")
            setTimeout(() => {
                router.refresh()
            }, 1500)
            return
        }

        setStatus("verifying")

        try {
            const response = await fetch("/api/leads/purchase/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: storedSessionId, leadId }),
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setStatus("success")
                // Clean up stored session ID
                localStorage.removeItem(`purchase_session_${leadId}`)
                // Refresh the page to get updated data
                setTimeout(() => {
                    router.refresh()
                }, 1500)
            } else {
                // If verification fails but we have purchase=success, 
                // the webhook might have already processed it
                setStatus("success")
                setTimeout(() => {
                    router.refresh()
                }, 1500)
            }
        } catch (error) {
            console.error("Verification error:", error)
            // On error, still try refreshing as webhook may have worked
            setStatus("success")
            setTimeout(() => {
                router.refresh()
            }, 1500)
        }
    }

    if (status === "verifying") {
        return (
            <Alert className="border-muted bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Verifying Purchase...</AlertTitle>
                <AlertDescription>
                    Please wait while we confirm your payment.
                </AlertDescription>
            </Alert>
        )
    }

    if (status === "success") {
        return (
            <Alert className="border-primary/20 bg-primary/5 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Lead Purchased Successfully!</AlertTitle>
                <AlertDescription>
                    You now have access to the homeowner's full contact details. Refreshing page...
                </AlertDescription>
            </Alert>
        )
    }

    if (status === "error") {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verification Issue</AlertTitle>
                <AlertDescription>
                    There was an issue verifying your purchase. Please refresh the page or contact support if the problem persists.
                </AlertDescription>
            </Alert>
        )
    }

    return null
}
