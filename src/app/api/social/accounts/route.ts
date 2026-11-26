import { accountAAD, admin, authorize, body, config, failure, flowAAD, reply, sameOrigin, scopeFrom, seal, SocialError, unseal, type Candidate } from "@/lib/social/meta"
import { z } from "zod"
export const runtime="nodejs"
const selection=z.object({action:z.literal("connect"),flowId:z.string().uuid(),platform:z.enum(["facebook","instagram"]),externalId:z.string().min(1).max(100)})
const disconnect=z.object({action:z.literal("disconnect"),id:z.string().uuid()})
export async function GET(req:Request) {
  try {
    const q=new URL(req.url).searchParams; const scope=scopeFrom({workspaceId:q.get("workspaceId"),clientId:q.get("clientId")}); const user=await authorize(scope); const db=admin()
    await db.from("meta_oauth_flows").delete().eq("user_id",user.id).lt("expires_at",new Date().toISOString())
    const {data:accounts,error}=await db.from("social_accounts").select("id,platform,external_id,account_name,authorized_at,granted_scopes").eq("workspace_id",scope.workspaceId).eq("client_id",scope.clientId).order("authorized_at",{ascending:false})
    if(error) throw new SocialError("Unable to load connected accounts.",500)
    let configured=true; try {config()} catch {configured=false}
    const candidates=[]
    if(configured) {
      const {data:flows,error:flowError}=await db.from("meta_oauth_flows").select("id,candidates_ciphertext").eq("user_id",user.id).eq("workspace_id",scope.workspaceId).eq("client_id",scope.clientId).gt("expires_at",new Date().toISOString()).not("candidates_ciphertext","is",null).order("created_at",{ascending:false}).limit(1)
      if(flowError) throw new SocialError("Unable to load discovered accounts.",500)
      for(const flow of flows||[]) {
        const items=JSON.parse(unseal(flow.candidates_ciphertext,flowAAD(flow.id))) as Candidate[]
        for(const item of items) candidates.push({flowId:flow.id,platform:item.platform,externalId:item.externalId,name:item.name,pageId:item.pageId,scopes:item.scopes})
      }
    }
    return reply({accounts:accounts||[],candidates,configured})
  } catch(error){return failure(error)}
}
export async function POST(req:Request) {
  try {
    sameOrigin(req); const data=await body(req); const scope=scopeFrom(data); const user=await authorize(scope); const db=admin()
    if(data?.action==="finish") {
      const {error}=await db.from("meta_oauth_flows").delete().eq("user_id",user.id).eq("workspace_id",scope.workspaceId).eq("client_id",scope.clientId)
      if(error) throw new SocialError("Unable to clear discovery data.",500)
      return reply({message:"Discovery data cleared. Saved connections are unchanged."})
    }
    const removed=disconnect.safeParse(data)
    if(removed.success) {
      const {data:deleted,error}=await db.from("social_accounts").delete().eq("workspace_id",scope.workspaceId).eq("client_id",scope.clientId).eq("id",removed.data.id).select("id").maybeSingle()
      if(error || !deleted) throw new SocialError("Account was not disconnected or is inaccessible.",404)
      return reply({message:"Local connection removed. To revoke Meta app access, use Meta's business integration settings."})
    }
    const selected=selection.safeParse(data); if(!selected.success) throw new SocialError("Invalid account selection.")
    const s=selected.data
    const {data:flow,error}=await db.from("meta_oauth_flows").select("id,candidates_ciphertext").eq("id",s.flowId).eq("user_id",user.id).eq("workspace_id",scope.workspaceId).eq("client_id",scope.clientId).gt("expires_at",new Date().toISOString()).not("candidates_ciphertext","is",null).maybeSingle()
    if(error || !flow) throw new SocialError("Discovery session expired. Connect Meta again.",409)
    const items=JSON.parse(unseal(flow.candidates_ciphertext,flowAAD(flow.id))) as Candidate[]
    const candidate=items.find(x=>x.platform===s.platform && x.externalId===s.externalId)
    if(!candidate) throw new SocialError("Account was not authorized in this discovery session.",403)
    await authorize(scope)
    const {error:saveError}=await db.from("social_accounts").upsert({workspace_id:scope.workspaceId,client_id:scope.clientId,platform:candidate.platform,external_id:candidate.externalId,account_name:candidate.name,facebook_page_id:candidate.pageId,token_ciphertext:seal(candidate.token,accountAAD(scope,candidate.platform,candidate.externalId)),granted_scopes:candidate.scopes,connected_by:user.id,authorized_at:new Date().toISOString()},{onConflict:"workspace_id,client_id,platform,external_id"})
    if(saveError) throw new SocialError("Could not save account. It may already belong to another client in this workspace.",409)
    return reply({message:"Authorization saved. Publishing is not enabled; account-specific capability must still be verified."})
  } catch(error){return failure(error)}
}
