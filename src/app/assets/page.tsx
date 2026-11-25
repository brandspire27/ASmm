"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState, BrandAsset } from "@/context/AppStateContext"
import { Briefcase, UploadCloud, PlusCircle, Trash2, Image as ImageIcon, Link as LinkIcon, FileCheck } from "lucide-react"

export default function AssetsPage() {
  const { state, addBrandAsset, deleteBrandAsset } = useAppState()
  
  const activeClient = state.clients.find((c) => c.id === state.activeClientId)

  // Local form state
  const [assetName, setAssetName] = useState("")
  const [assetType, setAssetType] = useState<BrandAsset["type"]>("logo")
  const [assetUrl, setAssetUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [notification, setNotification] = useState("")

  // Suggested high quality sample imagery to make it easy to add assets!
  const SAMPLE_IMAGES = [
    { name: "Can Mockup Gray", url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&h=600&fit=crop&q=80" },
    { name: "Bottle Glow Mockup", url: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&h=600&fit=crop&q=80" },
    { name: "Studio Product Spotlight", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&q=80" },
    { name: "Brand Abstract Background", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop&q=80" }
  ]

  const handleSimulatedUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeClient) {
      alert("Please focus on a client first.")
      return
    }
    if (!assetName || !assetUrl) {
      alert("Please fill in asset details.")
      return
    }

    addBrandAsset(activeClient.id, assetName, assetType, assetUrl)
    setAssetName("")
    setAssetUrl("")
    setIsUploading(false)
    setNotification("Brand asset uploaded and simulated to Cloudflare R2 successfully!")
    setTimeout(() => setNotification(""), 4000)
  }

  const handleUseSample = (sample: typeof SAMPLE_IMAGES[0]) => {
    setAssetName(sample.name)
    setAssetUrl(sample.url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-border pb-5">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Brand Asset Management</h2>
            <p className="text-xs text-muted-foreground">
              Securely store logos, high-res products, palettes, and media resources simulated inside Cloudflare R2 bucket.
            </p>
          </div>

          {activeClient && (
            <button
              onClick={() => setIsUploading(!isUploading)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              <UploadCloud className="h-4 w-4" />
              {isUploading ? "Cancel Asset Upload" : "Simulate R2 Upload"}
            </button>
          )}
        </div>

        {notification && (
          <div className="rounded-md bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium">
            {notification}
          </div>
        )}

        {/* If no focused client */}
        {!activeClient ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground space-y-3">
            <Briefcase className="h-10 w-10 mx-auto text-muted-foreground animate-pulse" />
            <h3 className="text-sm font-semibold text-foreground">No Focused Client Selected</h3>
            <p className="max-w-md mx-auto text-xs leading-relaxed">
              Brand asset vaults are client-specific. Please choose a client in the left-hand sidebar selector to configure logos, colors, and graphics.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Asset Upload Panel */}
            {isUploading && (
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-primary" />
                  Upload Brand Assets (Cloudflare R2 Bucket Simulator)
                </h3>

                <form onSubmit={handleSimulatedUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Asset Name / Description
                      </label>
                      <input
                        type="text"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        placeholder="e.g. Transparent PNG Logo Dark Theme"
                        className="w-full rounded-md border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Asset Classification Group
                      </label>
                      <select
                        value={assetType}
                        onChange={(e) => setAssetType(e.target.value as BrandAsset["type"])}
                        className="w-full rounded-md border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        <option value="logo">Company Logo</option>
                        <option value="product">Product Image</option>
                        <option value="banner">Ad Banner Background</option>
                        <option value="other">Other Asset / PDF Guidelines</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Asset Remote Resource URL
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="url"
                        value={assetUrl}
                        onChange={(e) => setAssetUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-md border border-border bg-secondary/30 py-2 pl-10 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  {/* Suggest Quick Samples */}
                  <div className="space-y-2 pt-2">
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      Quick Sample Resources (Click to auto fill details)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SAMPLE_IMAGES.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleUseSample(sample)}
                          className="flex flex-col text-left border border-border bg-secondary/15 hover:bg-secondary/40 p-2 rounded transition-all text-[10px]"
                        >
                          <img
                            src={sample.url}
                            alt={sample.name}
                            className="h-10 w-full object-cover rounded mb-1 border border-border"
                          />
                          <span className="font-semibold text-foreground truncate w-full">{sample.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
                    >
                      Process Simulated R2 Upload
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Assets Grid by Category */}
            <div className="space-y-6">
              {/* Core Color Palette Block */}
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
                  Client Brand Color Palette
                </h3>
                <div className="flex flex-wrap gap-4">
                  {activeClient.brandColors.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-secondary/30 border border-border p-3 rounded-lg min-w-[150px]"
                    >
                      <div
                        className="h-10 w-10 rounded-md border border-border shadow-inner shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Hex Code
                        </div>
                        <div className="text-xs font-mono font-bold text-foreground truncate">
                          {color}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gallery List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeClient.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-lg border border-border bg-card overflow-hidden flex flex-col group hover:border-secondary transition-all"
                  >
                    <div className="aspect-video relative bg-secondary/30 flex items-center justify-center overflow-hidden border-b border-border">
                      {asset.type === "logo" || asset.type === "product" || asset.type === "banner" ? (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileCheck className="h-12 w-12 text-primary" />
                      )}

                      <span className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border border-border text-[9px] font-bold px-2 py-0.5 rounded uppercase text-foreground">
                        {asset.type}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-foreground line-clamp-1">
                          {asset.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Uploaded: {asset.uploadedAt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline font-semibold"
                        >
                          View Full Asset
                        </a>

                        <button
                          onClick={() => deleteBrandAsset(activeClient.id, asset.id)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                          title="Delete brand asset"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {activeClient.assets.length === 0 && (
                <div className="rounded-lg border border-dashed border-border py-12 text-center text-muted-foreground text-xs italic">
                  No brand assets (logos or product shots) loaded for {activeClient.name} yet. Click &quot;Simulate R2 Upload&quot; above to quickly load assets.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
