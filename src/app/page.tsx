"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppState } from "@/context/AppStateContext"
import { Sparkles } from "lucide-react"

export default function Home() {
  const { state, isLoading } = useAppState()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (state.currentUser) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [state.currentUser, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3 animate-pulse">
        <Sparkles className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-lg font-bold text-foreground">AgencyOS Lite</h2>
        <p className="text-xs text-muted-foreground font-mono">Initializing operational AI models...</p>
      </div>
    </div>
  )
}
