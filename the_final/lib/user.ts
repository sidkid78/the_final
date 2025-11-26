export type UserRole = "homeowner" | "contractor" | "admin"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: UserRole
  phone?: string
  createdAt: Date
  updatedAt: Date
}

export interface HomeownerProfile extends UserProfile {
  role: "homeowner"
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
  assessments?: string[] // Assessment IDs
}

export interface ContractorProfile extends UserProfile {
  role: "contractor"
  companyName: string
  licenseNumber?: string
  serviceAreas: string[] // ZIP codes or city names
  services: string[] // e.g., ['bathroom', 'stairlifts', 'ramps']
  stripeAccountId?: string
  stripeOnboardingComplete: boolean
  verified: boolean
  rating?: number
  reviewCount?: number
}

export interface AdminProfile extends UserProfile {
  role: "admin"
  permissions: string[]
}

export type AnyUserProfile = HomeownerProfile | ContractorProfile | AdminProfile
