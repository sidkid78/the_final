"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard } from "lucide-react"

interface PurchaseLeadButtonProps {
    leadId: string
    price: number // in cents
}

export function PurchaseLeadButton({ leadId, price }: PurchaseLeadButtonProps) {
    const [loading, setLoading] = useState(false)

    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(cents / 100)
    }

    const handlePurchase = async () => {
        setLoading(true)

        try {
            const response = await fetch("/api/leads/purchase", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ leadId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to initiate purchase")
            }

            // Redirect to Stripe Checkout
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl
            }
        } catch (error) {
            console.error("Purchase error:", error)
            alert(error instanceof Error ? error.message : "Failed to purchase lead")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full"
            size="lg"
        >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase Lead for {formatPrice(price)}
                </>
            )}
        </Button>
    )
}
