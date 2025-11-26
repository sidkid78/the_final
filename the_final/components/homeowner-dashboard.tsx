import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, FileText, Clock, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

interface HomeownerDashboardProps {
  user: {
    name: string
    email: string
  }
}

export function HomeownerDashboard({ user }: HomeownerDashboardProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name?.split(" ")[0] || "there"}</h1>
        <p className="text-muted-foreground mt-1">Start a new assessment or view your existing ones</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2 border-dashed border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors">
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">New Assessment</CardTitle>
            <CardDescription>Upload photos of your home for an AI-powered accessibility evaluation</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/assessment">
                Start Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-2">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">My Assessments</CardTitle>
            <CardDescription>View and manage your home accessibility assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/dashboard/assessments">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Get Quotes</CardTitle>
            <CardDescription>Connect with verified contractors for your home modifications</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/dashboard/quotes">
                Find Contractors
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assessments</CardTitle>
          <CardDescription>Your latest home accessibility evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No assessments yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Start your first assessment to get AI-powered recommendations for aging-in-place modifications
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/assessment">Start Your First Assessment</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
