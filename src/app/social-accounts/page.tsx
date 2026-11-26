"use client"

import { useCallback, useEffect, useState } from "react"
import { missingPublishingGrants } from "@/lib/social/meta-oauth"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState } from "@/context/AppStateContext"

type Account={id:string;platform:string;external_id:string;account_name:string;authorized_at:string;granted_scopes:string[]}
type Candidate={flowId:string;platform:string;externalId:string;name:string;pageId:string;scopes:string[]}
type AccountData={accounts:Account[];candidates:Candidate[];configured:boolean}
const callbackMessages:Record<string,string>={ready:"Meta authorization returned. Select the accounts you want to save below.",empty:"No eligible Pages or linked professional accounts were found.",empty_no_pages:"Meta returned no Pages. Check Page access and the assets selected during authorization.",empty_no_tokens:"Meta returned Page records but none had the required name, ID and Page access token. Check your Page permissions.",empty_business_grant:"No Pages returned and business_management was not granted. Check the configuration and business portfolio access.",empty_targets:"No Pages returned and Meta did not report matching explicit Page grants for fallback. Check Page access and select the Page during authorization.",empty_target_lookup:"Direct lookup of explicitly granted Pages did not return an eligible Page token. Check Page tasks and portfolio access.",empty_debug_unavailable:"No Pages returned; optional token diagnostics could not verify granular Page grants. Check Meta settings and the server discovery summary.",cancelled:"Authorization was cancelled or denied.",invalid:"The authorization session was invalid or expired. Start again.",failed:"Meta connection could not be completed. Check your app configuration, permissions and account access, then retry."}
async function api<T>(path:string, init?:RequestInit):Promise<T> {
  const res=await fetch(path,{...init,cache:"no-store"})
  const data=await res.json()
  if(!res.ok) throw new Error(data.error || "Request failed.")
  return data as T
}
function GrantStatus({platform,scopes}:{platform:string;scopes:string[]}) {
  const missing=missingPublishingGrants(platform,scopes)
  return <p className="break-words text-xs text-muted-foreground">{missing===null?"Unsupported platform":missing.length?`Read-only / missing user grants: ${missing.join(", ")}`:"Required user grants reported — account capability not verified"}</p>
}
function AccountsPanel({workspaceId,clientId,clientName}:{workspaceId:string;clientId:string;clientName:string}) {
  const [data,setData]=useState<AccountData|null>(null)
  const [error,setError]=useState("")
  const [message,setMessage]=useState("")
  const [busy,setBusy]=useState(false)
  const load=useCallback(()=>api<AccountData>(`/api/social/accounts?${new URLSearchParams({workspaceId,clientId})}`),[workspaceId,clientId])
  useEffect(()=>{
    let active=true
    const status=new URLSearchParams(window.location.search).get("meta")
    load().then(result=>{if(active){setData(result);if(status){setMessage(callbackMessages[status] || "Connection status unknown.");/* Keep only the non-sensitive status URL visible across reloads. */}}}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Unable to load accounts.")})
    return ()=>{active=false}
  },[load])
  async function action(path:string,fields:Record<string,string>) {
    setBusy(true);setError("");setMessage("");window.history.replaceState(null,"",window.location.pathname)
    try {
      const result=await api<{url?:string;message?:string}>(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({workspaceId,clientId,...fields})})
      if(result.url){window.location.assign(result.url);return}
      setMessage(result.message||"");setData(await load())
    }catch(e){setError(e instanceof Error?e.message:"Connection request failed.")}
    finally{setBusy(false)}
  }
  return <div className="space-y-5">
    <p className="text-sm text-muted-foreground">Selected client: <strong className="text-foreground">{clientName}</strong>. Connections belong to this client and cannot be moved to another client automatically.</p>
    {error && <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-500">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-border p-3 text-sm">{message}</p>}
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Connect Facebook &amp; Instagram</h2>
      <p className="text-sm text-muted-foreground">Authorize your Facebook Pages and discover linked Instagram professional accounts. This phase records granted user permissions. It does not verify account-level publishing capability, publish posts, or monitor ongoing token health.</p>
      {data && !data.configured && <p className="text-sm text-amber-600">Meta server configuration is missing. Check the Phase 2B setup guide and META_LOGIN_CONFIG_ID.</p>}
      <button type="button" disabled={busy || !data?.configured} onClick={()=>void action("/api/social/meta/start",{})} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Connect with Meta</button>
      <button type="button" disabled={busy} onClick={()=>{setError("");load().then(setData).catch(e=>setError(e instanceof Error?e.message:"Unable to refresh."))}} className="ml-2 rounded-md border border-border px-4 py-2 text-sm">Refresh</button>
    </section>
    {!!data?.candidates.length && <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Discovered accounts — select individually</h2>
      <p className="text-sm text-muted-foreground">Choose only accounts belonging to {clientName}. Discovery expires after 10 minutes.</p>
      {data.candidates.map(c=><div key={`${c.platform}:${c.externalId}`} className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"><div><p className="font-medium">{c.name}</p><p className="text-xs capitalize text-muted-foreground">{c.platform} · ID {c.externalId}</p><GrantStatus platform={c.platform} scopes={c.scopes}/></div><button type="button" disabled={busy} className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50" onClick={()=>void action("/api/social/accounts",{action:"connect",flowId:c.flowId,platform:c.platform,externalId:c.externalId})}>{data.accounts.some(a=>a.platform===c.platform&&a.external_id===c.externalId)?"Update authorization":"Save connection"}</button></div>)}
      <button type="button" disabled={busy} className="rounded-md border border-border px-3 py-2 text-sm" onClick={()=>void action("/api/social/accounts",{action:"finish"})}>Finish selection &amp; clear discovery data</button>
    </section>}
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Saved connections</h2>
      {!data && !error && <p className="text-sm text-muted-foreground">Loading...</p>}
      {data?.accounts.length===0 && <p className="text-sm text-muted-foreground">No saved accounts for this client.</p>}
      {data?.accounts.map(a=><div key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"><div className="min-w-0"><p className="font-medium">{a.account_name}</p><p className="text-xs capitalize text-muted-foreground">{a.platform} · ID {a.external_id}</p><p className="text-xs text-muted-foreground">Authorization saved: {new Date(a.authorized_at).toLocaleString()} · Publishing disabled</p><p className="break-words text-xs text-muted-foreground">User grants: {a.granted_scopes.join(", ")}</p><GrantStatus platform={a.platform} scopes={a.granted_scopes}/></div><button type="button" disabled={busy} className="rounded-md border border-red-500/40 px-3 py-2 text-sm text-red-500" onClick={()=>{if(window.confirm(`Remove the local connection for ${a.account_name}? This does not revoke access at Meta.`))void action("/api/social/accounts",{action:"disconnect",id:a.id})}}>Disconnect</button></div>)}
    </section>
  </div>
}
export default function SocialAccountsPage(){
  const {state}=useAppState()
  const client=state.clients.find(c=>c.id===state.activeClientId)
  const allowed=["workspace_owner","workspace_admin"].includes(state.activeRole||"")
  return <DashboardLayout><div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-8"><div><h1 className="text-2xl font-bold">Social Accounts</h1><p className="mt-1 text-sm text-muted-foreground">Official Meta account authorization · Phase 2C discovery pilot</p></div>{!allowed?<p>Only workspace owners and administrators can manage social connections.</p>:!client || !state.activeWorkspaceId?<p>Select a Focus Client in the sidebar first. Create a client record if needed.</p>:<AccountsPanel key={`${state.activeWorkspaceId}:${client.id}`} workspaceId={state.activeWorkspaceId} clientId={client.id} clientName={client.name}/>}</div></DashboardLayout>
}
