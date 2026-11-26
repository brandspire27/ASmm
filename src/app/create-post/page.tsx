"use client"
import { useRef, useState } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import ManualPostPreview from "@/components/ManualPostPreview"
import { useAppState, type Client } from "@/context/AppStateContext"
import { platforms, platformLabels, formats, captionLimits, count, initialVariant, assetFormat, validateVariant, type Platform, type Variant, type Format } from "@/lib/social/composer"

const control="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
const secondary="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
function Composer({client,workspaceId}:{client:Client;workspaceId:string}) {
  const {state,saveManualPosts}=useAppState()
  const [variants,setVariants]=useState<Variant[]>([initialVariant("facebook")])
  const [active,setActive]=useState<Platform>("facebook")
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState("")
  const [error,setError]=useState("")
  const [uncertain,setUncertain]=useState(false)
  const batch=useRef<string|null>(null)
  const lock=useRef(false)
  const v=variants.find(item=>item.platform===active) ?? variants[0]
  const eligible=client.assets.filter(a=>a.storagePath?.startsWith(`${workspaceId}/`) && assetFormat(a.storagePath)===v.format)
  const drafts=state.contentList.filter(c=>c.clientId===client.id&&c.type==="manual_post")
  function changed(next:Variant[]) {batch.current=null;setVariants(next);setError("");setMessage("")}
  function update(fields:Partial<Variant>) {changed(variants.map(item=>item.platform===v.platform?{...item,...fields}:item))}
  function toggle(p:Platform) {
    if(variants.some(x=>x.platform===p)) {
      const next=variants.filter(x=>x.platform!==p);if(!next.length)return;changed(next);if(active===p)setActive(next[0].platform)
    } else {changed([...variants,initialVariant(p)]);setActive(p)}
  }
  async function save() {
    if(lock.current)return
    for(const item of variants) {
      const problem=validateVariant(item)
      if(problem){setError(`${platformLabels[item.platform]}: ${problem}`);setActive(item.platform);return}
      if(item.format!=="text"&&!client.assets.some(a=>a.id===item.assetId&&a.storagePath?.startsWith(`${workspaceId}/`)&&assetFormat(a.storagePath)===item.format)){setError(`${platformLabels[item.platform]}: media is no longer available.`);setActive(item.platform);return}
    }
    lock.current=true;setBusy(true);setError("");setMessage("")
    try {
      batch.current ??= crypto.randomUUID()
      const saved=await saveManualPosts(client.id,batch.current,variants.map(x=>({...x,title:x.title.trim(),caption:x.caption.trim()})))
      setMessage(`${saved.length} saved variants confirmed. Check Approvals for their current editorial status. Nothing was scheduled or published.`)
      setUncertain(false);batch.current=null;setVariants([initialVariant("facebook")]);setActive("facebook")
    } catch(e) {setError((e instanceof Error?e.message:"Save was not confirmed.")+" Retry with the same inputs to avoid duplicate drafts. If you abandon this attempt, check Approvals first.");setUncertain(true)}
    finally {lock.current=false;setBusy(false)}
  }
  return <div className="space-y-6">
    <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm"><strong>{client.name}</strong> · Preparing drafts only. Account connection, scheduling and publishing are not required for this step.</div>
    {error&&<p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
    {message&&<p role="status" className="rounded-lg border border-emerald-500/40 p-3 text-sm">{message}</p>}
    <fieldset disabled={busy||uncertain} className="space-y-5 disabled:opacity-70">
      <legend className="mb-2 text-sm font-semibold">1. Choose target platforms</legend>
      <div className="flex flex-wrap gap-2">{platforms.map(p=><label key={p} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><input type="checkbox" checked={variants.some(x=>x.platform===p)} onChange={()=>toggle(p)} disabled={variants.length===1&&variants[0].platform===p}/>{platformLabels[p]}</label>)}</div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold">2. Customize each variant</h2>
          <div className="flex flex-wrap gap-2">{variants.map(item=><button type="button" key={item.platform} aria-pressed={v.platform===item.platform} onClick={()=>setActive(item.platform)} className={v.platform===item.platform?"rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground":secondary}>{platformLabels[item.platform]}</button>)}</div>
          <label className="block space-y-1 text-sm">Format<select className={control} value={v.format} onChange={e=>update({format:e.target.value as Format,assetId:""})}>{formats[v.platform].map(f=><option key={f} value={f}>{f}</option>)}</select></label>
          <label className="block space-y-1 text-sm">{v.platform==="youtube"?"Video title":"Internal post title"}<input className={control} value={v.title} onChange={e=>update({title:e.target.value})} placeholder="Product launch"/><span className="text-xs text-muted-foreground">{count(v.title)}/100</span></label>
          <label className="block space-y-1 text-sm">{v.platform==="youtube"?"Description":"Caption / post text"}<textarea className={`${control} min-h-40`} value={v.caption} onChange={e=>update({caption:e.target.value})} placeholder="Write your content, hashtags and call to action..."/><span className="text-xs text-muted-foreground">{count(v.caption)}/{captionLimits[v.platform]} · internal composer limit</span></label>
          {v.format!=="text"&&<div className="space-y-2"><label className="block space-y-1 text-sm">Uploaded media<select value={v.assetId} className={control} onChange={e=>update({assetId:e.target.value})}><option value="">Select a file</option>{eligible.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><p className="text-xs text-muted-foreground">Only uploaded files belonging to this client are eligible. Upload JPEG, PNG, WebP or MP4 in <Link className="underline" href="/assets">Brand Assets</Link>, then return here. Save other work first; unsaved input is not persisted.</p></div>}
          {variants.length>1&&<button type="button" className={secondary} onClick={()=>changed(variants.map(x=>x.platform===v.platform?x:{...x,title:v.title,caption:v.caption}))}>Copy title & text to other selected platforms</button>}
        </section>
        <section className="min-w-0 space-y-3"><h2 className="font-semibold">3. Preview</h2><ManualPostPreview platform={v.platform} format={v.format} title={v.title} caption={v.caption} asset={eligible.find(a=>a.id===v.assetId)}/></section>
      </div>
    </fieldset>
    <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={()=>void save()} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy?"Saving…":uncertain?"Retry same draft batch":`Save ${variants.length} draft${variants.length===1?"":"s"} for review`}</button>{uncertain&&<button type="button" className={secondary} disabled={busy} onClick={()=>{if(window.confirm("Check Approvals for any existing draft batch before saving again. Unlock editing?")){setUncertain(false);setError("");batch.current=null}}}>Unlock editing</button>}<Link href="/approval" className="text-sm underline">Open Approvals</Link></div>
    <section className="space-y-3 border-t border-border pt-5"><h2 className="font-semibold">Saved manual posts ({drafts.length})</h2><p className="text-xs text-muted-foreground">Saved review snapshots cannot be edited in place. Copy a saved item to start a new draft. Approving a draft does not publish it.</p>{drafts.length===0&&<p className="text-sm text-muted-foreground">No manual posts yet.</p>}{drafts.map(d=><div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"><div className="min-w-0"><p className="break-words text-sm font-medium">{d.title}</p><p className="text-xs text-muted-foreground">{platformLabels[d.meta?.platform as Platform]??d.meta?.platform} · {d.status} · {new Date(d.createdAt).toLocaleString()}</p></div><button type="button" className={secondary} disabled={busy||uncertain} onClick={()=>{const p=d.meta?.platform as Platform;const f=d.meta?.format as Format;if(!platforms.includes(p)||!formats[p].includes(f))return;if(variants.some(x=>x.title||x.caption)&&!window.confirm("Replace unsaved composer inputs with a copy?"))return;changed([{platform:p,format:f,title:d.title,caption:d.content,assetId:d.meta?.assetId??""}]);setActive(p)}}>Copy as new draft</button></div>)}</section>
  </div>
}
export default function CreatePostPage(){
 const {state}=useAppState();const client=state.clients.find(c=>c.id===state.activeClientId)
 const allowed=["workspace_owner","workspace_admin","social_media_manager","content_creator"].includes(state.activeRole??"")
 return <DashboardLayout><div className="mx-auto max-w-6xl space-y-5"><header><h1 className="text-2xl font-bold">Create Post</h1><p className="text-sm text-muted-foreground">Manual multi-platform composer · no social API credentials required</p></header>{!allowed?<p>Content creation permission required.</p>:!client||!state.activeWorkspaceId?<p>Select a Focus Client in the sidebar first.</p>:<Composer key={`${state.currentUser?.id}:${state.activeWorkspaceId}:${client.id}`} client={client} workspaceId={state.activeWorkspaceId}/>}</div></DashboardLayout>
}
