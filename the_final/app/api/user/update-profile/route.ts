import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getAdminDb } from "@/lib/admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { displayName, phone, address } = await req.json()

        const db = getAdminDb()
        const userRef = db.collection("users").doc(session.user.id)

        // Build update object
        const updates: any = {
            displayName,
            phone: phone || null,
            updatedAt: FieldValue.serverTimestamp(),
        }

        // Add address for homeowners
        if (session.user.role === "homeowner" && address) {
            updates.address = address
        }

        await userRef.update(updates)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Profile update error:", error)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }
}
