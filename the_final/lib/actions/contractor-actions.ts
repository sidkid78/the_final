"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminDb } from "@/lib/admin"
import { FieldValue } from "firebase-admin/firestore"

interface UpdateProfileData {
    displayName: string
    companyName: string
    licenseNumber?: string
    phone?: string
    services: string[]
    serviceAreas: string[]
}

export async function updateContractorProfileAction(
    updates: UpdateProfileData
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "contractor") {
            return { success: false, error: "Unauthorized" }
        }

        const db = getAdminDb()
        await db.collection("users").doc(session.user.id).update({
            displayName: updates.displayName,
            companyName: updates.companyName,
            licenseNumber: updates.licenseNumber || null,
            phone: updates.phone || null,
            services: updates.services,
            serviceAreas: updates.serviceAreas,
            updatedAt: FieldValue.serverTimestamp(),
        })

        return { success: true }
    } catch (error) {
        console.error("Failed to update contractor profile:", error)
        return { success: false, error: "Failed to update profile" }
    }
}

export async function updateStripeAccountIdAction(
    stripeAccountId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "contractor") {
            return { success: false, error: "Unauthorized" }
        }

        const db = getAdminDb()
        await db.collection("users").doc(session.user.id).update({
            stripeAccountId,
            updatedAt: FieldValue.serverTimestamp(),
        })

        return { success: true }
    } catch (error) {
        console.error("Failed to update Stripe account ID:", error)
        return { success: false, error: "Failed to update Stripe account" }
    }
}

export async function markStripeOnboardingCompleteAction(): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "contractor") {
            return { success: false, error: "Unauthorized" }
        }

        const db = getAdminDb()
        await db.collection("users").doc(session.user.id).update({
            stripeOnboardingComplete: true,
            updatedAt: FieldValue.serverTimestamp(),
        })

        return { success: true }
    } catch (error) {
        console.error("Failed to mark Stripe onboarding complete:", error)
        return { success: false, error: "Failed to update Stripe status" }
    }
}

export async function updateContractorVerificationAction(
    uid: string,
    verified: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return { success: false, error: "Unauthorized - admin only" }
        }

        const db = getAdminDb()
        await db.collection("users").doc(uid).update({
            verified,
            updatedAt: FieldValue.serverTimestamp(),
        })

        return { success: true }
    } catch (error) {
        console.error("Failed to update contractor verification:", error)
        return { success: false, error: "Failed to update verification status" }
    }
}
