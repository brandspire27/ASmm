"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppState } from "@/context/AppStateContext"
import BrandLogo from "@/components/BrandLogo"

export default function Home() {
  const { state, isLoading } = useAppState()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (state.currentUser) {
      router.push(state.activeWorkspaceId ? "/dashboard" : "/onboarding")
    } else {
      router.push("/login")
    }
  }, [state.currentUser, state.activeWorkspaceId, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3 animate-pulse">
        <BrandLogo className="h-10 w-auto mx-auto" />
        <h2 className="text-lg font-bold text-foreground">BrandSpire Social AI</h2>
        <p className="text-xs text-muted-foreground font-mono">Loading your secure workspace...</p>
      </div>
    </div>
  )
}
