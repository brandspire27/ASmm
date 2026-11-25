"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import type { Database, Json } from "@/lib/supabase/database.types"

const STORAGE_BUCKET = "agency-assets"
const SIGNED_URL_SECONDS = 60 * 60

export interface Client {
  id: string
  name: string
  companyDescription: string
  targetAudience: string
  brandColors: string[]
  logoUrl?: string
  assets: BrandAsset[]
}

export interface BrandAsset {
  id: string
  name: string
  type: "logo" | "product" | "banner" | "other"
  url: string
  storagePath?: string
  uploadedAt: string
}

export interface AIProviderState {
  text: ProviderChain
  image: ProviderChain
  video: ProviderChain
}

interface ProviderChain {
  sequence: string[]
  active: string
  limitsReached: Record<string, boolean>
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

export interface GeneratedContent {
  id: string
  clientId: string
  clientName: string
  type: "strategy" | "caption" | "hashtag" | "ad_script" | "thumbnail" | "video"
  title: string
  content: string
  meta?: GeneratedContentMeta
  status: "draft" | "approved" | "rejected" | "published"
  providerUsed: string
  createdAt: string
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

export interface WorkspaceSummary {
  workspaceId: string
  organizationId: string
  organizationName: string
  workspaceName: string
  roleKey: string
}

export interface BrandProfile {
  id: string
  workspaceId: string
  name: string
  industry: string
  websiteUrl: string
  companyDescription: string
  targetAudience: string
  brandVoice: string
  brandColors: string[]
}

interface AgencyUser {
  id: string
  email: string
  name: string
}

interface AppState {
  clients: Client[]
  activeClientId: string | null
  workspaces: WorkspaceSummary[]
  activeWorkspaceId: string | null
  activeRole: string | null
  brandProfile: BrandProfile | null
  providers: AIProviderState
  contentList: GeneratedContent[]
  analytics: CampaignAnalytics[]
  currentUser: AgencyUser | null
}

interface AppContextType {
  state: AppState
  isLoading: boolean
  isConfigured: boolean
  connectionError: string | null
  signUp: (name: string, email: string, password: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  createOrganization: (name: string, workspaceName: string) => Promise<void>
  createWorkspace: (organizationId: string, name: string, timezone: string) => Promise<void>
  inviteWorkspaceMember: (email: string, roleKey: string) => Promise<string>
  switchWorkspace: (workspaceId: string) => Promise<void>
  updateBrandProfile: (profile: Omit<BrandProfile, "id" | "workspaceId">) => Promise<void>
  addClient: (
    name: string,
    companyDescription: string,
    targetAudience: string,
    brandColors: string[]
  ) => Promise<Client>
  addBrandAsset: (
    clientId: string,
    name: string,
    type: BrandAsset["type"],
    url: string
  ) => Promise<void>
  uploadBrandAsset: (
    clientId: string,
    name: string,
    type: BrandAsset["type"],
    file: File
  ) => Promise<void>
  deleteBrandAsset: (clientId: string, assetId: string) => Promise<void>
  setActiveClient: (id: string | null) => void
  triggerFailover: (type: "text" | "image" | "video") => Promise<string>
  resetProviderLimits: (type: "text" | "image" | "video") => Promise<void>
  toggleProviderLimit: (
    type: "text" | "image" | "video",
    provider: string,
    reached: boolean
  ) => Promise<void>
  generateAIContent: (
    clientId: string,
    type: GeneratedContent["type"],
    prompt: string,
    additionalMeta?: GeneratedContentMeta
  ) => Promise<GeneratedContent>
  updateContentStatus: (
    id: string,
    status: GeneratedContent["status"]
  ) => Promise<void>
  addCampaign: (
    campaign: Omit<CampaignAnalytics, "id" | "ctr" | "conversionRate" | "createdAt">
  ) => Promise<void>
}

interface WorkspaceLoadResult {
  hasWorkspace: boolean
  error: string | null
}

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

const EMPTY_STATE: AppState = {
  clients: [],
  activeClientId: null,
  workspaces: [],
  activeWorkspaceId: null,
  activeRole: null,
  brandProfile: null,
  providers: DEFAULT_PROVIDERS,
  contentList: [],
  analytics: [],
  currentUser: null
}

type ClientRow = Database["public"]["Tables"]["clients"]["Row"]
type AssetRow = Database["public"]["Tables"]["brand_assets"]["Row"]
type BrandProfileRow = Database["public"]["Tables"]["brand_profiles"]["Row"]
type ContentRow = Database["public"]["Tables"]["generated_content"]["Row"]
type CampaignRow = Database["public"]["Tables"]["campaign_analytics"]["Row"]

const AppStateContext = createContext<AppContextType | undefined>(undefined)

function userFromAuth(user: User): AgencyUser {
  const fullName = user.user_metadata.full_name
  return {
    id: user.id,
    email: user.email ?? "",
    name: typeof fullName === "string" ? fullName : (user.email ?? "Agency User").split("@")[0]
  }
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected Supabase error occurred."
}

function getRequiredClient() {
  const supabase = createClient()
  if (!supabase) {
    throw new Error("Supabase is not configured. Add the project URL and publishable key to .env.local.")
  }
  return supabase
}

async function signedStorageUrl(path: string) {
  const supabase = getRequiredClient()
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS)
  if (error) throw error
  return data.signedUrl
}

function parseProviderChain(value: Json | undefined, fallback: ProviderChain): ProviderChain {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return fallback

  const row = value as { [key: string]: Json | undefined }
  const sequence = row.sequence
  const active = row.active
  const limitsReached = row.limitsReached
  if (
    !Array.isArray(sequence) ||
    !sequence.every((provider) => typeof provider === "string") ||
    typeof active !== "string" ||
    typeof limitsReached !== "object" ||
    limitsReached === null ||
    Array.isArray(limitsReached)
  ) {
    return fallback
  }

  const limits: Record<string, boolean> = {}
  for (const provider of sequence) {
    const reached = limitsReached[provider]
    if (typeof reached !== "boolean") return fallback
    limits[provider] = reached
  }

  if (!sequence.includes(active)) return fallback
  return { sequence, active, limitsReached: limits }
}

function parseProviders(value: Json | undefined): AIProviderState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return DEFAULT_PROVIDERS
  }
  const row = value as { [key: string]: Json | undefined }
  return {
    text: parseProviderChain(row.text, DEFAULT_PROVIDERS.text),
    image: parseProviderChain(row.image, DEFAULT_PROVIDERS.image),
    video: parseProviderChain(row.video, DEFAULT_PROVIDERS.video)
  }
}

function parseContentMeta(value: Json): GeneratedContentMeta {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {}
  const row = value as { [key: string]: Json | undefined }
  const meta: GeneratedContentMeta = {}

  for (const key of ["imageUrl", "overlayText", "template", "colorHex", "videoUrl", "status"] as const) {
    if (typeof row[key] === "string") meta[key] = row[key]
  }
  if (Array.isArray(row.textVariables) && row.textVariables.every((item) => typeof item === "string")) {
    meta.textVariables = row.textVariables
  }
  return meta
}

function providersToJson(providers: AIProviderState): Json {
  return {
    text: {
      sequence: providers.text.sequence,
      active: providers.text.active,
      limitsReached: providers.text.limitsReached
    },
    image: {
      sequence: providers.image.sequence,
      active: providers.image.active,
      limitsReached: providers.image.limitsReached
    },
    video: {
      sequence: providers.video.sequence,
      active: providers.video.active,
      limitsReached: providers.video.limitsReached
    }
  }
}

async function readWorkspace(user: AgencyUser, preferredWorkspaceId?: string): Promise<AppState> {
  const supabase = getRequiredClient()
  const { data: workspaceRows, error: workspaceError } = await supabase.rpc("get_my_workspaces")
  if (workspaceError) throw workspaceError

  const workspaces: WorkspaceSummary[] = (workspaceRows ?? []).map((row) => ({
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    workspaceName: row.workspace_name,
    roleKey: row.role_key
  }))

  if (workspaces.length === 0) {
    return { ...EMPTY_STATE, currentUser: user }
  }

  const selectedWorkspace = preferredWorkspaceId
    ? workspaces.find((workspace) => workspace.workspaceId === preferredWorkspaceId)
    : workspaces[0]
  if (!selectedWorkspace) {
    throw new Error("You do not have access to the selected workspace.")
  }
  const workspaceId = selectedWorkspace.workspaceId

  const [clientsResult, assetsResult, contentResult, analyticsResult, settingsResult, profileResult] = await Promise.all([
    supabase.from("clients").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("brand_assets").select("*").eq("workspace_id", workspaceId).order("uploaded_at", { ascending: false }),
    supabase.from("generated_content").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("campaign_analytics").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("workspace_settings").select("providers").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("brand_profiles").select("*").eq("workspace_id", workspaceId).order("created_at").limit(1).maybeSingle()
  ])

  if (clientsResult.error) throw clientsResult.error
  if (assetsResult.error) throw assetsResult.error
  if (contentResult.error) throw contentResult.error
  if (analyticsResult.error) throw analyticsResult.error
  if (settingsResult.error) throw settingsResult.error
  if (profileResult.error) throw profileResult.error

  const assetRows = assetsResult.data ?? []
  const assetsByClient = new Map<string, BrandAsset[]>()
  await Promise.all(assetRows.map(async (row: AssetRow) => {
    const asset: BrandAsset = {
      id: row.id,
      name: row.name,
      type: row.type,
      url: row.storage_path ? await signedStorageUrl(row.storage_path) : (row.url ?? ""),
      storagePath: row.storage_path ?? undefined,
      uploadedAt: row.uploaded_at
    }
    const clientAssets = assetsByClient.get(row.client_id) ?? []
    assetsByClient.set(row.client_id, [...clientAssets, asset])
  }))

  const clients = await Promise.all((clientsResult.data ?? []).map(async (row: ClientRow) => ({
    id: row.id,
    name: row.name,
    companyDescription: row.company_description,
    targetAudience: row.target_audience,
    brandColors: row.brand_colors,
    logoUrl: row.logo_storage_path
      ? await signedStorageUrl(row.logo_storage_path)
      : (row.logo_url ?? undefined),
    assets: assetsByClient.get(row.id) ?? []
  })))

  const contentList: GeneratedContent[] = (contentResult.data ?? []).map((row: ContentRow) => ({
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    type: row.type,
    title: row.title,
    content: row.content,
    meta: parseContentMeta(row.meta),
    status: row.status,
    providerUsed: row.provider_used,
    createdAt: row.created_at
  }))

  const analytics: CampaignAnalytics[] = (analyticsResult.data ?? []).map((row: CampaignRow) => ({
    id: row.id,
    clientId: row.client_id,
    campaignName: row.campaign_name,
    impressions: Number(row.impressions),
    clicks: Number(row.clicks),
    conversions: Number(row.conversions),
    spend: Number(row.spend),
    ctr: Number(row.ctr),
    conversionRate: Number(row.conversion_rate),
    status: row.status,
    createdAt: row.created_at
  }))

  return {
    clients,
    activeClientId: clients[0]?.id ?? null,
    workspaces,
    activeWorkspaceId: workspaceId,
    activeRole: selectedWorkspace.roleKey,
    brandProfile: profileResult.data ? mapBrandProfile(profileResult.data) : null,
    providers: parseProviders(settingsResult.data?.providers),
    contentList,
    analytics,
    currentUser: user
  }
}

function mapAsset(row: AssetRow, url: string): BrandAsset {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    url,
    storagePath: row.storage_path ?? undefined,
    uploadedAt: row.uploaded_at
  }
}

function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    companyDescription: row.company_description,
    targetAudience: row.target_audience,
    brandColors: row.brand_colors,
    logoUrl: row.logo_url ?? undefined,
    assets: []
  }
}

function mapContent(row: ContentRow): GeneratedContent {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    type: row.type,
    title: row.title,
    content: row.content,
    meta: parseContentMeta(row.meta),
    status: row.status,
    providerUsed: row.provider_used,
    createdAt: row.created_at
  }
}

function mapCampaign(row: CampaignRow): CampaignAnalytics {
  return {
    id: row.id,
    clientId: row.client_id,
    campaignName: row.campaign_name,
    impressions: Number(row.impressions),
    clicks: Number(row.clicks),
    conversions: Number(row.conversions),
    spend: Number(row.spend),
    ctr: Number(row.ctr),
    conversionRate: Number(row.conversion_rate),
    status: row.status,
    createdAt: row.created_at
  }
}

function mapBrandProfile(row: BrandProfileRow): BrandProfile {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    industry: row.industry,
    websiteUrl: row.website_url ?? "",
    companyDescription: row.company_description,
    targetAudience: row.target_audience,
    brandVoice: row.brand_voice,
    brandColors: row.brand_colors
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [state, setState] = useState<AppState>(EMPTY_STATE)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured())
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const loadWorkspace = useCallback(async (
    user: AgencyUser | null,
    showLoading = true,
    preferredWorkspaceId?: string
  ): Promise<WorkspaceLoadResult> => {
    if (!user) {
      setState(EMPTY_STATE)
      setConnectionError(null)
      setIsLoading(false)
      return { hasWorkspace: false, error: null }
    }

    if (showLoading) setIsLoading(true)
    try {
      const workspace = await readWorkspace(user, preferredWorkspaceId)
      setState((previous) => ({
        ...workspace,
        activeClientId: previous.activeClientId &&
          workspace.clients.some((client) => client.id === previous.activeClientId)
          ? previous.activeClientId
          : workspace.activeClientId
      }))
      setConnectionError(null)
      if (showLoading) setIsLoading(false)
      return { hasWorkspace: Boolean(workspace.activeWorkspaceId), error: null }
    } catch (error) {
      const message = errorText(error)
      setState((previous) => ({ ...previous, currentUser: user }))
      setConnectionError(message)
      if (showLoading) setIsLoading(false)
      return { hasWorkspace: false, error: message }
    }
  }, [])

  useEffect(() => {
    if (!supabase) return

    let active = true
    const applyUser = async (user: User | null) => {
      if (!active) return
      await loadWorkspace(user ? userFromAuth(user) : null)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void applyUser(session?.user ?? null)
      }, 0)
    })

    void supabase.auth.getUser()
      .then(({ data, error }) => {
        if (error) throw error
        return applyUser(data.user)
      })
      .catch((error: unknown) => {
        if (!active) return
        setConnectionError(errorText(error))
        setIsLoading(false)
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase, loadWorkspace])

  const userId = state.currentUser?.id
  const userEmail = state.currentUser?.email
  const userName = state.currentUser?.name
  const activeWorkspaceId = state.activeWorkspaceId

  useEffect(() => {
    if (!supabase || !userId || !userEmail || !userName || !activeWorkspaceId) return

    const user = { id: userId, email: userEmail, name: userName }
    const reload = () => {
      void loadWorkspace(user, false, activeWorkspaceId)
    }
    const channel = supabase
      .channel("agency-workspace-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients", filter: `workspace_id=eq.${activeWorkspaceId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "brand_assets", filter: `workspace_id=eq.${activeWorkspaceId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "generated_content", filter: `workspace_id=eq.${activeWorkspaceId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "campaign_analytics", filter: `workspace_id=eq.${activeWorkspaceId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "brand_profiles", filter: `workspace_id=eq.${activeWorkspaceId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_settings", filter: `workspace_id=eq.${activeWorkspaceId}` }, reload)
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionError("Live workspace updates disconnected. Refresh the page to reconnect.")
        }
      })
    const signedUrlRefresh = window.setInterval(reload, 30 * 60 * 1000)

    return () => {
      window.clearInterval(signedUrlRefresh)
      void supabase.removeChannel(channel)
    }
  }, [supabase, userId, userEmail, userName, activeWorkspaceId, loadWorkspace])

  const signUp = async (name: string, email: string, password: string) => {
    const client = getRequiredClient()
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
      }
    })
    if (error) throw error
    if (!data.user) throw new Error("Supabase did not return a registered user.")
    if (data.session) {
      const workspaceResult = await loadWorkspace(userFromAuth(data.user))
      if (workspaceResult.error) throw new Error(workspaceResult.error)
    }
    return !data.session
  }

  const login = async (email: string, password: string) => {
    const client = getRequiredClient()
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.user) throw new Error("Supabase did not return an authenticated user.")

    const workspaceResult = await loadWorkspace(userFromAuth(data.user))
    if (workspaceResult.error) {
      const { error: signOutError } = await client.auth.signOut()
      setState(EMPTY_STATE)
      setConnectionError(workspaceResult.error)
      if (signOutError) {
        throw new Error(`${workspaceResult.error} Sign-out also failed: ${signOutError.message}`)
      }
      throw new Error(workspaceResult.error)
    }
    return !workspaceResult.hasWorkspace
  }

  const signInWithGoogle = async () => {
    const client = getRequiredClient()
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` }
    })
    if (error) throw error
  }

  const logout = async () => {
    const client = getRequiredClient()
    const { error } = await client.auth.signOut()
    if (error) throw error
    setState(EMPTY_STATE)
  }

  const createOrganization = async (name: string, workspaceName: string) => {
    const client = getRequiredClient()
    const { data, error } = await client.rpc("create_organization", {
      p_organization_name: name,
      p_workspace_name: workspaceName
    })
    if (error) throw error
    const workspaceId = data?.[0]?.workspace_id
    if (!workspaceId || !state.currentUser) {
      throw new Error("The organization was created, but its workspace could not be loaded.")
    }
    const workspaceResult = await loadWorkspace(state.currentUser, true, workspaceId)
    if (workspaceResult.error) throw new Error(workspaceResult.error)
    if (!workspaceResult.hasWorkspace) throw new Error("The new workspace could not be loaded.")
  }

  const createWorkspace = async (organizationId: string, name: string, timezone: string) => {
    const client = getRequiredClient()
    const { data: workspaceId, error } = await client.rpc("create_workspace", {
      p_organization_id: organizationId,
      p_workspace_name: name,
      p_timezone: timezone
    })
    if (error) throw error
    if (!state.currentUser) throw new Error("Sign in before creating a workspace.")
    const workspaceResult = await loadWorkspace(state.currentUser, true, workspaceId)
    if (workspaceResult.error) throw new Error(workspaceResult.error)
    if (!workspaceResult.hasWorkspace) throw new Error("The new workspace could not be loaded.")
  }

  const inviteWorkspaceMember = async (email: string, roleKey: string) => {
    const response = await fetch("/api/workspace-invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: state.activeWorkspaceId, email, roleKey })
    })
    const result = await response.json() as { message?: string; error?: string }
    if (!response.ok) throw new Error(result.error ?? "Unable to send the workspace invitation.")
    if (!result.message) throw new Error("The invitation endpoint returned an invalid response.")
    return result.message
  }

  const switchWorkspace = async (workspaceId: string) => {
    if (!state.currentUser) throw new Error("Sign in before switching workspaces.")
    const workspaceResult = await loadWorkspace(state.currentUser, true, workspaceId)
    if (workspaceResult.error) throw new Error(workspaceResult.error)
    if (!workspaceResult.hasWorkspace) throw new Error("The selected workspace could not be loaded.")
  }

  const updateBrandProfile = async (profile: Omit<BrandProfile, "id" | "workspaceId">) => {
    const client = getRequiredClient()
    const workspaceId = state.activeWorkspaceId
    if (!workspaceId) throw new Error("Create or select a workspace before saving a brand profile.")

    const payload = {
      workspace_id: workspaceId,
      name: profile.name.trim(),
      industry: profile.industry.trim(),
      website_url: profile.websiteUrl.trim() || null,
      company_description: profile.companyDescription.trim(),
      target_audience: profile.targetAudience.trim(),
      brand_voice: profile.brandVoice.trim(),
      brand_colors: profile.brandColors
    }
    const query = state.brandProfile
      ? client.from("brand_profiles").update(payload).eq("id", state.brandProfile.id)
      : client.from("brand_profiles").insert(payload)
    const { data, error } = await query.select("*").single()
    if (error) throw error
    setState((previous) => ({ ...previous, brandProfile: mapBrandProfile(data) }))
  }

  const addClient = async (
    name: string,
    companyDescription: string,
    targetAudience: string,
    brandColors: string[]
  ) => {
    const client = getRequiredClient()
    const workspaceId = state.activeWorkspaceId
    if (!workspaceId) throw new Error("Select a workspace before adding a client.")
    const { data, error } = await client
      .from("clients")
      .insert({
        workspace_id: workspaceId,
        name,
        company_description: companyDescription,
        target_audience: targetAudience,
        brand_colors: brandColors
      })
      .select("*")
      .single()
    if (error) throw error

    const newClient = mapClient(data)
    setState((previous) => ({
      ...previous,
      clients: [newClient, ...previous.clients],
      activeClientId: newClient.id
    }))
    return newClient
  }

  const addBrandAsset = async (
    clientId: string,
    name: string,
    type: BrandAsset["type"],
    url: string
  ) => {
    const client = getRequiredClient()
    const workspaceId = state.activeWorkspaceId
    if (!workspaceId) throw new Error("Select a workspace before adding a brand asset.")
    const { data, error } = await client
      .from("brand_assets")
      .insert({ workspace_id: workspaceId, client_id: clientId, name, type, url })
      .select("*")
      .single()
    if (error) throw error

    if (type === "logo") {
      const { error: logoError } = await client
        .from("clients")
        .update({ logo_url: url, logo_storage_path: null })
        .eq("id", clientId)
        .eq("workspace_id", workspaceId)
      if (logoError) throw logoError
    }

    const asset = mapAsset(data, url)
    setState((previous) => ({
      ...previous,
      clients: previous.clients.map((item) => item.id === clientId
        ? {
            ...item,
            assets: [asset, ...item.assets],
            logoUrl: type === "logo" ? url : item.logoUrl
          }
        : item)
    }))
  }

  const uploadBrandAsset = async (
    clientId: string,
    name: string,
    type: BrandAsset["type"],
    file: File
  ) => {
    const client = getRequiredClient()
    const user = state.currentUser
    if (!user) throw new Error("Sign in before uploading a brand asset.")
    const workspaceId = state.activeWorkspaceId
    if (!workspaceId) throw new Error("Select a workspace before uploading a brand asset.")

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
    const storagePath = `${workspaceId}/${user.id}/${crypto.randomUUID()}-${safeFileName}`
    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false })
    if (uploadError) throw uploadError

    const { data, error } = await client
      .from("brand_assets")
      .insert({ workspace_id: workspaceId, client_id: clientId, name, type, storage_path: storagePath })
      .select("*")
      .single()
    if (error) {
      const { error: cleanupError } = await client.storage.from(STORAGE_BUCKET).remove([storagePath])
      if (cleanupError) {
        throw new Error(`${error.message} The uploaded file also needs cleanup: ${cleanupError.message}`)
      }
      throw error
    }

    if (type === "logo") {
      const { error: logoError } = await client
        .from("clients")
        .update({ logo_url: null, logo_storage_path: storagePath })
        .eq("id", clientId)
        .eq("workspace_id", workspaceId)
      if (logoError) throw logoError
    }

    const url = await signedStorageUrl(storagePath)
    const asset = mapAsset(data, url)
    setState((previous) => ({
      ...previous,
      clients: previous.clients.map((item) => item.id === clientId
        ? {
            ...item,
            assets: [asset, ...item.assets],
            logoUrl: type === "logo" ? url : item.logoUrl
          }
        : item)
    }))
  }

  const deleteBrandAsset = async (clientId: string, assetId: string) => {
    const client = getRequiredClient()
    const workspaceId = state.activeWorkspaceId
    if (!workspaceId) throw new Error("Select a workspace before deleting a brand asset.")
    const storedClient = state.clients.find((item) => item.id === clientId)
    if (!storedClient) throw new Error("The selected client was not found in this workspace.")
    const assetToDelete = storedClient?.assets.find((asset) => asset.id === assetId)
    if (!assetToDelete) throw new Error("The selected asset was not found in this workspace.")

    if (assetToDelete.type === "logo") {
      const replacementLogo = storedClient.assets.find(
        (asset) => asset.id !== assetId && asset.type === "logo"
      )
      const { error: logoError } = await client
        .from("clients")
        .update({
          logo_url: replacementLogo?.storagePath ? null : (replacementLogo?.url ?? null),
          logo_storage_path: replacementLogo?.storagePath ?? null
        })
        .eq("id", clientId)
        .eq("workspace_id", workspaceId)
      if (logoError) throw logoError
    }

    const { data, error } = await client
      .from("brand_assets")
      .delete()
      .eq("id", assetId)
      .eq("client_id", clientId)
      .eq("workspace_id", workspaceId)
      .select("storage_path")
      .single()
    if (error) throw error

    setState((previous) => ({
      ...previous,
      clients: previous.clients.map((item) => item.id === clientId
        ? {
            ...item,
            assets: item.assets.filter((asset) => asset.id !== assetId),
            logoUrl: assetToDelete.type === "logo"
              ? storedClient?.assets.find((asset) => asset.id !== assetId && asset.type === "logo")?.url
              : item.logoUrl
          }
        : item)
    }))

    if (data.storage_path) {
      const { error: storageError } = await client.storage
        .from(STORAGE_BUCKET)
        .remove([data.storage_path])
      if (storageError) {
        throw new Error(`Asset metadata was deleted, but its storage file could not be removed: ${storageError.message}`)
      }
    }
  }

  const setActiveClient = (id: string | null) => {
    setState((previous) => ({ ...previous, activeClientId: id }))
  }

  const updateProviders = async (providers: AIProviderState) => {
    const client = getRequiredClient()
    const workspaceId = state.activeWorkspaceId
    if (!workspaceId) throw new Error("Select a workspace before updating settings.")
    const { error } = await client.from("workspace_settings").upsert({
      workspace_id: workspaceId,
      providers: providersToJson(providers),
      updated_by: state.currentUser?.id ?? null,
      updated_at: new Date().toISOString()
    })
    if (error) throw error
    setState((previous) => ({ ...previous, providers }))
  }

  const triggerFailover = async (type: "text" | "image" | "video") => {
    const chain = state.providers[type]
    const currentIndex = chain.sequence.indexOf(chain.active)
    const updatedLimits = { ...chain.limitsReached, [chain.active]: true }
    let nextActive = chain.active

    for (let offset = 1; offset <= chain.sequence.length; offset++) {
      const candidate = chain.sequence[(currentIndex + offset) % chain.sequence.length]
      if (!updatedLimits[candidate]) {
        nextActive = candidate
        break
      }
    }

    const providers = {
      ...state.providers,
      [type]: { ...chain, active: nextActive, limitsReached: updatedLimits }
    }
    await updateProviders(providers)
    return nextActive
  }

  const resetProviderLimits = async (type: "text" | "image" | "video") => {
    const chain = state.providers[type]
    const providers = {
      ...state.providers,
      [type]: {
        ...chain,
        active: chain.sequence[0],
        limitsReached: Object.fromEntries(chain.sequence.map((provider) => [provider, false]))
      }
    }
    await updateProviders(providers)
  }

  const toggleProviderLimit = async (
    type: "text" | "image" | "video",
    provider: string,
    reached: boolean
  ) => {
    const chain = state.providers[type]
    const limitsReached = { ...chain.limitsReached, [provider]: reached }
    let active = chain.active

    if (provider === active && reached) {
      const currentIndex = chain.sequence.indexOf(active)
      for (let offset = 1; offset <= chain.sequence.length; offset++) {
        const candidate = chain.sequence[(currentIndex + offset) % chain.sequence.length]
        if (!limitsReached[candidate]) {
          active = candidate
          break
        }
      }
    }

    await updateProviders({
      ...state.providers,
      [type]: { ...chain, active, limitsReached }
    })
  }

  const generateAIContent = async (
    clientId: string,
    type: GeneratedContent["type"],
    prompt: string,
    additionalMeta?: GeneratedContentMeta
  ) => {
    const client = getRequiredClient()
    const workspaceId = state.activeWorkspaceId
    if (!workspaceId) throw new Error("Select a workspace before generating content.")
    const activeClient = state.clients.find((item) => item.id === clientId)
    if (!activeClient) throw new Error("The selected client no longer exists.")
    const providerUsed = "Template demo (AI API not connected)"
    let generatedText = ""
    let generatedMeta: GeneratedContentMeta = additionalMeta ?? {}

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
      generatedText = `Ready to boost results for ${activeClient.name}? ${prompt}. This draft is generated from the current template and needs review before publishing. #Marketing #BrandSpireSocialAI`
    } else if (type === "hashtag") {
      generatedText = `#${activeClient.name.replace(/\s+/g, "")} #DigitalMarketing #BrandSpireSocialAI #GrowBrand`
    } else if (type === "ad_script") {
      generatedText = `[SCENE 1: Visual of ${activeClient.name} primary assets]
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
        colorHex: activeClient.brandColors[0] || "#FF4500",
        status: "rendered",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4"
      }
    }

    const { data, error } = await client.from("generated_content").insert({
      workspace_id: workspaceId,
      client_id: clientId,
      client_name: activeClient.name,
      type,
      title: `${type.toUpperCase()} - ${prompt.substring(0, 20)}...`,
      content: generatedText,
      meta: {
        imageUrl: generatedMeta.imageUrl,
        overlayText: generatedMeta.overlayText,
        template: generatedMeta.template,
        textVariables: generatedMeta.textVariables,
        colorHex: generatedMeta.colorHex,
        videoUrl: generatedMeta.videoUrl,
        status: generatedMeta.status
      },
      status: "draft",
      provider_used: providerUsed
    }).select("*").single()
    if (error) throw error

    const result = mapContent(data)
    setState((previous) => ({ ...previous, contentList: [result, ...previous.contentList] }))
    return result
  }

  const updateContentStatus = async (id: string, status: GeneratedContent["status"]) => {
    const client = getRequiredClient()
    const workspaceId = state.activeWorkspaceId
    if (!workspaceId) throw new Error("Select a workspace before updating content.")
    const { error } = await client.from("generated_content")
      .update({ status })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
    if (error) throw error
    setState((previous) => ({
      ...previous,
      contentList: previous.contentList.map((item) => item.id === id ? { ...item, status } : item)
    }))
  }

  const addCampaign = async (
    campaign: Omit<CampaignAnalytics, "id" | "ctr" | "conversionRate" | "createdAt">
  ) => {
    const client = getRequiredClient()
    const workspaceId = state.activeWorkspaceId
    if (!workspaceId) throw new Error("Select a workspace before creating campaign metrics.")
    const ctr = campaign.impressions > 0
      ? Number(((campaign.clicks / campaign.impressions) * 100).toFixed(2))
      : 0
    const conversionRate = campaign.clicks > 0
      ? Number(((campaign.conversions / campaign.clicks) * 100).toFixed(2))
      : 0
    const { data, error } = await client.from("campaign_analytics").insert({
      workspace_id: workspaceId,
      client_id: campaign.clientId,
      campaign_name: campaign.campaignName,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      spend: campaign.spend,
      ctr,
      conversion_rate: conversionRate,
      status: campaign.status
    }).select("*").single()
    if (error) throw error

    const result = mapCampaign(data)
    setState((previous) => ({ ...previous, analytics: [result, ...previous.analytics] }))
  }

  return (
    <AppStateContext.Provider
      value={{
        state,
        isLoading,
        isConfigured: isSupabaseConfigured(),
        connectionError,
        signUp,
        login,
        signInWithGoogle,
        logout,
        createOrganization,
        createWorkspace,
        inviteWorkspaceMember,
        switchWorkspace,
        updateBrandProfile,
        addClient,
        addBrandAsset,
        uploadBrandAsset,
        deleteBrandAsset,
        setActiveClient,
        triggerFailover,
        resetProviderLimits,
        toggleProviderLimit,
        generateAIContent,
        updateContentStatus,
        addCampaign
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
