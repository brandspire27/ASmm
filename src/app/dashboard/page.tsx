"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState } from "@/context/AppStateContext"
import {
  TrendingUp,
  Users,
  Cpu,
  CheckSquare,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Video,
  PenTool,
  ChevronRight,
  Eye
} from "lucide-react"

export default function Dashboard() {
  const { state, simulateCampaignStats } = useAppState()

  // Every time the dashboard is loaded, simulate a slight progress/increase in stats to show a living production workspace!
  useEffect(() => {
    simulateCampaignStats()
  }, [])

  // Calculate high-level stats
  const totalClients = state.clients.length
  const activeCampaigns = state.analytics.filter((a) => a.status === "active").length
  const totalSpend = state.analytics.reduce((sum, current) => sum + current.spend, 0)
  
  const totalClicks = state.analytics.reduce((sum, current) => sum + current.clicks, 0)
  const totalImpressions = state.analytics.reduce((sum, current) => sum + current.impressions, 0)
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00"

  // Active client details
  const activeClient = state.clients.find((c) => c.id === state.activeClientId)
  
  // Pending content approval items
  const pendingContent = state.contentList.filter((c) => c.status === "draft")

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-secondary/40 via-secondary/20 to-transparent p-6 rounded-lg border border-border">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Welcome Back, {state.currentUser?.name || "Marketer"}
            </h2>
            <p className="text-sm text-muted-foreground">
              You are currently viewing unified workspace statistics & focusing on client:{" "}
              <span className="text-foreground font-semibold">
                {activeClient ? activeClient.name : "None selected"}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/generator"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate Content
            </Link>
            <Link
              href="/clients"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Client
            </Link>
          </div>
        </div>

        {/* Agency Metrics Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Focus Clients
              </span>
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {totalClients}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Fully customized brand profiles
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Campaigns
              </span>
              <div className="rounded-md bg-emerald-500/15 p-2 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {activeCampaigns}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Across Search, Social, and Video
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Combined Ad Spend
              </span>
              <div className="rounded-md bg-amber-500/15 p-2 text-amber-500">
                <span className="text-xs font-bold font-mono">$</span>
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                ${totalSpend.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Total internal performance budget
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Average CTR
              </span>
              <div className="rounded-md bg-indigo-500/15 p-2 text-indigo-500">
                <span className="text-xs font-bold font-mono">%</span>
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {avgCtr}%
              </span>
            </div>
            <div className="text-[10px] text-emerald-500 font-semibold font-mono">
              +0.42% vs yesterday
            </div>
          </div>
        </div>

        {/* AI Router Status Overview Card */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-foreground">AI Router Failover Health</h3>
              <p className="text-xs text-muted-foreground">
                Automatic sequential provider pathing for high availability
              </p>
            </div>
            <Link
              href="/router"
              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              Configure Chains
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-md bg-secondary/25 p-4 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Text Generator Chain</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Current model: <span className="text-foreground font-semibold font-sans">{state.providers.text.active}</span>
              </div>
              <div className="text-[9px] text-muted-foreground font-mono truncate">
                Sequence: {state.providers.text.sequence.join(" → ")}
              </div>
            </div>

            <div className="rounded-md bg-secondary/25 p-4 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Image/Thumbnail Chain</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Current model: <span className="text-foreground font-semibold font-sans">{state.providers.image.active}</span>
              </div>
              <div className="text-[9px] text-muted-foreground font-mono truncate">
                Sequence: {state.providers.image.sequence.join(" → ")}
              </div>
            </div>

            <div className="rounded-md bg-secondary/25 p-4 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Video Render Engine</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Current API: <span className="text-foreground font-semibold font-sans">{state.providers.video.active}</span>
              </div>
              <div className="text-[9px] text-muted-foreground font-mono truncate">
                Sequence: {state.providers.video.sequence.join(" → ")}
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Splitting Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Focused Client Status Snapshot */}
          <div className="lg:col-span-1 rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-3">
              <Cpu className="h-4 w-4 text-primary" />
              Current Client Context
            </h3>

            {activeClient ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Company Name
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {activeClient.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Target Profile
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {activeClient.companyDescription}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Audience
                  </div>
                  <div className="text-xs text-foreground bg-secondary/50 p-2 rounded border border-border font-medium">
                    {activeClient.targetAudience}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Recent Generated Assets
                  </div>
                  <div className="space-y-1">
                    {state.contentList
                      .filter((c) => c.clientId === activeClient.id)
                      .slice(0, 3)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs bg-secondary/30 hover:bg-secondary/60 p-2 rounded transition-colors"
                        >
                          <span className="font-semibold text-foreground truncate max-w-[120px]">
                            {item.title}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold font-mono ${
                              item.status === "approved"
                                ? "bg-emerald-500/15 text-emerald-500"
                                : item.status === "draft"
                                ? "bg-amber-500/15 text-amber-500"
                                : "bg-red-500/15 text-red-500"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    {state.contentList.filter((c) => c.clientId === activeClient.id).length === 0 && (
                      <div className="text-xs text-muted-foreground italic">
                        No assets generated yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-xs italic">
                No active focus client selected. Choose one in the sidebar to contextually sync.
              </div>
            )}
          </div>

          {/* Social Media Content Approvals Feed */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-amber-500" />
                Approvals & Publishing Queue ({pendingContent.length})
              </h3>
              <Link
                href="/approval"
                className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline"
              >
                Go to Approvals
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {pendingContent.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-md border border-border bg-secondary/15 hover:bg-secondary/30 transition flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-primary/25 text-primary px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                        {item.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Client: {item.clientName}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-foreground truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <Link
                    href="/approval"
                    className="p-2 rounded-md border border-border bg-card hover:bg-secondary hover:text-foreground text-muted-foreground font-bold"
                    title="Review Asset"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              ))}

              {pendingContent.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-xs space-y-2">
                  <div className="font-semibold">Queue is fully approved! 🎉</div>
                  <p className="max-w-md mx-auto text-[11px]">
                    All copy, thumbnails, and rendering videos have been processed. Head to the Content Generator to create new assets.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
