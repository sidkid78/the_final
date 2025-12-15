export type LeadStatus = "pending" | "matched" | "quoted" | "accepted" | "completed" | "cancelled"

export interface Lead {
  id: string
  assessmentId: string
  homeownerId: string
  homeownerName: string
  homeownerEmail: string
  homeownerPhone?: string

  // Location
  address: {
    street: string
    city: string
    state: string
    zip: string
  }

  // Project details
  projectType: string[] // e.g., ['bathroom', 'grab_bars', 'flooring']
  description: string
  urgency: "low" | "medium" | "high"
  budget: {
    min: number
    max: number
  }

  // Matching
  matchedContractors: string[] // Contractor IDs
  status: LeadStatus

  // Lead Purchase (Pay-Per-Lead model)
  price: number           // Price in cents (e.g., 2500 = $25)
  purchasedBy: string[]   // Array of contractor IDs who have purchased this lead

  // Timestamps
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}

export interface Quote {
  id: string
  leadId: string
  contractorId: string
  contractorName: string
  contractorCompany: string

  // Quote details
  amount: number
  breakdown: {
    item: string
    cost: number
    description?: string
  }[]
  estimatedDuration: string // e.g., "2-3 days"
  validUntil: Date
  notes?: string

  // Status
  status: "pending" | "accepted" | "rejected" | "expired"

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface LeadNotification {
  id: string
  leadId: string
  contractorId: string
  type: "new_lead" | "quote_accepted" | "lead_expired"
  read: boolean
  createdAt: Date
}
