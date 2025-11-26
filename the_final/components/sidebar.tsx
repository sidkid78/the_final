"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  FileText,
  Camera,
  MessageSquare,
  Settings,
  LogOut,
  Users,
  BarChart3,
  Briefcase,
  CreditCard,
  Shield,
} from "lucide-react"

const homeownerLinks = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/assessment", label: "New Assessment", icon: Camera },
  { href: "/dashboard/assessments", label: "My Assessments", icon: FileText },
  { href: "/dashboard/leads", label: "My Leads", icon: MessageSquare },
  { href: "/dashboard/quotes", label: "Quotes", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const contractorLinks = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/leads/contractor", label: "Lead Inbox", icon: MessageSquare },
  { href: "/dashboard/quotes/contractor", label: "My Quotes", icon: FileText },
  { href: "/dashboard/profile", label: "Business Profile", icon: Briefcase },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const adminLinks = [
  { href: "/dashboard/admin", label: "Overview", icon: Home },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/leads", label: "All Leads", icon: FileText },
  { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role || "homeowner"

  const links = role === "admin" ? adminLinks : role === "contractor" ? contractorLinks : homeownerLinks

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">HOMEase AI</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {role === "admin" && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin Portal</span>
            </div>
          )}
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium">{session?.user?.name?.charAt(0) || "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  )
}
