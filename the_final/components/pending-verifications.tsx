"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import type { ContractorProfile } from "@/lib/user"
import { verifyContractor } from "@/lib/admin-functions"

interface PendingVerificationsProps {
  contractors: ContractorProfile[]
  onRefresh: () => void
}

export function PendingVerifications({ contractors, onRefresh }: PendingVerificationsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleVerify = async (contractorId: string) => {
    setLoading(contractorId)
    try {
      await verifyContractor(contractorId)
      onRefresh()
    } catch (error) {
      console.error("Failed to verify:", error)
    } finally {
      setLoading(null)
    }
  }

  if (contractors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No contractors pending verification</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Verifications ({contractors.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contractors.map((contractor) => (
          <div key={contractor.uid} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">{contractor.companyName || contractor.displayName}</p>
              <p className="text-sm text-muted-foreground">{contractor.email}</p>
              <div className="flex gap-2 mt-2">
                {contractor.services?.slice(0, 3).map((service) => (
                  <Badge key={service} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
                {contractor.services?.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{contractor.services.length - 3} more
                  </Badge>
                )}
              </div>
              {contractor.licenseNumber && (
                <p className="text-xs text-muted-foreground mt-1">License: {contractor.licenseNumber}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleVerify(contractor.uid)}
                disabled={loading === contractor.uid}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Verify
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
