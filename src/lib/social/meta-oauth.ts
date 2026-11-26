// Pure helpers: no credentials, framework imports or network access.
export const requestedScopes = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish", "business_management"]
export function buildMetaLoginUrl(c:{appId:string;version:string;redirect:string;configurationId:string}, state:string) {
  if (!/^\d+$/.test(c.configurationId)) throw new Error("Meta Login for Business Configuration ID is required.")
  if (!/^\d+$/.test(c.appId) || !/^v\d+\.\d+$/.test(c.version) || !/^[a-f0-9]{64}$/.test(state)) throw new Error("Invalid OAuth parameters.")
  const url=new URL(`https://www.facebook.com/${c.version}/dialog/oauth`)
  url.search=new URLSearchParams({client_id:c.appId,redirect_uri:c.redirect,state,config_id:c.configurationId,response_type:"code",override_default_response_type:"true"}).toString()
  return url.toString()
}
export function grantedMetaScopes(items:{permission:string;status:string}[]) {
  return [...new Set(items.filter(x=>x.status==="granted" && requestedScopes.includes(x.permission)).map(x=>x.permission))]
}
// These are reported USER grants, not evidence of Page tasks, asset scope or token health.
export function missingPublishingGrants(platform:string, scopes:string[]) {
  const required=platform==="facebook"?["pages_show_list","pages_read_engagement","pages_manage_posts"]:platform==="instagram"?["pages_show_list","pages_read_engagement","instagram_basic","instagram_content_publish","business_management"]:null
  return required ? required.filter(p=>!scopes.includes(p)) : null
}
