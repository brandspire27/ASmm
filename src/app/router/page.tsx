"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState } from "@/context/AppStateContext"
import { Cpu, AlertTriangle, RefreshCw, CheckCircle, Zap, ShieldAlert, ZapOff } from "lucide-react"

export default function RouterPage() {
  const { state, triggerFailover, resetProviderLimits, toggleProviderLimit } = useAppState()
  const [notification, setNotification] = useState("")

  const handleManualFailover = async (type: "text" | "image" | "video") => {
    try {
      const nextActive = await triggerFailover(type)
      setNotification(`Manual failover setting saved for ${type.toUpperCase()}: ${nextActive}`)
    } catch (error) {
      setNotification(error instanceof Error ? error.message : "Unable to update provider settings.")
    }
    setTimeout(() => setNotification(""), 4000)
  }

  const handleResetLimits = async (type: "text" | "image" | "video") => {
    try {
      await resetProviderLimits(type)
      setNotification(`Provider settings saved for ${type.toUpperCase()}.`)
    } catch (error) {
      setNotification(error instanceof Error ? error.message : "Unable to reset provider settings.")
    }
    setTimeout(() => setNotification(""), 4000)
  }

  const handleLimitToggle = async (type: "text" | "image" | "video", provider: string, reached: boolean) => {
    try {
      await toggleProviderLimit(type, provider, reached)
      setNotification(`Provider setting saved for ${provider}.`)
    } catch (error) {
      setNotification(error instanceof Error ? error.message : "Unable to update provider settings.")
    }
    setTimeout(() => setNotification(""), 4000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Provider Configuration</h2>
          <p className="text-xs text-muted-foreground">
            Save shared provider preferences. Provider APIs and automatic failover are not connected.
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
                  Selected: {state.providers.text.active}
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
                          Provider API not connected
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
                Rotate Selection
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
                  Selected: {state.providers.image.active}
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
                          Provider API not connected
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
                Rotate Selection
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
                  Selected: {state.providers.video.active}
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
                          Provider API not connected
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
                Rotate Selection
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

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700">
          Provider selections and limit flags are saved configuration only. API credentials, health checks, usage costs, and automatic failover are not connected.
        </div>

      </div>
    </DashboardLayout>
  )
}
