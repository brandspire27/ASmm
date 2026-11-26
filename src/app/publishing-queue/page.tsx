"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState } from "@/context/AppStateContext"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { MAX_QUEUE_BATCH, stageablePlans, stagePayload, pausePayload } from "@/lib/social/publishing-queue"

type Plan=Database["public"]["Tables"]["post_schedule_plans"]["Row"]
type Job=Database["public"]["Tables"]["publishing_jobs"]["Row"]
const button="rounded border border-border px-3 py-2 text-sm disabled:opacity-50"
const states={held:"Held — publishing disabled",paused:"Paused",superseded:"Superseded by calendar change",cancelled:"Cancelled in calendar"}
function Queue({workspaceId,clientId,clientName,titles}:{workspaceId:string;clientId:string;clientName:string;titles:Record<string,string>}){
 const [plans,setPlans]=useState<Plan[]>([]),[jobs,setJobs]=useState<Job[]>([])
 const [planIds,setPlanIds]=useState<string[]>([]),[jobIds,setJobIds]=useState<string[]>([])
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false)
 const [error,setError]=useState(""),[message,setMessage]=useState("")
 const [clock,setClock]=useState<number|null>(null)
 const seq=useRef({value:0}),lock=useRef(false)
 const load=useCallback(async()=>{
  const n=++seq.current.value;setLoading(true);setLoaded(false)
  try{
   const db=createClient();if(!db)throw new Error("Supabase is not configured.")
   const p:Plan[]=[],j:Job[]=[]
   for(let offset=0;;offset+=500){const {data,error}=await db.from("post_schedule_plans").select("*").eq("workspace_id",workspaceId).eq("client_id",clientId).order("content_id").range(offset,offset+499);if(error)throw new Error(error.message);p.push(...(data??[]));if((data??[]).length<500)break}
   for(let offset=0;;offset+=500){const {data,error}=await db.from("publishing_jobs").select("*").eq("workspace_id",workspaceId).eq("client_id",clientId).order("id").range(offset,offset+499);if(error)throw new Error(error.message);j.push(...(data??[]));if((data??[]).length<500)break}
   if(n===seq.current.value){setPlans(p);setJobs(j);setPlanIds([]);setJobIds([]);setLoaded(true)}
  }catch(e){if(n===seq.current.value)setError(e instanceof Error?e.message:"Unable to load queue.")}
  finally{if(n===seq.current.value)setLoading(false)}
 },[workspaceId,clientId])
 useEffect(()=>{
  const sequence=seq.current
  const initial=window.setTimeout(()=>{setClock(Date.now());void load()},0)
  const ticker=window.setInterval(()=>setClock(Date.now()),15000)
  return()=>{window.clearTimeout(initial);window.clearInterval(ticker);sequence.value++}
 },[load])
 const eligible=(clock===null?[]:stageablePlans(plans,jobs,clock)).sort((a,b)=>Date.parse(a.planned_at)-Date.parse(b.planned_at))
 const active=jobs.filter(j=>j.status==='held'||j.status==='paused')
 const sorted=[...jobs].sort((a,b)=>Date.parse(a.planned_at)-Date.parse(b.planned_at)||a.id.localeCompare(b.id))
 const chosenPlans=eligible.filter(p=>planIds.includes(p.content_id)),chosenJobs=active.filter(j=>jobIds.includes(j.id))
 const blocked=busy||loading||!loaded
 function toggle(ids:string[],id:string,save:(v:string[])=>void){save(ids.includes(id)?ids.filter(x=>x!==id):ids.length<MAX_QUEUE_BATCH?[...ids,id]:ids)}
 async function act(mode:'stage'|'pause'|'resume'){
  if(lock.current||blocked)return
  lock.current=true;setBusy(true);setError("");setMessage("")
  try{
   const db=createClient();if(!db)throw new Error("Supabase is not configured.")
   if(mode==='stage'&&chosenPlans.length!==planIds.length||mode!=='stage'&&chosenJobs.length!==jobIds.length)throw new Error("Selection changed. Refresh first.")
   const items=mode==='stage'?stagePayload(chosenPlans):pausePayload(chosenJobs)
   if(!window.confirm(`${mode==='stage'?'Stage':mode==='pause'?'Pause':'Return to held'} ${items.length} job(s)? No external post will be sent.`))return
   const args={p_workspace_id:workspaceId,p_client_id:clientId,p_items:items}
   const {data,error}=mode==='stage'?await db.rpc('stage_publishing_jobs',args):await db.rpc('set_publishing_job_pause',{...args,p_paused:mode==='pause'})
   if(error)throw new Error(error.message)
   setMessage(`${data} job(s) processed. Publishing remains disabled.`);await load()
  }catch(e){setError((e instanceof Error?e.message:"Operation not confirmed.")+" Refresh before retrying if uncertain.")}
  finally{lock.current=false;setBusy(false)}
 }
 return <div className="space-y-5">
  <p className="rounded border border-border p-3 text-sm"><strong>{clientName}</strong> · Persistent queue pilot. All jobs are non-executable; no account has been selected for publishing. Existing plans are not automatically activated.</p>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{(['held','paused','superseded','cancelled'] as const).map(s=><div key={s} className="rounded border border-border p-3"><p className="text-xl font-semibold">{jobs.filter(j=>j.status===s).length}</p><p className="text-xs capitalize">{s}</p></div>)}</div>
  <button className={button} disabled={busy||loading} onClick={()=>{setError("");void load()}}>Refresh queue</button>{loading&&<p role="status">Loading…</p>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{message&&<p role="status" className="text-sm">{message}</p>}
  <fieldset disabled={blocked} className="space-y-3 rounded border border-border p-4 disabled:opacity-70">
   <legend className="font-semibold">Stage future calendar plans ({planIds.length}/100)</legend>
   <p className="text-sm text-muted-foreground">{eligible.length} available. <Link href="/calendar" className="underline">Plan or reschedule in Content Calendar</Link>. Each approved platform variant is one job.</p>
   <div className="flex flex-wrap gap-2"><button className={button} onClick={()=>setPlanIds(eligible.slice(0,MAX_QUEUE_BATCH).map(p=>p.content_id))}>Select first 100</button><button className={button} onClick={()=>setPlanIds([])}>Clear</button></div>
   <div className="max-h-80 overflow-y-auto divide-y divide-border">{eligible.map(p=><label key={p.content_id} className="flex gap-3 items-center py-2 text-sm"><input type="checkbox" checked={planIds.includes(p.content_id)} disabled={!planIds.includes(p.content_id)&&planIds.length>=MAX_QUEUE_BATCH} onChange={()=>toggle(planIds,p.content_id,setPlanIds)}/><span>{titles[p.content_id]??p.content_id}<span className="block text-xs text-muted-foreground">{p.delivery_kind} · {new Date(p.planned_at).toLocaleString()} · rev {p.revision}</span></span></label>)}</div>
   <button className={button} disabled={!chosenPlans.length} onClick={()=>void act('stage')}>Stage {chosenPlans.length} jobs (held)</button>
  </fieldset>
  <fieldset disabled={blocked} className="space-y-3 rounded border border-border p-4 disabled:opacity-70">
   <legend className="font-semibold">Job history ({jobs.length}) · {jobIds.length}/100 selected</legend>
   <div className="flex flex-wrap gap-2"><button className={button} onClick={()=>setJobIds(active.slice(0,MAX_QUEUE_BATCH).map(j=>j.id))}>Select up to 100 active</button><button className={button} onClick={()=>setJobIds([])}>Clear</button><button className={button} disabled={!chosenJobs.length} onClick={()=>void act('pause')}>Pause selected</button><button className={button} disabled={!chosenJobs.length} onClick={()=>void act('resume')}>Return to held</button></div>
   <div className="max-h-[32rem] overflow-y-auto divide-y divide-border">{sorted.map(j=><label key={j.id} className="flex gap-3 items-center py-3 text-sm"><input type="checkbox" checked={jobIds.includes(j.id)} disabled={j.status==='superseded'||j.status==='cancelled'||(!jobIds.includes(j.id)&&jobIds.length>=MAX_QUEUE_BATCH)} onChange={()=>toggle(jobIds,j.id,setJobIds)}/><span className="min-w-0 flex-1 break-words">{titles[j.content_id]??j.content_id}<span className="block text-xs text-muted-foreground">{j.platform} · {j.delivery_kind} · {new Date(j.planned_at).toLocaleString()} · rev {j.plan_revision}</span><span className="block text-xs">{states[j.status]}{(j.status==='held'||j.status==='paused')&&clock!==null&&Date.parse(j.planned_at)<=clock?' · Past time; reschedule before activation':''}</span></span></label>)}</div>
   {!jobs.length&&<p className="text-sm text-muted-foreground">No jobs staged yet.</p>}
  </fieldset>
 </div>
}
export default function PublishingQueuePage(){
 const {state}=useAppState();const client=state.clients.find(c=>c.id===state.activeClientId);const allowed=["workspace_owner","workspace_admin","social_media_manager"].includes(state.activeRole??"")
 return <DashboardLayout><div className="mx-auto max-w-6xl space-y-5"><header><h1 className="text-2xl font-bold">Publishing Queue</h1><p className="text-sm text-muted-foreground">Durable preparation for cloud publishing. Nothing is dispatched in this phase.</p></header>{!allowed?<p>Scheduling permission required.</p>:!client||!state.activeWorkspaceId?<p>Select a Focus Client first.</p>:<Queue key={`${state.currentUser?.id}:${state.activeWorkspaceId}:${client.id}`} workspaceId={state.activeWorkspaceId} clientId={client.id} clientName={client.name} titles={Object.fromEntries(state.contentList.filter(c=>c.clientId===client.id).map(c=>[c.id,c.title]))}/>}</div></DashboardLayout>
}
