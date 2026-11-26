"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import ManualPostPreview from "@/components/ManualPostPreview"
import { useAppState } from "@/context/AppStateContext"
import { CheckSquare, CheckCircle, Send } from "lucide-react"

export default function ApprovalPage() {
  const { state, updateContentStatus } = useAppState()
  
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const canReview = ["workspace_owner", "workspace_admin", "social_media_manager", "content_approver"].includes(state.activeRole ?? "")
  const [notification, setNotification] = useState("")

  // Filter content
  const draftContent = state.contentList.filter((c) => c.status === "draft")
  const approvedContent = state.contentList.filter((c) => c.status === "approved")
  const unverifiedContent = state.contentList.filter((c) => c.status === "unverified")
  const rejectedContent = state.contentList.filter((c) => c.status === "rejected")

  const handleReview = async (id: string, decision: "approved" | "rejected") => {
    if (!canReview || reviewingId) return
    setReviewingId(id)
    setNotification("")
    try {
      await updateContentStatus(id, decision)
      setNotification(decision === "approved" ? "Approval saved to the shared workspace." : "Rejection saved to the shared workspace.")
    } catch (error) {
      setNotification(error instanceof Error ? error.message : "Unable to review the asset.")
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Titles */}
        <div className="border-b border-border pb-5">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Approvals & Publishing Hub</h2>
          <p className="text-xs text-muted-foreground">
            Review and approve shared drafts. Social network publishing is not connected.
          </p>
        </div>

        {notification && (
          <div className="rounded-md bg-secondary border border-border p-3 text-xs text-foreground font-medium">
            {notification}
          </div>
        )}

        {/* SECTION 1: Awaiting Editorial Review */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
            <CheckSquare className="h-4 w-4 text-amber-500" />
            1. Editorial Review Queue ({draftContent.length} Assets Pending)
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {draftContent.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-card p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                        {item.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Client: {item.clientName}
                      </span>
                    </div>

                    <span className="text-[10px] text-muted-foreground font-mono">
                      Model: {item.providerUsed}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                  {item.type === "manual_post" && <ManualPostPreview platform={item.meta?.platform ?? "Unknown"} format={item.meta?.format ?? "unknown"} title={item.title} caption={item.content} asset={state.clients.find(c => c.id === item.clientId)?.assets.find(a => a.id === item.meta?.assetId)} assetName={item.meta?.assetName}/>}

                  {/* Thumbnail Image display */}
                  {item.type === "thumbnail" && item.meta?.imageUrl && (
                    <div className="aspect-video relative rounded overflow-hidden border border-border bg-black flex items-center justify-center">
                      <img src={item.meta.imageUrl} alt="" className="object-cover w-full h-full opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center p-3 text-center pointer-events-none">
                        <span className="text-xs font-black uppercase text-white drop-shadow-md">{item.meta.overlayText}</span>
                      </div>
                    </div>
                  )}

                  {/* Video render display */}
                  {item.type === "video" && item.meta?.videoUrl && (
                    <div className="aspect-video relative rounded overflow-hidden border border-border bg-black flex items-center justify-center">
                      <video src={item.meta.videoUrl} muted controls className="object-cover w-full h-full" />
                    </div>
                  )}

                  {item.type !== "manual_post" && <div className="bg-secondary/30 p-3 rounded text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto">
                    {item.content}
                  </div>}
                </div>

                {canReview ? <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    disabled={reviewingId !== null}
                    onClick={() => handleReview(item.id, "rejected")}
                    className="flex-1 rounded border border-border bg-card py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                  >
                    Reject
                  </button>
                  <button
                    disabled={reviewingId !== null}
                    onClick={() => handleReview(item.id, "approved")}
                    className="flex-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve Asset
                  </button>
                </div> : <p className="text-xs text-muted-foreground">Awaiting an authorized reviewer.</p>}
              </div>
            ))}

            {draftContent.length === 0 && (
              <div className="lg:col-span-2 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-xs italic">
                No items currently awaiting editorial approval. Use Create Post, the Content Generator or Video Workspace to draft more social campaigns!
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Approved Campaign Publishing Console */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
            <Send className="h-4 w-4 text-primary" />
            2. Approved Content Status Queue ({approvedContent.length} Assets Approved)
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {approvedContent.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-card p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-bold font-mono">
                      APPROVED
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Client: {item.clientName}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                  {item.type === "manual_post" && <ManualPostPreview platform={item.meta?.platform ?? "Unknown"} format={item.meta?.format ?? "unknown"} title={item.title} caption={item.content} asset={state.clients.find(c => c.id === item.clientId)?.assets.find(a => a.id === item.meta?.assetId)} assetName={item.meta?.assetName}/>}

                  {item.type !== "manual_post" && <div className="bg-secondary/30 p-3 rounded text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                    {item.content}
                  </div>}
                </div>

                <p className="pt-2 border-t border-border text-xs text-muted-foreground">
                  Approved for editorial use. Social publishing is not connected.
                </p>
              </div>
            ))}

            {approvedContent.length === 0 && (
              <div className="lg:col-span-2 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-xs italic">
                No approved drafts yet.
              </div>
            )}
          </div>
        </div>

        {/* Historical status-only records, not verified social posts. */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
            3. Legacy unverified records ({unverifiedContent.length})
          </h3>

          <div className="space-y-3">
            {unverifiedContent.map((item) => (
              <div key={item.id} className="p-4 rounded-lg border border-border bg-secondary/10 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold font-mono">
                      UNVERIFIED
                    </span>
                    <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Client: {item.clientName}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate leading-relaxed max-w-xl">
                    {item.content}
                  </p>
                </div>

                <div className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-1 rounded border border-border font-bold shrink-0">
                  NO API RECEIPT
                </div>
              </div>
            ))}

            {unverifiedContent.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-xs italic">
                No legacy unverified records. No social publishing integration is connected.
              </div>
            )}
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase border-b border-border pb-2">4. Rejected drafts ({rejectedContent.length})</h3>
          {rejectedContent.map(item => <div key={item.id} className="rounded-lg border border-border p-4"><p className="text-xs font-semibold">{item.title} — {item.clientName}</p><p className="text-xs whitespace-pre-wrap text-muted-foreground">{item.content}</p></div>)}
        </section>
      </div>
    </DashboardLayout>
  )
}
