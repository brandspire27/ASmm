"use client"
import type { BrandAsset } from "@/context/AppStateContext"
import { platformLabels, type Platform } from "@/lib/social/composer"

export default function ManualPostPreview({platform, format, title, caption, asset, assetName}:{platform:string;format:string;title:string;caption:string;asset?:BrandAsset;assetName?:string}) {
  return <div className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{platformLabels[platform as Platform] ?? platform}</span><span className="rounded bg-secondary px-2 py-1 text-xs capitalize text-muted-foreground">{format} · draft preview</span></div>
    {title && <p className="break-words text-sm font-semibold">{title}</p>}
    {format!=="text" && (asset?.url ? <div className="overflow-hidden rounded-md border border-border bg-secondary/30">
      {format==="video" ? <video src={asset.url} controls preload="metadata" className="max-h-72 w-full"/> : /* Signed private media is intentionally not proxied through image optimization. */
      // eslint-disable-next-line @next/next/no-img-element
      <img src={asset.url} alt={asset.name} className="max-h-72 w-full object-contain"/>}
      <p className="px-2 py-1 text-xs text-muted-foreground break-words">{asset.name}</p>
    </div> : <p className="rounded border border-dashed border-border p-4 text-xs text-muted-foreground">{assetName ? `Media unavailable: ${assetName}. Reload or ask an authorized administrator.` : "No media selected."}</p>)}
    <p className="whitespace-pre-wrap break-words text-sm">{caption || "Your caption or description will appear here."}</p>
    <p className="text-xs text-muted-foreground">Illustrative preview only. Final display and media eligibility depend on the platform.</p>
  </div>
}
