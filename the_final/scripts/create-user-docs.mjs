// Create missing user documents in Firestore
import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { config } from "dotenv"

config({ path: ".env.local" })

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "")
    .replace(/\\n/g, "\n")
    .replace(/^"|"$/g, "")

initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
})

const db = getFirestore()
const auth = getAuth()

console.log("\n=== Creating Missing User Documents ===\n")

// Get all Firebase Auth users
const listUsersResult = await auth.listUsers()

for (const userRecord of listUsersResult.users) {
    const uid = userRecord.uid
    const email = userRecord.email
    const displayName = userRecord.displayName || email?.split('@')[0] || "User"

    // Check if Firestore document exists
    const userDoc = await db.collection("users").doc(uid).get()

    if (!userDoc.exists) {
        console.log(`Creating document for: ${email}`)

        // Determine role based on email or default to homeowner
        let role = "homeowner"
        if (email?.includes("contractor") || email?.includes("yourhomease")) {
            role = "contractor"
        }

        const userData = {
            uid,
            email,
            displayName,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        // Add role-specific fields
        if (role === "contractor") {
            Object.assign(userData, {
                companyName: displayName,
                stripeOnboardingComplete: false,
                verified: false,
                serviceAreas: [],
                services: [],
            })
        }

        await db.collection("users").doc(uid).set(userData)
        console.log(`  ✅ Created ${role} document for ${email}`)
    } else {
        console.log(`  ⏭️  Document already exists for ${email}`)
    }
}

console.log("\n✅ Done!\n")
