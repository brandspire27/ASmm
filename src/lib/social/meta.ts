import "server-only"
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { z } from "zod"

export const scopeSchema = z.object({ workspaceId: z.string().uuid(), clientId: z.string().uuid() })
export type Scope = z.infer<typeof scopeSchema>
import { grantedMetaScopes } from "./meta-oauth"
import { pageCandidates, explicitPageTargets, uniqueCandidates, emptyStatus, type Candidate, type MetaPage, type TokenDebug, type DiscoveryStatus } from "./meta-discovery"
export type { Candidate } from "./meta-discovery"
export class SocialError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
export function config() {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const configurationId = process.env.META_LOGIN_CONFIG_ID || ""
  const version = process.env.META_GRAPH_API_VERSION || "v27.0"
  const base = process.env.SOCIAL_APP_URL
  const raw = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || ""
  if (!/^\d+$/.test(configurationId)) throw new SocialError("Set META_LOGIN_CONFIG_ID to your user-access-token configuration ID (Phase 2B).", 503)
  if (!appId || !appSecret || !base || !/^\d+$/.test(appId) || !/^v\d+\.\d+$/.test(version) || !/^[a-fA-F0-9]{64}$/.test(raw)) throw new SocialError("Meta connection is not configured on the server. See the Phase 2A setup guide.", 503)
  const url = new URL(base)
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new SocialError("SOCIAL_APP_URL must be an HTTPS origin (or http://localhost for development).", 503)
  return { appId, appSecret, configurationId, version, origin: url.origin, redirect: `${url.origin}/api/social/meta/callback`, key: Buffer.from(raw, "hex") }
}
export function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new SocialError("Server database access is not configured.", 503)
  // Deliberately separate from browser-facing generated Database types.
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
export function hash(value: string) { return createHash("sha256").update(value).digest("hex") }
export function nonce() { return randomBytes(32).toString("hex") }
export function seal(value: string, aad: string) {
  const iv = randomBytes(12)
  const c = createCipheriv("aes-256-gcm", config().key, iv)
  c.setAAD(Buffer.from(aad))
  const encrypted = Buffer.concat([c.update(value, "utf8"), c.final()])
  return ["v1", iv.toString("hex"), c.getAuthTag().toString("hex"), encrypted.toString("base64")].join(".")
}
export function unseal(value: string, aad: string) {
  const [v, iv, tag, data] = value.split(".")
  if (v !== "v1" || !iv || !tag || !data) throw new SocialError("Encrypted connection data is invalid.", 500)
  const d = createDecipheriv("aes-256-gcm", config().key, Buffer.from(iv,"hex"))
  d.setAAD(Buffer.from(aad)); d.setAuthTag(Buffer.from(tag,"hex"))
  return Buffer.concat([d.update(Buffer.from(data,"base64")),d.final()]).toString("utf8")
}
export function sameOrigin(req: Request) {
  if (req.headers.get("origin") !== config().origin) throw new SocialError("Invalid request origin.",403)
}
export async function signedIn() {
  const supabase = await createServerSupabaseClient()
  const {data:{user},error} = await supabase.auth.getUser()
  if (error || !user) throw new SocialError("Sign in to BrandSpire first.",401)
  return {supabase,user}
}
export async function authorize(scope: Scope) {
  const {supabase,user} = await signedIn()
  const {data:allowed,error} = await supabase.rpc("has_workspace_permission", {target_workspace_id:scope.workspaceId,required_permission:"workspace.manage_members"})
  if (error || !allowed) throw new SocialError("Workspace owner or administrator access is required.",403)
  const {data:client,error:clientError} = await supabase.from("clients").select("id").eq("workspace_id",scope.workspaceId).eq("id",scope.clientId).maybeSingle()
  if (clientError || !client) throw new SocialError("Client does not belong to this workspace or is inaccessible.",403)
  return user
}
export function reply(data: unknown,status=200) { return Response.json(data,{status,headers:{"Cache-Control":"no-store"}}) }
export function failure(error: unknown) { return error instanceof SocialError ? reply({error:error.message},error.status) : reply({error:"Social connection request failed. Check server configuration and try again."},500) }
export async function body(req: Request) { try { return await req.json() } catch { throw new SocialError("Invalid JSON request.") } }
export function scopeFrom(value: unknown) { const r=scopeSchema.safeParse(value); if(!r.success) throw new SocialError("Choose a workspace and client first."); return r.data }
export async function graph<T>(path: string, params: Record<string,string>, token?:string): Promise<T> {
  const url=new URL(`https://graph.facebook.com/${config().version}/${path}`)
  for (const [k,v] of Object.entries(params)) url.searchParams.set(k,v)
  const headers: Record<string,string> = {Accept:"application/json"}
  if(token) headers.Authorization=`Bearer ${token}`
  const res=await fetch(url,{headers,cache:"no-store",redirect:"error",signal:AbortSignal.timeout(12000)})
  const data=await res.json().catch(()=>null)
  if(!res.ok || !data || data.error) {
    const code=typeof data?.error?.code==="number"?data.error.code:null
    const subcode=typeof data?.error?.error_subcode==="number"?data.error.error_subcode:null
    const endpoint=path==="oauth/access_token"?"token exchange":path==="me/permissions"?"permission check":path==="me/accounts"?"account discovery":"graph request"
    console.warn("Meta API request rejected",{endpoint,httpStatus:res.status,code,subcode})
    throw new SocialError("Meta rejected the request. Check app configuration, granted permissions and account access.",502)
  }
  return data as T
}
export async function discover(code:string): Promise<{candidates:Candidate[];status:DiscoveryStatus}> {
  const c=config()
  const short=await graph<{access_token?:string}>("oauth/access_token",{client_id:c.appId,client_secret:c.appSecret,redirect_uri:c.redirect,code})
  if(!short.access_token) throw new SocialError("Meta did not return an access token.",502)
  const long=await graph<{access_token?:string}>("oauth/access_token",{grant_type:"fb_exchange_token",client_id:c.appId,client_secret:c.appSecret,fb_exchange_token:short.access_token})
  if(!long.access_token) throw new SocialError("Meta did not return an extended access token.",502)
  const token=long.access_token
  const perms=await graph<{data?:{permission:string;status:string}[]}>("me/permissions",{},token)
  const scopes=grantedMetaScopes(perms.data||[])
  if(!scopes.includes("pages_show_list") || !scopes.includes("pages_read_engagement")) {
    console.info("Meta discovery summary",{status:"missing_page_grants",grantedPermissions:scopes})
    throw new SocialError("Required Page permissions were not granted.",403)
  }
  let candidates:Candidate[]=[]
  let after:string|undefined
  let rows=0
  const fields=scopes.includes("instagram_basic")?"id,name,access_token,instagram_business_account{id,username}":"id,name,access_token"
  let finished=false
  for(let i=0;i<5;i++) {
    const params:Record<string,string>={fields,limit:"25"}; if(after) params.after=after
    const result=await graph<{data?:MetaPage[];paging?:{next?:string;cursors?:{after?:string}}}>("me/accounts",params,token)
    if(!Array.isArray(result.data)) throw new SocialError("Meta returned an invalid account list.",502)
    rows+=result.data.length
    for(const p of result.data) candidates.push(...pageCandidates(p,scopes))
    if(!result.paging?.next){finished=true;break}
    after=result.paging.cursors?.after
    if(!after) throw new SocialError("Meta account discovery returned an incomplete page list.",502)
  }
  if(!finished) throw new SocialError("Too many Pages for this pilot connection. Limit the Pages granted to this app and retry.",409)
  let debugAvailable=false, targetCount=0, lookupFailures=0
  // A portfolio-owned Page may be absent from /me/accounts. Only attempt a
  // direct lookup when the same token has explicit Page targets on both grants.
  // No business-wide enumeration or extra permissions are requested.
  if(!candidates.length && scopes.includes("business_management")) {
    try {
      const result=await graph<{data?:TokenDebug}>("debug_token",{input_token:token},`${c.appId}|${c.appSecret}`)
      const debug=result.data
      debugAvailable=debug?.is_valid===true && debug.app_id===c.appId && debug.type==="USER"
      const targets=debugAvailable && debug ? explicitPageTargets(debug,c.appId) : []
      targetCount=targets.length
      // Limit optional fallback to five explicit Pages and run in parallel.
      const outcomes=await Promise.allSettled(targets.slice(0,5).map(async id=>{
        const page=await graph<MetaPage>(id,{fields},token)
        return page.id===id ? pageCandidates(page,scopes) : []
      }))
      for(const outcome of outcomes) {
        if(outcome.status==="fulfilled")candidates.push(...outcome.value)
        else lookupFailures++
      }
    } catch {debugAvailable=false}
  }
  candidates=uniqueCandidates(candidates)
  const status=candidates.length?"ready":emptyStatus({rows,businessGrant:scopes.includes("business_management"),debugAvailable,targetCount})
  console.info("Meta discovery summary",{status,pageRows:rows,explicitPageTargets:targetCount,lookupFailures,facebookCandidates:candidates.filter(x=>x.platform==="facebook").length,instagramCandidates:candidates.filter(x=>x.platform==="instagram").length,grantedPermissions:scopes,debugAvailable})
  return {candidates,status}
}

export function flowAAD(id:string) {return `meta-flow:${id}`}
export function accountAAD(scope:Scope,platform:string,id:string) {return `meta-account:${scope.workspaceId}:${scope.clientId}:${platform}:${id}`}
