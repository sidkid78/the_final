import { LoginForm } from "@/components/login-form"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home } from "lucide-react"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>HOMEase</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 bg-muted/30">
        <LoginForm />
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} HOMEase. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
