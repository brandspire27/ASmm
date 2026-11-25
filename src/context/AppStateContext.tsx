"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface Client {
  id: string
  name: string
  companyDescription: string
  targetAudience: string
  brandColors: string[] // HEX codes
  logoUrl?: string
  assets: BrandAsset[]
}

export interface BrandAsset {
  id: string
  name: string
  type: "logo" | "product" | "banner" | "other"
  url: string
  uploadedAt: string
}

export interface AIProviderState {
  text: {
    sequence: string[]
    active: string
    limitsReached: Record<string, boolean>
  }
  image: {
    sequence: string[]
    active: string
    limitsReached: Record<string, boolean>
  }
  video: {
    sequence: string[]
    active: string
    limitsReached: Record<string, boolean>
  }
}

export interface GeneratedContent {
  id: string
  clientId: string
  clientName: string
  type: "strategy" | "caption" | "hashtag" | "ad_script" | "thumbnail" | "video"
  title: string
  content: string // Strategy outline, captions, etc.
  meta?: GeneratedContentMeta
  status: "draft" | "approved" | "rejected" | "published"
  providerUsed: string
  createdAt: string
}

export interface GeneratedContentMeta {
  imageUrl?: string
  overlayText?: string
  template?: string
  textVariables?: string[]
  colorHex?: string
  videoUrl?: string
  status?: string
}

export interface CampaignAnalytics {
  id: string
  clientId: string
  campaignName: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  ctr: number
  conversionRate: number
  status: "active" | "completed" | "paused"
  createdAt: string
}

interface AppState {
  clients: Client[]
  activeClientId: string | null
  providers: AIProviderState
  contentList: GeneratedContent[]
  analytics: CampaignAnalytics[]
  currentUser: { email: string; name: string } | null
}

interface AppContextType {
  state: AppState
  login: (email: string) => boolean
  logout: () => void
  addClient: (name: string, companyDescription: string, targetAudience: string, brandColors: string[]) => Client
  addBrandAsset: (clientId: string, name: string, type: BrandAsset["type"], url: string) => void
  deleteBrandAsset: (clientId: string, assetId: string) => void
  setActiveClient: (id: string | null) => void
  triggerFailover: (type: "text" | "image" | "video") => string
  resetProviderLimits: (type: "text" | "image" | "video") => void
  toggleProviderLimit: (type: "text" | "image" | "video", provider: string, reached: boolean) => void
  generateAIContent: (
    clientId: string,
    type: GeneratedContent["type"],
    prompt: string,
    additionalMeta?: GeneratedContentMeta
  ) => GeneratedContent
  updateContentStatus: (id: string, status: GeneratedContent["status"]) => void
  addCampaign: (campaign: Omit<CampaignAnalytics, "id" | "ctr" | "conversionRate" | "createdAt">) => void
  simulateCampaignStats: () => void
}

const DEFAULT_CLIENTS: Client[] = [
  {
    id: "1",
    name: "Apex Athletic",
    companyDescription: "High-performance organic energy drinks for endurance athletes made with zero sugar.",
    targetAudience: "Marathon runners, triathletes, crossfitters, aged 18-45.",
    brandColors: ["#000000", "#FF4500", "#98FF98"],
    logoUrl: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=100&h=100&fit=crop&q=80",
    assets: [
      {
        id: "a1",
        name: "Primary Logo Orange",
        type: "logo",
        url: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=300&h=300&fit=crop&q=80",
        uploadedAt: new Date().toLocaleDateString()
      },
      {
        id: "a2",
        name: "Zero sugar Energy Can Product Shot",
        type: "product",
        url: "https://images.unsplash.com/photo-1560072898-2162ab99015b?w=400&h=400&fit=crop&q=80",
        uploadedAt: new Date().toLocaleDateString()
      }
    ]
  },
  {
    id: "2",
    name: "Lumina Skincare",
    companyDescription: "Clean, dermatologist-formulated vegan skincare line offering intense hydration.",
    targetAudience: "Beauty conscious consumers, eco-friendly lifestyle advocates, aged 20-50.",
    brandColors: ["#FFF0F5", "#D8BFD8", "#4A0E4E"],
    logoUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&h=100&fit=crop&q=80",
    assets: [
      {
        id: "a3",
        name: "Brand Logo Lavender",
        type: "logo",
        url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop&q=80",
        uploadedAt: new Date().toLocaleDateString()
      },
      {
        id: "a4",
        name: "Hydrating Serum Dropper",
        type: "product",
        url: "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=400&h=400&fit=crop&q=80",
        uploadedAt: new Date().toLocaleDateString()
      }
    ]
  }
]

const DEFAULT_PROVIDERS: AIProviderState = {
  text: {
    sequence: ["Gemini", "Groq", "OpenRouter", "Cloudflare AI"],
    active: "Gemini",
    limitsReached: { Gemini: false, Groq: false, OpenRouter: false, "Cloudflare AI": false }
  },
  image: {
    sequence: ["Clipdrop", "Pixian", "Cloudflare AI"],
    active: "Clipdrop",
    limitsReached: { Clipdrop: false, Pixian: false, "Cloudflare AI": false }
  },
  video: {
    sequence: ["Creatomate", "Shotstack", "JSON2Video"],
    active: "Creatomate",
    limitsReached: { Creatomate: false, Shotstack: false, JSON2Video: false }
  }
}

const DEFAULT_CONTENT: GeneratedContent[] = [
  {
    id: "c1",
    clientId: "1",
    clientName: "Apex Athletic",
    type: "strategy",
    title: "Summer Energy Kickoff",
    content: `## AI Marketing Strategy: Summer Energy Kickoff
    
### Core Campaign Angle
Position Apex Athletic as the ultimate companion for hot-weather endurance training. Focus on the organic formula, zero crashes, and zero sugar.

### Target Match
Active crossfitters and trail runners who face dehydration during high-intensity summer heat.

### Suggested Schedule
- Week 1: Introduction to Clean Summer Hydration.
- Week 2: Testimonials from Marathon Runners.
- Week 3: Dynamic high-tempo Video Ad campaigns emphasizing the orange-can product.`,
    status: "approved",
    providerUsed: "Gemini",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "c2",
    clientId: "1",
    clientName: "Apex Athletic",
    type: "caption",
    title: "Endure the Heat Post Caption",
    content: "🔥 Don't let summer temperatures slow your performance down. Pack your Apex Organic Energy, zero sugar, maximum focus, and absolute endurance. Fuel your run today. #ApexAthletic #EnduranceRun #OrganicEnergy",
    status: "draft",
    providerUsed: "Gemini",
    createdAt: new Date().toISOString()
  },
  {
    id: "c3",
    clientId: "2",
    clientName: "Lumina Skincare",
    type: "hashtag",
    title: "Lumina Hydration Campaign Tags",
    content: "#LuminaSkincare #CleanBeauty #DermFormulated #VeganSkincare #HydrationGoals #SkinDewy",
    status: "approved",
    providerUsed: "Gemini",
    createdAt: new Date().toISOString()
  }
]

const DEFAULT_ANALYTICS: CampaignAnalytics[] = [
  {
    id: "an1",
    clientId: "1",
    campaignName: "Endure Summer Launch",
    impressions: 45000,
    clicks: 3800,
    conversions: 240,
    spend: 450,
    ctr: 8.44,
    conversionRate: 6.31,
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 240).toISOString()
  },
  {
    id: "an2",
    clientId: "2",
    campaignName: "Glow & Hydrate Instagram Ad",
    impressions: 12000,
    clicks: 1100,
    conversions: 85,
    spend: 150,
    ctr: 9.17,
    conversionRate: 7.72,
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString()
  }
]

const AppStateContext = createContext<AppContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    clients: DEFAULT_CLIENTS,
    activeClientId: "1",
    providers: DEFAULT_PROVIDERS,
    contentList: DEFAULT_CONTENT,
    analytics: DEFAULT_ANALYTICS,
    currentUser: null
  })

  useEffect(() => {
    // Load state from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("agencyos_lite_state")
      if (stored) {
        try {
          // Persisted state is client-only and must hydrate after the server render.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setState(JSON.parse(stored))
        } catch (e) {
          console.error("Failed to parse cached agency state", e)
        }
      }
    }
  }, [])

  const saveState = (updated: AppState) => {
    setState(updated)
    if (typeof window !== "undefined") {
      localStorage.setItem("agencyos_lite_state", JSON.stringify(updated))
    }
  }

  const login = (email: string) => {
    // Mock auto log in anyone for ease of use in internal tool
    const user = { email, name: email.split("@")[0].toUpperCase() }
    saveState({
      ...state,
      currentUser: user
    })
    return true
  }

  const logout = () => {
    saveState({
      ...state,
      currentUser: null
    })
  }

  const addClient = (name: string, companyDescription: string, targetAudience: string, brandColors: string[]) => {
    const newClient: Client = {
      id: Math.random().toString(36).substring(7),
      name,
      companyDescription,
      targetAudience,
      brandColors,
      assets: []
    }
    const updatedClients = [...state.clients, newClient]
    saveState({
      ...state,
      clients: updatedClients,
      activeClientId: newClient.id
    })
    return newClient
  }

  const addBrandAsset = (clientId: string, name: string, type: BrandAsset["type"], url: string) => {
    const newAsset: BrandAsset = {
      id: Math.random().toString(36).substring(7),
      name,
      type,
      url,
      uploadedAt: new Date().toLocaleDateString()
    }
    const updatedClients = state.clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          assets: [...c.assets, newAsset],
          logoUrl: type === "logo" ? url : c.logoUrl
        }
      }
      return c
    })
    saveState({ ...state, clients: updatedClients })
  }

  const deleteBrandAsset = (clientId: string, assetId: string) => {
    const updatedClients = state.clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          assets: c.assets.filter((a) => a.id !== assetId)
        }
      }
      return c
    })
    saveState({ ...state, clients: updatedClients })
  }

  const setActiveClient = (id: string | null) => {
    saveState({ ...state, activeClientId: id })
  }

  const triggerFailover = (type: "text" | "image" | "video") => {
    const chain = state.providers[type]
    const currentIndex = chain.sequence.indexOf(chain.active)
    
    // Mark current active as limit reached
    const updatedLimits = { ...chain.limitsReached, [chain.active]: true }
    
    // Find next provider in sequence that hasn't reached limit
    let nextActive = chain.active
    for (let i = 1; i <= chain.sequence.length; i++) {
      const nextIndex = (currentIndex + i) % chain.sequence.length
      const candidate = chain.sequence[nextIndex]
      if (!updatedLimits[candidate]) {
        nextActive = candidate
        break
      }
    }

    const updatedProviders = {
      ...state.providers,
      [type]: {
        ...chain,
        active: nextActive,
        limitsReached: updatedLimits
      }
    }

    saveState({ ...state, providers: updatedProviders })
    return nextActive
  }

  const resetProviderLimits = (type: "text" | "image" | "video") => {
    const chain = state.providers[type]
    const updatedLimits = { ...chain.limitsReached }
    chain.sequence.forEach((p) => {
      updatedLimits[p] = false
    })

    const updatedProviders = {
      ...state.providers,
      [type]: {
        ...chain,
        active: chain.sequence[0],
        limitsReached: updatedLimits
      }
    }
    saveState({ ...state, providers: updatedProviders })
  }

  const toggleProviderLimit = (type: "text" | "image" | "video", provider: string, reached: boolean) => {
    const chain = state.providers[type]
    const updatedLimits = { ...chain.limitsReached, [provider]: reached }
    
    // If the active provider gets its limit hit, find next healthy
    let active = chain.active
    if (provider === chain.active && reached) {
      const currentIndex = chain.sequence.indexOf(chain.active)
      for (let i = 1; i <= chain.sequence.length; i++) {
        const nextIndex = (currentIndex + i) % chain.sequence.length
        const candidate = chain.sequence[nextIndex]
        if (!updatedLimits[candidate]) {
          active = candidate
          break
        }
      }
    }

    const updatedProviders = {
      ...state.providers,
      [type]: {
        ...chain,
        active,
        limitsReached: updatedLimits
      }
    }
    saveState({ ...state, providers: updatedProviders })
  }

  const generateAIContent = (
    clientId: string,
    type: GeneratedContent["type"],
    prompt: string,
    additionalMeta?: GeneratedContentMeta
  ) => {
    const client = state.clients.find((c) => c.id === clientId)
    const clientName = client ? client.name : "Unknown Client"
    
    // Resolve Text/Image/Video provider
    let routerType: "text" | "image" | "video" = "text"
    if (type === "thumbnail") routerType = "image"
    if (type === "video") routerType = "video"

    const currentProvider = state.providers[routerType].active

    let generatedText = ""
    let generatedMeta = additionalMeta || {}

    // Simulated content builder mimicking OpenAI / Gemini models
    if (type === "strategy") {
      generatedText = `## AI Campaign Strategy: ${prompt}
      
### Objectives
- Drive high engagement across organic and paid channels.
- Expand client brand awareness centered on product assets.

### AI Suggested Actions
1. Utilize visual assets showcasing client product features in bold, dark contrast templates.
2. Launch daily ad scripts pointing to direct landing pages.
3. Keep hashtags clean and conversion-driven.`
    } else if (type === "caption") {
      generatedText = `🚀 Ready to boost results for ${clientName}? ${prompt}. Formulated specifically with high intent. Zero filler. Click the link in bio! #Marketing #Automation #AgencyOS`
    } else if (type === "hashtag") {
      generatedText = `#${clientName.replace(/\s+/g, "")} #DigitalMarketing #AIAutomation #GrowBrand #AgencyOSLite #PerformanceDriven`
    } else if (type === "ad_script") {
      generatedText = `[SCENE 1: Visual of ${clientName} primary assets]
Narrator: "Tired of the same old standard templates?"

[SCENE 2: Fast cut close up on product]
Narrator: "${prompt}. This is exactly what you have been waiting for."

[SCENE 3: CTA on screen with brand colors]
Narrator: "Click the button below to get started now!"`
    } else if (type === "thumbnail") {
      generatedText = prompt
      generatedMeta = {
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop&q=80",
        overlayText: prompt
      }
    } else if (type === "video") {
      generatedText = `Template Video: ${prompt}`
      generatedMeta = {
        template: additionalMeta?.template || "Promo Ad",
        textVariables: additionalMeta?.textVariables || [prompt],
        colorHex: client?.brandColors[0] || "#FF4500",
        status: "rendered",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4"
      }
    }

    const newContent: GeneratedContent = {
      id: Math.random().toString(36).substring(7),
      clientId,
      clientName,
      type,
      title: `${type.toUpperCase()} - ${prompt.substring(0, 20)}...`,
      content: generatedText,
      meta: generatedMeta,
      status: "draft",
      providerUsed: currentProvider,
      createdAt: new Date().toISOString()
    }

    saveState({
      ...state,
      contentList: [newContent, ...state.contentList]
    })

    return newContent
  }

  const updateContentStatus = (id: string, status: GeneratedContent["status"]) => {
    const updated = state.contentList.map((c) => (c.id === id ? { ...c, status } : c))
    saveState({ ...state, contentList: updated })
  }

  const addCampaign = (campaign: Omit<CampaignAnalytics, "id" | "ctr" | "conversionRate" | "createdAt">) => {
    const newCamp: CampaignAnalytics = {
      ...campaign,
      id: Math.random().toString(36).substring(7),
      ctr: parseFloat(((campaign.clicks / campaign.impressions) * 100).toFixed(2)) || 0,
      conversionRate: parseFloat(((campaign.conversions / campaign.clicks) * 100).toFixed(2)) || 0,
      createdAt: new Date().toISOString()
    }
    saveState({
      ...state,
      analytics: [newCamp, ...state.analytics]
    })
  }

  const simulateCampaignStats = () => {
    const updated = state.analytics.map((camp) => {
      if (camp.status === "active") {
        const addedImpressions = Math.floor(Math.random() * 1500) + 100
        const addedClicks = Math.floor(addedImpressions * (Math.random() * 0.08 + 0.02))
        const addedConversions = Math.floor(addedClicks * (Math.random() * 0.12 + 0.03))
        const addedSpend = Math.floor(addedClicks * 0.15)

        const impressions = camp.impressions + addedImpressions
        const clicks = camp.clicks + addedClicks
        const conversions = camp.conversions + addedConversions
        const spend = camp.spend + addedSpend
        const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2))
        const conversionRate = parseFloat(((conversions / clicks) * 100).toFixed(2))

        return {
          ...camp,
          impressions,
          clicks,
          conversions,
          spend,
          ctr,
          conversionRate
        }
      }
      return camp
    })
    saveState({ ...state, analytics: updated })
  }

  return (
    <AppStateContext.Provider
      value={{
        state,
        login,
        logout,
        addClient,
        addBrandAsset,
        deleteBrandAsset,
        setActiveClient,
        triggerFailover,
        resetProviderLimits,
        toggleProviderLimit,
        generateAIContent,
        updateContentStatus,
        addCampaign,
        simulateCampaignStats
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}
