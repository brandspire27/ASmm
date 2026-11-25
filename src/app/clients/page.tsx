"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState } from "@/context/AppStateContext"
import { Users, Plus, Trash, Globe, MapPin, Tag, Sparkles, Building2 } from "lucide-react"

export default function ClientsPage() {
  const { state, addClient, setActiveClient } = useAppState()
  
  // Local states for new client form
  const [name, setName] = useState("")
  const [companyDescription, setCompanyDescription] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#4A90E2")
  const [secondaryColor, setSecondaryColor] = useState("#50E3C2")
  const [darkColor, setDarkColor] = useState("#000000")
  
  const [isAdding, setIsAdding] = useState(false)
  const [notification, setNotification] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !companyDescription || !targetAudience) {
      alert("Please fill in all details.")
      return
    }

    const brandColors = [primaryColor, secondaryColor, darkColor]
    const newClient = addClient(name, companyDescription, targetAudience, brandColors)
    
    // Reset form
    setName("")
    setCompanyDescription("")
    setTargetAudience("")
    setPrimaryColor("#4A90E2")
    setSecondaryColor("#50E3C2")
    setDarkColor("#000000")
    setIsAdding(false)
    
    setNotification(`Successfully created client: ${newClient.name}!`)
    setTimeout(() => setNotification(""), 4000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Block */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Client Manager</h2>
            <p className="text-xs text-muted-foreground">
              Define target audiences, brand specifications, and core color guides for your agency clients.
            </p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            {isAdding ? "Close Form" : "Add New Client"}
          </button>
        </div>

        {notification && (
          <div className="rounded-md bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium">
            {notification}
          </div>
        )}

        {/* Add Client Form (Conditional Drawer/Block) */}
        {isAdding && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Configure New Client Identity
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Company / Client Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apex Athletic"
                    className="w-full rounded-md border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Target Audience / Persona
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Professional athletes and outdoor runners, 18-35"
                    className="w-full rounded-md border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Detailed Company Description & Positioning
                </label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Summarize products, services, tone of voice, and value propositions for AI model training..."
                  className="w-full min-h-[80px] rounded-md border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Brand Color Palette (Hex Values)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-8 w-8 rounded border border-border bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full text-xs font-mono bg-secondary/30 p-1 border border-border rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-8 w-8 rounded border border-border bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full text-xs font-mono bg-secondary/30 p-1 border border-border rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="h-8 w-8 rounded border border-border bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-full text-xs font-mono bg-secondary/30 p-1 border border-border rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
                >
                  Create Client & Load Workspace
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clients List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.clients.map((client) => {
            const isFocused = state.activeClientId === client.id
            const campaignCount = state.analytics.filter((a) => a.clientId === client.id).length
            const assetCount = client.assets.length

            return (
              <div
                key={client.id}
                className={`rounded-lg border p-6 space-y-4 bg-card transition-all ${
                  isFocused
                    ? "border-primary ring-1 ring-primary/40 shadow-lg"
                    : "border-border hover:border-secondary"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {client.logoUrl ? (
                      <img
                        src={client.logoUrl}
                        alt={client.name}
                        className="h-10 w-10 rounded-md object-cover border border-border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {client.name}
                      </h3>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">
                        ID: {client.id}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveClient(client.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition ${
                      isFocused
                        ? "bg-primary/10 text-primary border border-primary/20 pointer-events-none"
                        : "border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isFocused ? "Active Workspace Focus" : "Focus Workspace"}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {client.companyDescription}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-foreground bg-secondary/50 p-2 rounded border border-border">
                    <span className="font-semibold shrink-0 text-muted-foreground">Target:</span>
                    <span className="truncate">{client.targetAudience}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">Brand Palette:</span>
                    <div className="flex gap-1">
                      {client.brandColors.map((color, idx) => (
                        <div
                          key={idx}
                          className="h-3 w-3 rounded-full border border-border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 text-[11px] font-mono">
                    <div>
                      <span className="font-bold text-foreground">{assetCount}</span> assets
                    </div>
                    <div>
                      <span className="font-bold text-foreground">{campaignCount}</span> campaigns
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
