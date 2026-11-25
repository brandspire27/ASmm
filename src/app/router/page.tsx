"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState } from "@/context/AppStateContext"
import { Cpu, AlertTriangle, RefreshCw, CheckCircle, Zap, ShieldAlert, ZapOff } from "lucide-react"

export default function RouterPage() {
  const { state, triggerFailover, resetProviderLimits, toggleProviderLimit } = useAppState()
  const [notification, setNotification] = useState("")

  const handleManualFailover = (type: "text" | "image" | "video") => {
    const nextActive = triggerFailover(type)
    setNotification(`Manual failover triggered for ${type.toUpperCase()}! Active model is now: ${nextActive}`)
    setTimeout(() => setNotification(""), 4000)
  }

  const handleResetLimits = (type: "text" | "image" | "video") => {
    resetProviderLimits(type)
    setNotification(`Successfully reset all limits for ${type.toUpperCase()} routing sequence.`)
    setTimeout(() => setNotification(""), 4000)
  }

  const handleLimitToggle = (type: "text" | "image" | "video", provider: string, reached: boolean) => {
    toggleProviderLimit(type, provider, reached)
    setNotification(`Toggled limits for ${provider} to: ${reached ? "BLOCKED (Limit Hit)" : "HEALTHY"}`)
    setTimeout(() => setNotification(""), 4000)
  }

  // Provider static parameters to display beautiful mock stats (cost, latency, uptime)
  const providerStats: Record<string, { cost: string; latency: string; details: string }> = {
    Gemini: { cost: "$0.00015 / 1k tokens", latency: "1.2s", details: "Google flagship multimodal text generation API" },
    Groq: { cost: "$0.00050 / 1k tokens", latency: "0.2s", details: "Llama 3 ultra-fast inference host" },
    OpenRouter: { cost: "$0.00180 / 1k tokens", latency: "1.8s", details: "Intelligent gateway aggregator failover" },
    "Cloudflare AI": { cost: "$0.00005 / 1k tokens", latency: "0.8s", details: "Workers AI serverless edge inference" },
    Clipdrop: { cost: "$0.015 / image", latency: "2.4s", details: "High-fidelity Jasper/SDXL photo-realistic images" },
    Pixian: { cost: "$0.008 / image", latency: "1.1s", details: "Fast stable background remover & canvas gen" },
    Creatomate: { cost: "$0.10 / video render", latency: "15s", details: "Dynamic template video engine with HTML5 preview" },
    Shotstack: { cost: "$0.08 / video render", latency: "22s", details: "Pro scale cloud video editing API container" },
    JSON2Video: { cost: "$0.05 / video render", latency: "18s", details: "JSON script to mp4 file generator" }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">AI Router & Failover Engine</h2>
          <p className="text-xs text-muted-foreground">
            Monitor and configure your active automated provider failover chains for text generation, thumbnail layout, and video render calls.
          </p>
        </div>

        {notification && (
          <div className="rounded-md bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium">
            {notification}
          </div>
        )}

        {/* Triple Chain Visualizer */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* TEXT CHAIN */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Text Generation Route
                </h3>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                  Active: {state.providers.text.active}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Drives strategy generation, social media captions, hashtags, and ad scripts.
              </p>
            </div>

            {/* Sequence Graph */}
            <div className="space-y-2 py-2">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                Routing Pipeline Order
              </label>
              <div className="flex flex-col gap-2">
                {state.providers.text.sequence.map((prov, index) => {
                  const isActive = state.providers.text.active === prov
                  const isBlocked = state.providers.text.limitsReached[prov]
                  const stats = providerStats[prov]

                  return (
                    <div
                      key={prov}
                      className={`rounded p-3 border flex items-center justify-between gap-4 transition-all ${
                        isActive
                          ? "bg-primary/10 border-primary"
                          : isBlocked
                          ? "bg-destructive/10 border-destructive/30 grayscale"
                          : "bg-secondary/20 border-border"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">
                            {index + 1}. {prov}
                          </span>
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground line-clamp-1">
                          {stats?.details}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Simulation Toggle Block */}
                        <button
                          onClick={() => handleLimitToggle("text", prov, !isBlocked)}
                          className={`p-1 rounded text-[9px] font-mono font-bold transition ${
                            isBlocked
                              ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                              : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          }`}
                          title={isBlocked ? "Mark as healthy" : "Force limit error (simulate)"}
                        >
                          {isBlocked ? "BLOCKED" : "HEALTHY"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Control Buttons */}
            <div className="flex gap-2 border-t border-border pt-4">
              <button
                onClick={() => handleManualFailover("text")}
                className="flex-1 rounded bg-secondary text-foreground hover:bg-secondary/80 border border-border py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                Force Failover
              </button>
              <button
                onClick={() => handleResetLimits("text")}
                className="rounded border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition"
                title="Reset all providers back to healthy state"
              >
                Reset
              </button>
            </div>
          </div>

          {/* IMAGE CHAIN */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Image / Thumbnail Route
                </h3>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                  Active: {state.providers.image.active}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Drives ad thumbnail generation, product background replacements, and graphics canvas builds.
              </p>
            </div>

            {/* Sequence Graph */}
            <div className="space-y-2 py-2">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                Routing Pipeline Order
              </label>
              <div className="flex flex-col gap-2">
                {state.providers.image.sequence.map((prov, index) => {
                  const isActive = state.providers.image.active === prov
                  const isBlocked = state.providers.image.limitsReached[prov]
                  const stats = providerStats[prov]

                  return (
                    <div
                      key={prov}
                      className={`rounded p-3 border flex items-center justify-between gap-4 transition-all ${
                        isActive
                          ? "bg-primary/10 border-primary"
                          : isBlocked
                          ? "bg-destructive/10 border-destructive/30 grayscale"
                          : "bg-secondary/20 border-border"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">
                            {index + 1}. {prov}
                          </span>
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground line-clamp-1">
                          {stats?.details}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Simulation Toggle Block */}
                        <button
                          onClick={() => handleLimitToggle("image", prov, !isBlocked)}
                          className={`p-1 rounded text-[9px] font-mono font-bold transition ${
                            isBlocked
                              ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                              : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          }`}
                          title={isBlocked ? "Mark as healthy" : "Force limit error (simulate)"}
                        >
                          {isBlocked ? "BLOCKED" : "HEALTHY"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Control Buttons */}
            <div className="flex gap-2 border-t border-border pt-4">
              <button
                onClick={() => handleManualFailover("image")}
                className="flex-1 rounded bg-secondary text-foreground hover:bg-secondary/80 border border-border py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                Force Failover
              </button>
              <button
                onClick={() => handleResetLimits("image")}
                className="rounded border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition"
                title="Reset all providers back to healthy state"
              >
                Reset
              </button>
            </div>
          </div>

          {/* VIDEO CHAIN */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Video Rendering Chain
                </h3>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                  Active: {state.providers.video.active}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Renders high-tempo dynamic MP4 templates with overlaid typography variables.
              </p>
            </div>

            {/* Sequence Graph */}
            <div className="space-y-2 py-2">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                Routing Pipeline Order
              </label>
              <div className="flex flex-col gap-2">
                {state.providers.video.sequence.map((prov, index) => {
                  const isActive = state.providers.video.active === prov
                  const isBlocked = state.providers.video.limitsReached[prov]
                  const stats = providerStats[prov]

                  return (
                    <div
                      key={prov}
                      className={`rounded p-3 border flex items-center justify-between gap-4 transition-all ${
                        isActive
                          ? "bg-primary/10 border-primary"
                          : isBlocked
                          ? "bg-destructive/10 border-destructive/30 grayscale"
                          : "bg-secondary/20 border-border"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">
                            {index + 1}. {prov}
                          </span>
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground line-clamp-1">
                          {stats?.details}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Simulation Toggle Block */}
                        <button
                          onClick={() => handleLimitToggle("video", prov, !isBlocked)}
                          className={`p-1 rounded text-[9px] font-mono font-bold transition ${
                            isBlocked
                              ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                              : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          }`}
                          title={isBlocked ? "Mark as healthy" : "Force limit error (simulate)"}
                        >
                          {isBlocked ? "BLOCKED" : "HEALTHY"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Control Buttons */}
            <div className="flex gap-2 border-t border-border pt-4">
              <button
                onClick={() => handleManualFailover("video")}
                className="flex-1 rounded bg-secondary text-foreground hover:bg-secondary/80 border border-border py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                Force Failover
              </button>
              <button
                onClick={() => handleResetLimits("video")}
                className="rounded border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition"
                title="Reset all providers back to healthy state"
              >
                Reset
              </button>
            </div>
          </div>

        </div>

        {/* Informational Diagnostics Block */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
            Internal AI Router Technical Specifications & Costs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(providerStats).map(([name, stats]) => (
              <div key={name} className="p-4 rounded-md border border-border bg-secondary/10 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{name}</span>
                  <span className="text-[10px] text-emerald-500 font-mono font-semibold">{stats.latency} latency</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {stats.details}
                </p>
                <div className="text-[10px] font-mono text-muted-foreground bg-card px-2 py-1 rounded border border-border text-center">
                  Cost: <span className="text-primary font-bold">{stats.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
