// List all collections in Firestore
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

console.log("\n=== ALL COLLECTIONS ===")
const collections = await db.listCollections()
console.log(`Found ${collections.length} collections:`)
collections.forEach(col => {
    console.log(`  - ${col.id}`)
})

// Check each collection for document count
for (const col of collections) {
    const snapshot = await col.get()
    console.log(`\n${col.id}: ${snapshot.docs.length} documents`)
    if (snapshot.docs.length > 0 && snapshot.docs.length <= 5) {
        snapshot.docs.forEach(doc => {
            console.log(`  - ${doc.id}`)
        })
    }
}
