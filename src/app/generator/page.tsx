"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState, GeneratedContent } from "@/context/AppStateContext"
import { Sparkles, PenTool, Image as ImageIcon, Send, ArrowRight, Eye, RefreshCw, Layers, CheckCircle } from "lucide-react"

export default function GeneratorPage() {
  const { state, generateAIContent, updateContentStatus } = useAppState()
  
  const activeClient = state.clients.find((c) => c.id === state.activeClientId)

  // Form states
  const [generationType, setGenerationType] = useState<GeneratedContent["type"]>("strategy")
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [latestAsset, setLatestAsset] = useState<GeneratedContent | null>(null)
  const [notification, setNotification] = useState("")

  // Quick prompt presets based on category
  const promptPresets: Record<string, string[]> = {
    strategy: [
      "Summer product launch strategy for athletes",
      "Organic growth hacking social media strategy",
      "Rebranding awareness strategy for eco-conscious audience"
    ],
    caption: [
      "Launch post announcing 50% off clean formulas",
      "Inspiring Friday quote for marathon runners",
      "Behind-the-scenes video description showing ingredient purity"
    ],
    hashtag: [
      "Viral hashtags for skincare wellness",
      "High impact fitness and athletic tags",
      "Minimalist aesthetic lifestyle trends"
    ],
    ad_script: [
      "15-second high tempo TikTok promotion script",
      "30-second dramatic Facebook ad voiceover outline",
      "60-second product review testimonial layout"
    ],
    thumbnail: [
      "Bold typographic overlay: PURE ENERGY",
      "Elegant pastel theme: DEWY HYDRATION",
      "Modern contrast design: ZERO SUGAR"
    ]
  }

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeClient) {
      alert("Please select a focused client from the sidebar first.")
      return
    }
    if (!prompt.trim()) {
      alert("Please enter a custom prompt or click a preset.")
      return
    }

    setIsGenerating(true)
    
    // Simulate API call and router delay
    setTimeout(() => {
      const result = generateAIContent(activeClient.id, generationType, prompt)
      setLatestAsset(result)
      setIsGenerating(false)
      setPrompt("")
      setNotification(`Content successfully generated using active router provider: ${result.providerUsed}!`)
      setTimeout(() => setNotification(""), 4000)
    }, 1200)
  }

  const handleApprove = () => {
    if (latestAsset) {
      updateContentStatus(latestAsset.id, "approved")
      setNotification("Asset approved and sent to publishing manager!")
      setLatestAsset((prev) => (prev ? { ...prev, status: "approved" } : null))
      setTimeout(() => setNotification(""), 3000)
    }
  }

  const handleRegenerate = () => {
    if (latestAsset) {
      setIsGenerating(true)
      const oldType = latestAsset.type
      const oldPrompt = latestAsset.title.replace(`${oldType.toUpperCase()} - `, "").replace("...", "")
      
      setTimeout(() => {
        const result = generateAIContent(activeClient!.id, oldType, oldPrompt + " (V2 Regenerated)")
        setLatestAsset(result)
        setIsGenerating(false)
        setNotification(`Successfully regenerated asset using: ${result.providerUsed}`)
        setTimeout(() => setNotification(""), 3000)
      }, 1000)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Block */}
        <div className="border-b border-border pb-5">
          <h2 className="text-xl font-bold text-foreground tracking-tight">AI Content & Thumbnail Generator</h2>
          <p className="text-xs text-muted-foreground">
            Instantly write ad scripts, campaign strategies, organic captions, or render rich overlay thumbnails using active AI router networks.
          </p>
        </div>

        {notification && (
          <div className="rounded-md bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium">
            {notification}
          </div>
        )}

        {!activeClient ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground space-y-3">
            <PenTool className="h-10 w-10 mx-auto text-muted-foreground animate-pulse" />
            <h3 className="text-sm font-semibold text-foreground">No Focused Client</h3>
            <p className="max-w-md mx-auto text-xs leading-relaxed">
              Before generating copywriting scripts or social media thumbnails, please focus on a client in the sidebar to feed their brand details into the AI model.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT INPUT CONTROLS PANE (5 Columns) */}
            <div className="xl:col-span-5 space-y-6">
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
                  AI Model Instructions
                </h3>

                <form onSubmit={handleGenerate} className="space-y-4">
                  {/* Select Generator Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Asset Category Type
                    </label>
                    <select
                      value={generationType}
                      onChange={(e) => {
                        setGenerationType(e.target.value as GeneratedContent["type"])
                        setPrompt("")
                      }}
                      className="w-full rounded-md border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="strategy">AI Marketing Strategy Outline</option>
                      <option value="caption">Social Post Caption Copy</option>
                      <option value="hashtag">Optimized Brand Hashtags</option>
                      <option value="ad_script">Video Ad Dialog Script</option>
                      <option value="thumbnail">Graphic Text Thumbnail Gen</option>
                    </select>
                  </div>

                  {/* Custom Prompt Box */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Generation Brief / Focus Theme
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Specify key themes, call to action requirements, or graphic guidelines for the prompt..."
                      className="w-full min-h-[100px] rounded-md border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>

                  {/* Preset Suggestions */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Recommended Preset Prompts
                    </label>
                    <div className="space-y-1.5">
                      {promptPresets[generationType].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPrompt(preset)}
                          className="w-full text-left bg-secondary/20 hover:bg-secondary/40 border border-border p-2 rounded text-xs text-foreground truncate block font-medium"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trigger Generation Button */}
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full rounded-md bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        AI Router: Routing Failover Queues...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate with active router: {generationType === "thumbnail" ? state.providers.image.active : state.providers.text.active}
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Connected Client Context Display Box */}
              <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  AI Context Infused from Client Profile
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground">
                    {activeClient.name}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {activeClient.companyDescription}
                  </p>
                  <p className="text-[11px] text-foreground font-semibold">
                    Target: {activeClient.targetAudience}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT GENERATION OUTPUT PANE (7 Columns) */}
            <div className="xl:col-span-7">
              {latestAsset ? (
                <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col justify-between h-full min-h-[400px]">
                  {/* Output Header */}
                  <div className="border-b border-border bg-secondary/10 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                        {latestAsset.type}
                      </span>
                      <h4 className="text-xs font-bold text-foreground">
                        Generated Asset Output
                      </h4>
                    </div>

                    <div className="text-[10px] text-muted-foreground font-mono">
                      Provider: <span className="text-foreground font-semibold">{latestAsset.providerUsed}</span>
                    </div>
                  </div>

                  {/* Output Body Container */}
                  <div className="p-6 flex-1 space-y-4">
                    {/* Thumbnail graphic layout view */}
                    {latestAsset.type === "thumbnail" && latestAsset.meta?.imageUrl && (
                      <div className="relative aspect-video w-full rounded border border-border overflow-hidden bg-black flex items-center justify-center">
                        <img
                          src={latestAsset.meta.imageUrl}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                          <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight uppercase drop-shadow-lg leading-tight">
                            {latestAsset.meta.overlayText}
                          </h3>
                        </div>
                      </div>
                    )}

                    {/* Typography copy code box */}
                    <div className="bg-secondary/30 border border-border p-5 rounded-md font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed min-h-[180px] overflow-y-auto">
                      {latestAsset.content}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div>Status: 
                        <span className={`ml-1 font-bold font-mono uppercase ${
                          latestAsset.status === "approved" ? "text-emerald-500" : "text-amber-500"
                        }`}>
                          {latestAsset.status}
                        </span>
                      </div>
                      <div className="font-mono text-[10px]">
                        Saved in Database
                      </div>
                    </div>
                  </div>

                  {/* Output Footer Controls */}
                  <div className="border-t border-border bg-secondary/10 p-4 flex items-center justify-between gap-4">
                    <button
                      onClick={handleRegenerate}
                      className="inline-flex items-center gap-1.5 border border-border bg-card px-4 py-2 rounded-md text-xs font-semibold text-foreground hover:bg-secondary transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate
                    </button>

                    {latestAsset.status !== "approved" ? (
                      <button
                        onClick={handleApprove}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition ml-auto"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approve Asset
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-500 font-bold flex items-center gap-1.5 ml-auto bg-emerald-500/10 px-3 py-1.5 rounded border border-emerald-500/20">
                        <CheckCircle className="h-4 w-4" />
                        Approved
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[400px] space-y-3">
                  <Layers className="h-10 w-10 text-muted-foreground animate-pulse" />
                  <h3 className="text-sm font-semibold text-foreground">Awaiting Output</h3>
                  <p className="max-w-md mx-auto text-xs leading-relaxed">
                    Choose an asset category from the left pane, specify guidelines or custom brief requirements, and click &quot;Generate&quot; to invoke the AI Router pipeline.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
