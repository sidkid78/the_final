// Quick script to verify a contractor and/or set admin role
// Run with: npx ts-node scripts/verify-contractor.ts <uid>

import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "")
    .replace(/\\n/g, "\n")
    .replace(/^"|"$/g, "")

if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase credentials in .env.local")
    process.exit(1)
}

initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
})

const db = getFirestore()

async function main() {
    const uid = process.argv[2]
    const setAdmin = process.argv.includes("--admin")

    if (!uid) {
        // List all users if no UID provided
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
        console.log("\nUsage: npx ts-node scripts/verify-contractor.ts <uid> [--admin]")
        return
    }

    const updates: any = { verified: true }
    if (setAdmin) {
        updates.role = "admin"
    }

    await db.collection("users").doc(uid).update(updates)
    console.log(`✅ Updated user ${uid}:`)
    console.log(`   verified: true`)
    if (setAdmin) {
        console.log(`   role: admin`)
    }
}

main().catch(console.error)
