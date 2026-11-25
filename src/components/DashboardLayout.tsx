"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppState } from "@/context/AppStateContext"
import Sidebar from "./Sidebar"
import { ShieldCheck, Calendar, Bell, Menu, X } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { state, isLoading, connectionError, isConfigured } = useAppState()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !state.currentUser) {
      router.push("/login")
    } else if (!isLoading && state.currentUser && !state.activeWorkspaceId) {
      router.push("/onboarding")
    }
  }, [state.currentUser, state.activeWorkspaceId, isLoading, router])

  if (isLoading || !state.currentUser || !state.activeWorkspaceId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2 animate-pulse">
          <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">Verifying secure workspace session...</p>
        </div>
      </div>
    )
  }

  // Active client details
  const activeClient = state.clients.find((c) => c.id === state.activeClientId)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden shrink-0 lg:block">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 h-full w-full bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-md border border-border bg-card p-1.5 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Controls */}
        <header className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-md border border-border p-2 text-muted-foreground hover:bg-secondary lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            {activeClient ? (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                  Active Focus
                </span>
                <span className="text-sm font-bold text-foreground">
                  {activeClient.name}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                No active focus client. Select one from the sidebar.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-xs text-muted-foreground font-mono sm:flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric"
              })}
            </div>

            <button className="relative p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>

            <div className="h-4 w-[1px] bg-border" />

            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded font-mono font-semibold ${
              connectionError ? "text-destructive bg-destructive/10" : "text-emerald-500 bg-emerald-500/10"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connectionError ? "bg-destructive" : "bg-emerald-500 animate-ping"}`} />
              {connectionError ? "Cloud Error" : isConfigured ? "Cloud Connected" : "Offline"}
            </div>
          </div>
        </header>

        {/* Content Children */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {connectionError && (
            <div role="alert" className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Cloud workspace error: {connectionError}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
