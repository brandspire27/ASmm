// Pure helpers. Never expose tokens or raw Graph payloads in diagnostics.
export type Candidate = { platform:"facebook"|"instagram"; externalId:string; name:string; pageId:string; token:string; scopes:string[] }
export type MetaPage = {id?:string;name?:string;access_token?:string;instagram_business_account?:{id?:string;username?:string}}
export type TokenDebug = {is_valid?:boolean;app_id?:string;type?:string;granular_scopes?:{scope?:string;target_ids?:string[]}[]}
export type DiscoveryStatus = "ready"|"empty_no_tokens"|"empty_business_grant"|"empty_targets"|"empty_target_lookup"|"empty_debug_unavailable"
export function pageCandidates(p:MetaPage|null|undefined,scopes:string[]):Candidate[] {
  if(!p || typeof p.id!=="string" || !/^\d+$/.test(p.id) || typeof p.name!=="string" || !p.name.trim() || typeof p.access_token!=="string" || !p.access_token) return []
  const result:Candidate[]=[{platform:"facebook",externalId:p.id,name:p.name,pageId:p.id,token:p.access_token,scopes}]
  const ig=p.instagram_business_account
  if(scopes.includes("instagram_basic") && typeof ig?.id==="string" && /^\d+$/.test(ig.id)) result.push({platform:"instagram",externalId:ig.id,name:ig.username || `Instagram ${ig.id}`,pageId:p.id,token:p.access_token,scopes})
  return result
}
// Only use explicit Page grants reported by Meta. Never guess IDs, enumerate
// all business assets, or interpret an absent granular target list as consent.
export function explicitPageTargets(debug:TokenDebug,appId:string):string[] {
  if(debug.is_valid!==true || debug.app_id!==appId || debug.type!=="USER") return []
  const granular=Array.isArray(debug.granular_scopes)?debug.granular_scopes:[]
  const ids=(scope:string)=>new Set(granular.filter(x=>x.scope===scope && Array.isArray(x.target_ids)).flatMap(x=>x.target_ids!).filter(x=>typeof x==="string" && /^\d+$/.test(x)))
  const list=ids("pages_show_list"), read=ids("pages_read_engagement")
  // Conservative: require explicit targets on BOTH permissions.
  return [...list].filter(id=>read.has(id))
}
export function uniqueCandidates(items:Candidate[]):Candidate[] {
  return [...new Map(items.map(x=>[`${x.platform}:${x.externalId}`,x])).values()]
}
export function emptyStatus(input:{rows:number;businessGrant:boolean;debugAvailable:boolean;targetCount:number}):DiscoveryStatus {
  if(input.targetCount>0)return "empty_target_lookup"
  if(input.rows>0)return "empty_no_tokens"
  if(!input.businessGrant)return "empty_business_grant"
  if(!input.debugAvailable)return "empty_debug_unavailable"
  return "empty_targets"
}
