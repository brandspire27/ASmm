import { admin, authorize, config, discover, flowAAD, hash, seal, signedIn } from "@/lib/social/meta"
export const runtime="nodejs"
export async function GET(req:Request) {
  let origin:string
  try {origin=config().origin} catch {return new Response("Meta connection is not configured.",{status:503})}
  const redirect=(status:string)=>new Response(null,{status:303,headers:{Location:`${origin}/social-accounts?meta=${status}`,"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}})
  try {
    const query=new URL(req.url).searchParams; const state=query.get("state")
    if(!state || !/^[a-f0-9]{64}$/.test(state)) return redirect("invalid")
    const {user}=await signedIn(); const db=admin()
    const now=new Date().toISOString()
    // Conditional update atomically claims state; a second callback cannot exchange the code.
    const {data:flow,error}=await db.from("meta_oauth_flows").update({consumed_at:now}).eq("state_hash",hash(state)).eq("user_id",user.id).gt("expires_at",now).is("consumed_at",null).select("id,workspace_id,client_id").maybeSingle()
    if(error || !flow) return redirect("invalid")
    const scope={workspaceId:flow.workspace_id,clientId:flow.client_id}; await authorize(scope)
    const code=query.get("code")
    if(query.has("error") || !code) return redirect("cancelled")
    const {candidates,status}=await discover(code)
    await authorize(scope)
    const {error:saveError}=await db.from("meta_oauth_flows").update({candidates_ciphertext:seal(JSON.stringify(candidates),flowAAD(flow.id)),expires_at:new Date(Date.now()+10*60000).toISOString()}).eq("id",flow.id).eq("user_id",user.id)
    if(saveError) return redirect("failed")
    return redirect(status)
  } catch {return redirect("failed")}
}
