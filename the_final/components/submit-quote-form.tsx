"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Lead } from "@/lib/lead"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Plus, Trash2, DollarSign, Clock } from "lucide-react"

interface SubmitQuoteFormProps {
  lead: Lead
  onSuccess?: () => void
}

interface LineItem {
  item: string
  cost: number
  description?: string
}

export function SubmitQuoteForm({ lead, onSuccess }: SubmitQuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [breakdown, setBreakdown] = useState<LineItem[]>([{ item: "", cost: 0, description: "" }])
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [validDays, setValidDays] = useState("14")
  const [notes, setNotes] = useState("")

  const totalAmount = breakdown.reduce((sum, item) => sum + (item.cost || 0), 0)

  const handleAddLineItem = () => {
    setBreakdown([...breakdown, { item: "", cost: 0, description: "" }])
  }

  const handleRemoveLineItem = (index: number) => {
    if (breakdown.length > 1) {
      setBreakdown(breakdown.filter((_, i) => i !== index))
    }
  }

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...breakdown]
    updated[index] = { ...updated[index], [field]: value }
    setBreakdown(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate
    const validItems = breakdown.filter((item) => item.item.trim() && item.cost > 0)
    if (validItems.length === 0) {
      setError("Please add at least one line item with a cost")
      setLoading(false)
      return
    }

    if (!estimatedDuration) {
      setError("Please provide an estimated duration")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/contractor/quotes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          amount: totalAmount,
          breakdown: validItems,
          estimatedDuration,
          validDays: Number.parseInt(validDays),
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit quote")
      }

      onSuccess?.()
      router.push("/dashboard/leads")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quote")
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Quote Breakdown
          </CardTitle>
          <CardDescription>Itemize your quote for the homeowner</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {breakdown.map((item, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Item name (e.g., Grab Bar Installation)"
                  value={item.item}
                  onChange={(e) => handleLineItemChange(index, "item", e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  value={item.description || ""}
                  onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                />
              </div>
              <div className="w-32">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    className="pl-8"
                    value={item.cost || ""}
                    onChange={(e) => handleLineItemChange(index, "cost", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveLineItem(index)}
                disabled={breakdown.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={handleAddLineItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Line Item
          </Button>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline & Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., 2-3 days"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validDays">Quote Valid For</Label>
              <Select value={validDays} onValueChange={setValidDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about your quote..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
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
          <Button type="submit" className="w-full" disabled={loading || totalAmount === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              `Submit Quote - ${formatCurrency(totalAmount)}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
