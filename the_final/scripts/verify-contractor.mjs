// Quick script to verify a contractor
// Run with: node scripts/verify-contractor.mjs <uid>

import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
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
const uid = process.argv[2]
const setAdmin = process.argv.includes("--admin")

if (!uid) {
    console.log("Listing all users:\n")
    const snapshot = await db.collection("users").get()
    snapshot.docs.forEach(doc => {
        const data = doc.data()
        console.log(`UID: ${doc.id}`)
        console.log(`  Email: ${data.email}`)
        console.log(`  Role: ${data.role}`)
        console.log(`  Verified: ${data.verified || false}`)
        console.log("")
    })
    console.log("\nUsage: node scripts/verify-contractor.mjs <uid> [--admin]")
} else {
    const updates = { verified: true }
    if (setAdmin) updates.role = "admin"
    await db.collection("users").doc(uid).update(updates)
    console.log(`✅ User ${uid} verified!` + (setAdmin ? " (now admin)" : ""))
}
