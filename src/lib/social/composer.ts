export const platforms = ["facebook", "instagram", "youtube", "google_business"] as const
export type Platform = typeof platforms[number]
export type Format = "text" | "image" | "video"
export type Variant = { platform: Platform; format: Format; title: string; caption: string; assetId: string }
export const platformLabels: Record<Platform,string> = { facebook: "Facebook Page", instagram: "Instagram", youtube: "YouTube", google_business: "Google Business Profile" }
export const formats: Record<Platform, Format[]> = { facebook: ["text","image","video"], instagram: ["image","video"], youtube: ["video"], google_business: ["text","image"] }
// Conservative composer limits, NOT final API specifications.
export const captionLimits: Record<Platform,number> = { facebook:5000, instagram:2000, youtube:5000, google_business:1500 }
export const count = (value:string) => Array.from(value).length
export function initialVariant(platform:Platform):Variant { return {platform,format:formats[platform][0],title:"",caption:"",assetId:""} }
export function assetFormat(path?:string): Format | null {
  if (!path) return null
  if (/\.mp4$/i.test(path)) return "video"
  if (/\.(jpe?g|png|webp)$/i.test(path)) return "image"
  return null
}
export function validateVariant(v:Variant):string|null {
  if (!formats[v.platform].includes(v.format)) return "Unsupported draft format."
  if (!v.title.trim() || count(v.title.trim())>100) return "Enter a title of 1–100 characters."
  if (!v.caption.trim() || count(v.caption.trim())>captionLimits[v.platform]) return `Enter a caption or description of 1–${captionLimits[v.platform]} characters.`
  if (v.format!=="text" && !v.assetId) return "Select uploaded media."
  if (v.format==="text" && v.assetId) return "Remove media from the text draft."
  return null
}
