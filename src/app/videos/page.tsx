"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState, GeneratedContent } from "@/context/AppStateContext"
import { Video, Play, Sparkles, RefreshCw, Layers, CheckCircle, Sliders, Film } from "lucide-react"

export default function VideosPage() {
  const { state, generateAIContent } = useAppState()
  
  const activeClient = state.clients.find((c) => c.id === state.activeClientId)

  // Form states
  const [template, setTemplate] = useState("Promo Ad")
  const [headline, setHeadline] = useState("")
  const [subHeadline, setSubHeadline] = useState("")
  const [accentColor, setAccentColor] = useState("")
  
  // Pipeline Rendering states
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [renderLogs, setRenderLogs] = useState<string[]>([])
  const [completedVideo, setCompletedVideo] = useState<GeneratedContent | null>(null)
  const [notification, setNotification] = useState("")

  const videoTemplates = [
    {
      name: "Promo Ad",
      aspectRatio: "16:9",
      description: "Fast-paced action cuts with energetic typography overlays. Perfect for YouTube & Web banners.",
      thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=250&fit=crop&q=80"
    },
    {
      name: "Product Highlight",
      aspectRatio: "1:1",
      description: "Elegant, minimalist slow pan centering on product assets. Perfect for Instagram & Pinterest feeds.",
      thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=250&fit=crop&q=80"
    },
    {
      name: "Social Story",
      aspectRatio: "9:16",
      description: "Vertical layout with bold captions and fast background transitions. Perfect for TikTok & Reels.",
      thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=250&fit=crop&q=80"
    }
  ]

  const handleTemplateSelect = (tempName: string) => {
    setTemplate(tempName)
    // Preset some headline helpers if empty
    if (!headline) {
      setHeadline(`Unlock ${tempName} Power`)
      setSubHeadline("Available now. Limited release.")
    }
    if (activeClient && activeClient.brandColors.length > 0) {
      setAccentColor(activeClient.brandColors[0])
    }
  }

  const triggerRenderPipeline = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeClient) {
      alert("Please select a focused client in the sidebar.")
      return
    }
    if (!headline) {
      alert("Please specify a main video headline.")
      return
    }

    setIsRendering(true)
    setRenderProgress(10)
    setRenderLogs(["Preparing a template demo preview. No video-rendering service is connected."])

    const steps = [
      { progress: 25, log: "Loading the selected demo template..." },
      { progress: 45, log: `Applying preview text and color: "${headline}", "${accentColor || "#FF4500"}"` },
      { progress: 65, log: "Preparing preview overlays..." },
      { progress: 85, log: "Saving preview details to the shared workspace..." },
      { progress: 100, log: "Demo preview ready. No MP4 was rendered." }
    ]

    steps.forEach((step, idx) => {
      setTimeout(async () => {
        setRenderProgress(step.progress)
        setRenderLogs((prev) => [...prev, step.log])
        
        if (step.progress === 100) {
          try {
            const videoAsset = await generateAIContent(activeClient.id, "video", `${template} - ${headline}`, {
              template,
              textVariables: [headline, subHeadline],
              colorHex: accentColor || "#FF4500"
            })
            setCompletedVideo(videoAsset)
            setNotification("Demo preview details saved. Connect a rendering provider to create an MP4.")
            setTimeout(() => setNotification(""), 4000)
          } catch (error) {
            setNotification(error instanceof Error ? error.message : "Unable to save the demo preview.")
          } finally {
            setIsRendering(false)
          }
        }
      }, (idx + 1) * 900)
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="border-b border-border pb-5">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Video Template Preview</h2>
          <p className="text-xs text-muted-foreground">
            Preview template variables. Cloud video rendering and MP4 export are not connected.
          </p>
        </div>

        {notification && (
          <div className="rounded-md bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium">
            {notification}
          </div>
        )}

        {!activeClient ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground space-y-3">
            <Video className="h-10 w-10 mx-auto text-muted-foreground animate-pulse" />
            <h3 className="text-sm font-semibold text-foreground">No Focused Client</h3>
            <p className="max-w-md mx-auto text-xs leading-relaxed">
              Videos are branded contextually. Please choose an active focus client in the sidebar to feed their brand colors and guidelines into the templates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT OPTIONS PANEL (5 Columns) */}
            <div className="xl:col-span-5 space-y-6">
              
              {/* Select Templates Grid */}
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                  <Film className="h-4 w-4 text-primary" />
                  1. Select Video Template
                </h3>

                <div className="space-y-3">
                  {videoTemplates.map((temp) => {
                    const isSelected = template === temp.name
                    return (
                      <button
                        key={temp.name}
                        onClick={() => handleTemplateSelect(temp.name)}
                        className={`w-full text-left rounded-md border p-3 flex gap-4 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                            : "border-border bg-secondary/15 hover:bg-secondary/35"
                        }`}
                      >
                        <img
                          src={temp.thumbnail}
                          alt={temp.name}
                          className="h-14 w-20 object-cover rounded border border-border shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{temp.name}</span>
                            <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded font-mono font-semibold">
                              {temp.aspectRatio}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                            {temp.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Template Properties Form */}
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-primary" />
                  2. Customize Overlay Variables
                </h3>

                <form onSubmit={triggerRenderPipeline} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Primary Headline Text
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. UNLEASH PURE ENERGY"
                      className="w-full rounded-md border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Secondary Sub-headline Text
                    </label>
                    <input
                      type="text"
                      value={subHeadline}
                      onChange={(e) => setSubHeadline(e.target.value)}
                      placeholder="e.g. Zero Sugar. Zero Crash."
                      className="w-full rounded-md border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Accent Color Overrides */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Accent Theme Color (Syncs with Brand Palette)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={accentColor || "#FF4500"}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-8 w-8 rounded border border-border bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={accentColor || "#FF4500"}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-full text-xs font-mono bg-secondary/30 p-1.5 border border-border rounded"
                      />
                    </div>
                  </div>

                  {/* Prompt Preset Infuse */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Target Focus Brand
                    </span>
                    <div className="bg-secondary/20 p-2.5 rounded border border-border font-medium">
                      Active: {activeClient.name}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRendering}
                    className="w-full rounded-md bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {isRendering ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Preparing preview: {renderProgress}%
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Create Demo Preview
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT PREVIEW & PIPELINE PANE (7 Columns) */}
            <div className="xl:col-span-7 space-y-6">
              
              {/* If rendering pipeline is active, show the loading console */}
              {isRendering && (
                <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-primary animate-spin" />
                    Demo Preview Preparation
                  </h3>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-semibold">                      Preparing demo preview</span>
                      <span className="font-bold font-mono text-primary">{renderProgress}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2.5 rounded overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Log Console */}
                  <div className="bg-black/90 text-emerald-400 font-mono text-[11px] p-4 rounded border border-border space-y-1.5 min-h-[140px] leading-relaxed">
                    <div className="text-muted-foreground border-b border-border pb-1.5 mb-1.5 text-[10px]">
                      SYSTEM DISPATCH CONSOLE LOGS
                    </div>
                    {renderLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-muted-foreground select-none">[{idx + 1}]</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Player Display Container */}
              {completedVideo ? (
                <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col justify-between">
                  {/* Player Header */}
                  <div className="border-b border-border bg-secondary/10 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary animate-pulse" />
                      <h4 className="text-xs font-bold text-foreground">
                        HTML5 Media Preview Player
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-mono font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Demo Preview
                    </span>
                  </div>

                  {/* Visual Screen */}
                  <div className="aspect-video relative bg-black flex items-center justify-center overflow-hidden">
                    {/* Demo preview background */}
                    <video
                      src={completedVideo.meta?.videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Custom Variables Overlay Simulation */}
                    <div className="absolute inset-x-4 bottom-14 flex flex-col items-center text-center p-4 bg-black/40 backdrop-blur-[1px] rounded pointer-events-none">
                      <h2
                        className="text-base md:text-xl font-black uppercase tracking-tight leading-tight"
                        style={{ color: completedVideo.meta?.colorHex }}
                      >
                        {headline || completedVideo.meta?.textVariables?.[0]}
                      </h2>
                      <p className="text-[10px] md:text-xs text-white font-medium mt-0.5">
                        {subHeadline || completedVideo.meta?.textVariables?.[1]}
                      </p>
                    </div>
                  </div>

                  {/* Player Footer properties details */}
                  <div className="p-4 bg-secondary/10 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-foreground truncate max-w-[280px]">
                        {completedVideo.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Template: {completedVideo.meta?.template} | {completedVideo.providerUsed}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold bg-primary/20 text-primary px-2.5 py-1 rounded font-mono uppercase">
                        Render OK
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                !isRendering && (
                  <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px] space-y-3">
                    <Layers className="h-10 w-10 text-muted-foreground animate-pulse" />
                    <h3 className="text-sm font-semibold text-foreground">Video Preview Screen</h3>
                    <p className="max-w-md mx-auto text-xs leading-relaxed">
                      Select a template and enter text to save a demo preview. This does not render or export an MP4.
                    </p>
                  </div>
                )
              )}

            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
