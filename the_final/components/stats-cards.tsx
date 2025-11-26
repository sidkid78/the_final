"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, DollarSign, CheckCircle } from "lucide-react"
import type { AdminStats } from "@/lib/admin-functions"

interface StatsCardsProps {
  stats: AdminStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: `${stats.totalHomeowners} homeowners, ${stats.totalContractors} contractors`,
    },
    {
      title: "Verified Contractors",
      value: stats.verifiedContractors,
      icon: CheckCircle,
      description: `${stats.pendingVerifications} pending verification`,
    },
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: FileText,
      description: `${stats.activeLeads} active, ${stats.completedLeads} completed`,
    },
    {
      title: "Platform Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "10% commission on completed projects",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
