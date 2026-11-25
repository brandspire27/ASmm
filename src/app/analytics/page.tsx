"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState } from "@/context/AppStateContext"
import { BarChart3, Sparkles, Layers, DollarSign, MousePointerClick, Users, ArrowUpRight } from "lucide-react"

export default function AnalyticsPage() {
  const { state, addCampaign } = useAppState()
  const [notification, setNotification] = useState("")

  // Local state for campaign creator
  const [campName, setCampName] = useState("")
  const [campImpressions, setCampImpressions] = useState(25000)
  const [campClicks, setCampClicks] = useState(1800)
  const [campConversions, setCampConversions] = useState(120)
  const [campSpend, setCampSpend] = useState(250)

  // Calculate aggregated stats
  const totalImpressions = state.analytics.reduce((sum, item) => sum + item.impressions, 0)
  const totalClicks = state.analytics.reduce((sum, item) => sum + item.clicks, 0)
  const totalConversions = state.analytics.reduce((sum, item) => sum + item.conversions, 0)
  const totalSpend = state.analytics.reduce((sum, item) => sum + item.spend, 0)

  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00"
  const avgConversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0.00"

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.activeClientId) {
      alert("Please select a focused client in the sidebar first.")
      return
    }
    if (!campName) {
      alert("Please enter a campaign name.")
      return
    }

    try {
      await addCampaign({
        clientId: state.activeClientId,
        campaignName: campName,
        impressions: campImpressions,
        clicks: campClicks,
        conversions: campConversions,
        spend: campSpend,
        status: "active"
      })
      setCampName("")
      setNotification(`Saved campaign metrics for ${campName} to the shared workspace.`)
      setTimeout(() => setNotification(""), 4000)
    } catch (error) {
      setNotification(error instanceof Error ? error.message : "Unable to save campaign metrics.")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Performance Analytics</h2>
            <p className="text-xs text-muted-foreground">
            Review shared campaign metrics entered by your team. Social platform syncing is not configured.
            </p>
          </div>
        </div>

        {notification && (
          <div className="rounded-md bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium animate-pulse">
            {notification}
          </div>
        )}

        {/* Aggregated Performance Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Impressions
              </span>
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {totalImpressions.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Organic + Paid delivery scope</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Clicks / Engagements
              </span>
              <MousePointerClick className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {totalClicks.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-emerald-500 font-semibold font-mono">CTR: {avgCtr}%</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Conversions / Leads
              </span>
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {totalConversions.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-indigo-500 font-semibold font-mono">CVR: {avgConversionRate}%</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Performance Spend
              </span>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                ${totalSpend.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">ROI calculated contextually</p>
          </div>

        </div>

        {/* Visual Charts Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Impressions Bar Chart */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
              Deliverability impressions by Campaign
            </h3>

            <div className="space-y-4 pt-2">
              {state.analytics.map((camp) => {
                const percentage = Math.min(100, Math.max(15, (camp.impressions / 60000) * 100))
                return (
                  <div key={camp.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground truncate max-w-[200px]">{camp.campaignName}</span>
                      <span className="font-mono text-muted-foreground">{camp.impressions.toLocaleString()} views</span>
                    </div>
                    <div className="w-full bg-secondary h-4 rounded overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500 rounded"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Conversions Funnel Chart */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
              Conversions vs CTR Efficiency
            </h3>

            <div className="space-y-4 pt-2">
              {state.analytics.map((camp) => {
                const percentage = Math.min(100, Math.max(15, (camp.conversions / 400) * 100))
                return (
                  <div key={camp.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground truncate max-w-[200px]">{camp.campaignName}</span>
                      <span className="font-mono text-emerald-500 font-bold">{camp.conversions} leads ({camp.ctr}% CTR)</span>
                    </div>
                    <div className="w-full bg-secondary h-4 rounded overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500 rounded"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Campaign Manager Drawer / Register New */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Create Campaign (5 Columns) */}
          <div className="xl:col-span-5 rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
              Register New Active Campaign
            </h3>

            {state.activeClientId ? (
              <form onSubmit={handleCreateCampaign} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Campaign / Ad Name
                  </label>
                  <input
                    type="text"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    placeholder="e.g. Winter Wellness Reels"
                    className="w-full rounded-md border border-border bg-secondary/30 py-1.5 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Initial Impressions
                    </label>
                    <input
                      type="number"
                      value={campImpressions}
                      onChange={(e) => setCampImpressions(Number(e.target.value))}
                      className="w-full rounded-md border border-border bg-secondary/30 py-1.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Initial Clicks
                    </label>
                    <input
                      type="number"
                      value={campClicks}
                      onChange={(e) => setCampClicks(Number(e.target.value))}
                      className="w-full rounded-md border border-border bg-secondary/30 py-1.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Conversions
                    </label>
                    <input
                      type="number"
                      value={campConversions}
                      onChange={(e) => setCampConversions(Number(e.target.value))}
                      className="w-full rounded-md border border-border bg-secondary/30 py-1.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Budget Spend ($)
                    </label>
                    <input
                      type="number"
                      value={campSpend}
                      onChange={(e) => setCampSpend(Number(e.target.value))}
                      className="w-full rounded-md border border-border bg-secondary/30 py-1.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded bg-primary py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition"
                >
                  Register Active Campaign Metrics
                </button>
              </form>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground italic">
                Please focus a client in the left sidebar to add campaigns.
              </div>
            )}
          </div>

          {/* Detailed table of campaigns (7 Columns) */}
          <div className="xl:col-span-7 rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
              Performance Ledger Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-foreground">
                <thead className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/10">
                  <tr>
                    <th className="p-3 font-bold">Campaign Name</th>
                    <th className="p-3 font-bold text-right">Impressions</th>
                    <th className="p-3 font-bold text-right">CTR</th>
                    <th className="p-3 font-bold text-right">Leads</th>
                    <th className="p-3 font-bold text-right">Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {state.analytics.map((camp) => (
                    <tr key={camp.id} className="hover:bg-secondary/20">
                      <td className="p-3 font-bold truncate max-w-[140px]">{camp.campaignName}</td>
                      <td className="p-3 text-right font-mono text-muted-foreground">{camp.impressions.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-emerald-500 font-bold">{camp.ctr}%</td>
                      <td className="p-3 text-right font-mono text-indigo-500 font-semibold">{camp.conversions}</td>
                      <td className="p-3 text-right font-mono text-amber-500 font-bold">${camp.spend.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
