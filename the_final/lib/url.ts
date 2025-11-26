export function getBaseUrl(): string {
  // Client-side: use window.location.origin
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  // Server-side: check environment variables
  // 1. Explicit app URL (production custom domain)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // 2. Vercel deployment URL (auto-provided by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 3. Fallback to localhost for development
  return "http://localhost:3000"
}
