import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { EmailOtpType } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

const EMAIL_OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"]

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const requestedNext = requestUrl.searchParams.get("next")
  const redirectCandidate = requestedNext?.startsWith("/")
    ? new URL(requestedNext, requestUrl.origin)
    : new URL("/dashboard", requestUrl.origin)
  const safeNext = redirectCandidate.origin === requestUrl.origin
    ? `${redirectCandidate.pathname}${redirectCandidate.search}${redirectCandidate.hash}`
    : "/dashboard"
  const response = NextResponse.redirect(new URL(safeNext, requestUrl.origin))
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !publishableKey) {
    return NextResponse.redirect(new URL("/login?error=supabase_not_configured", requestUrl.origin))
  }

  const supabase = createServerClient<Database>(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      }
    }
  })

  const code = requestUrl.searchParams.get("code")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const otpType = requestUrl.searchParams.get("type")
  const emailOtpType = EMAIL_OTP_TYPES.find((type) => type === otpType)
  let authError: Error | null = null

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    authError = error
  } else if (tokenHash && emailOtpType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: emailOtpType
    })
    authError = error
  } else {
    authError = new Error("The authentication link is invalid or expired.")
  }

  if (authError) {
    response.headers.set("Location", new URL("/login?error=auth_callback", requestUrl.origin).toString())
    return response
  }

  const { error: invitationError } = await supabase.rpc("accept_my_workspace_invitations")
  if (invitationError) {
    response.headers.set("Location", new URL("/login?error=invitation_acceptance", requestUrl.origin).toString())
    return response
  }

  return response
}
