"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState, type GeneratedContent } from "@/context/AppStateContext"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { platformLabels, type Platform } from "@/lib/social/composer"
import { MAX_BATCH, deliveryKinds, localInput, toFutureUtc, spacedTimes, type DeliveryKind } from "@/lib/social/calendar"

type Plan = Database["public"]["Tables"]["post_schedule_plans"]["Row"]
type Selection = { time:string; kind:DeliveryKind; revision:number }
const field="rounded-md border border-border bg-background px-2 py-2 text-sm"
const button="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
const labelFor=(d:GeneratedContent)=>platformLabels[d.meta?.platform as Platform]??"Unknown platform"
function Planner({workspaceId,clientId,clientName,drafts}:{workspaceId:string;clientId:string;clientName:string;drafts:GeneratedContent[]}) {
 const [plans,setPlans]=useState<Plan[]>([])
 const [selected,setSelected]=useState<Record<string,Selection>>({})
 const [start,setStart]=useState("")
 const [interval,setInterval]=useState("60")
 const [search,setSearch]=useState("")
 const [filter,setFilter]=useState("unplanned")
 const [month,setMonth]=useState("")
 const [day,setDay]=useState("")
 const [timezone,setTimezone]=useState("")
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState("")
 const [message,setMessage]=useState("")
 const [loaded,setLoaded]=useState(false)
 const lock=useRef(false)
 const [clock,setClock]=useState<number|null>(null)
 const loadSequence=useRef({value:0})
 const load=useCallback(async()=>{
  const seq=++loadSequence.current.value
  setLoading(true);setLoaded(false)
  try{
   const db=createClient();if(!db)throw new Error("Supabase is not configured.")
   const rows:Plan[]=[]
   for(let offset=0;;offset+=500){
    const {data,error}=await db.from("post_schedule_plans").select("*").eq("workspace_id",workspaceId).eq("client_id",clientId).order("content_id").range(offset,offset+499)
    if(error)throw new Error(error.message)
    rows.push(...(data??[]));if((data??[]).length<500)break
   }
   if(seq===loadSequence.current.value){setPlans(rows);setLoaded(true)}
  }catch(e){if(seq===loadSequence.current.value)setError(e instanceof Error?e.message:"Unable to load plans.")}
  finally{if(seq===loadSequence.current.value)setLoading(false)}
 },[workspaceId,clientId])
 useEffect(()=>{
  const sequence=loadSequence.current
  const initial=window.setTimeout(()=>{
   const now=Date.now()
   setClock(now)
   setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
   const startTime=localInput(new Date(now+3600000))
   setStart(startTime);setMonth(startTime.slice(0,7));void load()
  },0)
  const ticker=window.setInterval(()=>setClock(Date.now()),15000)
  return()=>{window.clearTimeout(initial);window.clearInterval(ticker);sequence.value++}
 },[load])
 const planMap=new Map(plans.map(p=>[p.content_id,p]))
 const draftsMap=new Map(drafts.map(d=>[d.id,d]))
 const ids=Object.keys(selected)
 const eligible=drafts.filter(d=>d.status==="approved"&&deliveryKinds(d.meta?.platform,d.meta?.format).length>0)
 const filtered=eligible.filter(d=>{const p=planMap.get(d.id);return (filter==="all"||(filter==="planned"?p?.status==="planned":p?.status!=="planned"))&&`${d.title} ${labelFor(d)}`.toLowerCase().includes(search.toLowerCase())})
 const planned=plans.filter(p=>p.status==="planned")
 const monthRows=planned.filter(p=>localInput(new Date(p.planned_at)).startsWith(month)).sort((a,b)=>Date.parse(a.planned_at)-Date.parse(b.planned_at))
 const displayRows=day?monthRows.filter(p=>localInput(new Date(p.planned_at)).startsWith(day)):monthRows
 const dateParts=month.split("-").map(Number)
 const days=month?new Date(dateParts[0],dateParts[1],0).getDate():0
 const blanks=month?(new Date(dateParts[0],dateParts[1]-1,1).getDay()+6)%7:0
 function selection(d:GeneratedContent):Selection {const p=planMap.get(d.id);return {time:p?.status==="planned"?localInput(new Date(p.planned_at)):start,kind:p?.delivery_kind??deliveryKinds(d.meta?.platform,d.meta?.format)[0],revision:p?.revision??0}}
 function toggle(d:GeneratedContent){setSelected(old=>{const next={...old};if(next[d.id])delete next[d.id];else if(Object.keys(next).length<MAX_BATCH)next[d.id]=selection(d);return next})}
 function chooseMany(){setSelected(old=>{const next={...old};for(const d of filtered){if(Object.keys(next).length>=MAX_BATCH)break;if(!next[d.id])next[d.id]=selection(d)}return next})}
 function change(id:string,patch:Partial<Selection>){setSelected(old=>({...old,[id]:{...old[id],...patch}}))}
 function applyTimes(spaced:boolean){try{const times=spacedTimes(start,spaced?Number(interval):0,ids.length);setSelected(old=>Object.fromEntries(ids.map((id,i)=>[id,{...old[id],time:times[i]}])));setError("")}catch(e){setError(e instanceof Error?e.message:"Invalid time.")}}
 async function save(cancel=false){
  if(lock.current||!loaded||!ids.length)return
  setError("");setMessage("")
  try{
   const items=cancel?ids.map(id=>{if(planMap.get(id)?.status!=="planned")throw new Error("Cancellation requires only currently planned posts.");return {contentId:id,revision:selected[id].revision}}):ids.map(id=>({contentId:id,revision:selected[id].revision,plannedAt:toFutureUtc(selected[id].time),timezone,kind:selected[id].kind}))
   if(!window.confirm(`${cancel?"Cancel":"Save or reschedule"} ${items.length} plan(s)? No external post will be sent.`))return
   lock.current=true;setBusy(true)
   const db=createClient();if(!db)throw new Error("Supabase is not configured.")
   const {data,error}=await db.rpc(cancel?"cancel_schedule_plans":"save_schedule_plans",{p_workspace_id:workspaceId,p_client_id:clientId,p_items:items})
   if(error)throw new Error(error.message)
   setSelected({});setMessage(`${data} plan(s) ${cancel?"cancelled":"saved"}. No external publishing was requested.`);await load()
  }catch(e){setError((e instanceof Error?e.message:"Operation not confirmed.")+" Refresh before editing if the result is uncertain.")}
  finally{lock.current=false;setBusy(false)}
 }
 return <div className="space-y-5">
  <div className="rounded-lg border border-border p-3 text-sm"><strong>{clientName}</strong> · Timezone: {timezone||"Loading…"} (device timezone). Plans only — not connected to a publisher. One approved platform variant counts as one item.</div>
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{message&&<p role="status" className="text-sm">{message}</p>}
  <section className="rounded-lg border border-border p-4 space-y-3">
   <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Content calendar · {planned.length} planned</h2><label className="text-sm">Month <input type="month" className={field} value={month} onChange={e=>{setMonth(e.target.value);setDay("")}}/></label><button className={button} disabled={loading||busy} onClick={()=>{if(ids.length&&!window.confirm("Discard unsaved selections and refresh?"))return;setSelected({});setError("");void load()}}>Refresh</button></div>
   <div className="grid grid-cols-7 gap-1">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><span key={d} className="text-center text-xs text-muted-foreground">{d}</span>)}{Array.from({length:blanks},(_,i)=><span key={`blank${i}`}/>)}{Array.from({length:days},(_,i)=>{const key=`${month}-${String(i+1).padStart(2,"0")}`;const n=monthRows.filter(p=>localInput(new Date(p.planned_at)).startsWith(key)).length;return <button key={key} type="button" aria-pressed={day===key} onClick={()=>setDay(day===key?"":key)} className={`min-h-12 rounded border p-1 text-sm ${day===key?"border-primary bg-secondary":"border-border"}`}><span>{i+1}</span>{n>0&&<span className="block text-xs">{n} planned</span>}</button>})}</div>
   <div className="flex justify-between text-sm"><strong>{day||month} · {displayRows.length} items</strong>{day&&<button className="underline" onClick={()=>setDay("")}>Show month</button>}</div>
   <div className="max-h-72 overflow-y-auto space-y-1">{displayRows.map(p=><div key={p.content_id} className="flex flex-wrap justify-between gap-2 border-b border-border py-2 text-sm"><div>{draftsMap.get(p.content_id)?.title??p.content_id}<p className="text-xs text-muted-foreground">{p.delivery_kind} · {new Date(p.planned_at).toLocaleString()} · {p.status}{clock!==null&&Date.parse(p.planned_at)<=clock?" (past; not sent)":""}</p></div><button className={button} disabled={busy||!loaded||!draftsMap.has(p.content_id)||(!selected[p.content_id]&&ids.length>=MAX_BATCH)} onClick={()=>{const d=draftsMap.get(p.content_id);if(d)toggle(d)}}>{selected[p.content_id]?"Deselect":"Select for edit"}</button></div>)}</div>
  </section>
  <fieldset disabled={busy||loading||!loaded||!timezone} className="space-y-4 disabled:opacity-70">
   <legend className="font-semibold">Bulk planning — {ids.length}/{MAX_BATCH} selected</legend>
   <div className="flex flex-wrap gap-2"><input className={field} aria-label="Search approved posts" placeholder="Search approved posts" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Plan filter" className={field} value={filter} onChange={e=>setFilter(e.target.value)}><option value="unplanned">Not planned / cancelled</option><option value="planned">Planned</option><option value="all">All approved</option></select><button className={button} onClick={chooseMany} disabled={ids.length>=MAX_BATCH}>Select up to 100</button><button className={button} onClick={()=>setSelected({})}>Clear selection</button></div>
   <p className="text-xs text-muted-foreground">{filtered.length} matching approved variants. <Link href="/approval" className="underline">Approve drafts first</Link>. Select multiple batches for more than 100.</p>
   <div className="max-h-72 overflow-y-auto rounded border border-border divide-y divide-border">{filtered.map(d=><label key={d.id} className="flex items-center gap-3 p-2 text-sm"><input type="checkbox" checked={!!selected[d.id]} disabled={!selected[d.id]&&ids.length>=MAX_BATCH} onChange={()=>toggle(d)}/><span className="min-w-0 break-words">{d.title}<span className="block text-xs text-muted-foreground">{labelFor(d)} · {d.meta?.format} · {planMap.get(d.id)?.status??"not planned"}</span></span></label>)}</div>
   <div className="rounded-lg border border-border p-3 space-y-2"><p className="font-medium text-sm">Assign time to all selected items</p><div className="flex flex-wrap items-end gap-2"><label className="text-sm">Start time<input type="datetime-local" className={`${field} block`} value={start} onChange={e=>setStart(e.target.value)}/></label><button className={button} disabled={!ids.length} onClick={()=>applyTimes(false)}>Same time for all</button><label className="text-sm">Spacing (minutes)<input type="number" min="0" max="10080" className={`${field} block w-32`} value={interval} onChange={e=>setInterval(e.target.value)}/></label><button className={button} disabled={!ids.length} onClick={()=>applyTimes(true)}>Stagger times</button></div><p className="text-xs text-muted-foreground">Spacing follows selection order. You can change any time individually below. Same-minute plans are allowed, but future API limits may delay publishing.</p></div>
   <div className="space-y-2">{ids.map(id=>{const d=draftsMap.get(id);const s=selected[id];return <div key={id} className="flex flex-wrap items-center gap-2 rounded border border-border p-2 text-sm"><div className="flex-1 min-w-40">{d?.title??id}<p className="text-xs text-muted-foreground">{d?labelFor(d):"Draft unavailable"}</p></div><input aria-label={`Date and time for ${d?.title??id}`} type="datetime-local" className={field} value={s.time} onChange={e=>change(id,{time:e.target.value})}/><select aria-label={`Delivery for ${d?.title??id}`} className={field} value={s.kind} onChange={e=>change(id,{kind:e.target.value as DeliveryKind})}>{deliveryKinds(d?.meta?.platform,d?.meta?.format).map(k=><option key={k} value={k}>{k}</option>)}</select><button className={button} onClick={()=>{setSelected(old=>{const next={...old};delete next[id];return next})}}>Remove</button></div>})}</div>
   <div className="flex flex-wrap gap-3"><button className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={!ids.length} onClick={()=>void save()}>Save {ids.length} plan(s)</button><button className={button} disabled={!ids.length||ids.some(id=>planMap.get(id)?.status!=="planned")} onClick={()=>void save(true)}>Cancel selected plans</button></div>
  </fieldset>{loading&&<p role="status">Loading calendar…</p>}{busy&&<p role="status">Saving…</p>}
 </div>
}
export default function CalendarPage(){const {state}=useAppState();const client=state.clients.find(c=>c.id===state.activeClientId);const allowed=["workspace_owner","workspace_admin","social_media_manager"].includes(state.activeRole??"");return <DashboardLayout><div className="mx-auto max-w-6xl space-y-5"><header><h1 className="text-2xl font-bold">Content Calendar</h1><p className="text-sm text-muted-foreground">Plan up to 100 posts, videos and Reels per batch.</p></header>{!allowed?<p>Scheduling permission required.</p>:!client||!state.activeWorkspaceId?<p>Select a Focus Client first.</p>:<Planner key={`${state.currentUser?.id}:${state.activeWorkspaceId}:${client.id}`} workspaceId={state.activeWorkspaceId} clientId={client.id} clientName={client.name} drafts={state.contentList.filter(d=>d.clientId===client.id&&d.type==="manual_post")}/>}</div></DashboardLayout>}
