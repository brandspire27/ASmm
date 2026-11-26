import { admin, authorize, body, config, failure, hash, nonce, reply, sameOrigin, scopeFrom, SocialError } from "@/lib/social/meta"
import { buildMetaLoginUrl } from "@/lib/social/meta-oauth"
export const runtime="nodejs"
export async function POST(req:Request) {
  try {
    sameOrigin(req)
    const scope=scopeFrom(await body(req)); const user=await authorize(scope); const db=admin(); const c=config()
    const now=new Date().toISOString()
    const {error:cleanup}=await db.from("meta_oauth_flows").delete().eq("user_id",user.id).lt("expires_at",now)
    if(cleanup) throw new SocialError("Unable to clear expired connection attempts.",500)
    const {count,error:countError}=await db.from("meta_oauth_flows").select("id",{count:"exact",head:true}).eq("user_id",user.id)
    if(countError || count===null) throw new SocialError("Unable to verify connection attempts.",500)
    if(count>=5) throw new SocialError("Too many active connection attempts. Wait for them to expire (10 minutes).",429)
    const state=nonce()
    const {error}=await db.from("meta_oauth_flows").insert({user_id:user.id,workspace_id:scope.workspaceId,client_id:scope.clientId,state_hash:hash(state),expires_at:new Date(Date.now()+10*60000).toISOString()})
    if(error) throw new SocialError("Unable to start the secure connection.",500)
    return reply({url:buildMetaLoginUrl(c,state)})
  } catch(error) {return failure(error)}
}
