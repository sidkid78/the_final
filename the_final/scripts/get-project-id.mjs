import { config } from "dotenv"

config({ path: ".env.local" })

console.log(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
