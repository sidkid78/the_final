import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowRight, Shield, Camera, Users, CheckCircle2 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>HOMEase</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link href="#contractors" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              For Contractors
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance">
              Age in place with confidence
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              AI-powered home assessments connect you with certified contractors for accessibility modifications. See
              your upgrades before you commit.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/register">
                  Start Free Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                <Link href="/register?role=contractor">Join as Contractor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight">How HOMEase Works</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              From assessment to installation, we make aging-in-place modifications simple
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">AI Assessment</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload photos of your home and our AI identifies accessibility improvements with cost estimates
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Connect with Contractors</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get matched with verified, local contractors who specialize in aging-in-place modifications
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Visualize Changes</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                See AI-generated previews of modifications before committing to any work
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Verified Contractors</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">AI-Powered Estimates</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Licensed & Insured</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">HOMEase</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} HOMEase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
