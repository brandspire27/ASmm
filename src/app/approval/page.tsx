"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState } from "@/context/AppStateContext"
import { CheckSquare, CheckCircle, Send, RefreshCw } from "lucide-react"

export default function ApprovalPage() {
  const { state, updateContentStatus } = useAppState()
  
  const [publishingAssetId, setPublishingAssetId] = useState<string | null>(null)
  const [notification, setNotification] = useState("")

  // Filter content
  const draftContent = state.contentList.filter((c) => c.status === "draft")
  const approvedContent = state.contentList.filter((c) => c.status === "approved")
  const publishedContent = state.contentList.filter((c) => c.status === "published")

  const handleApprove = async (id: string) => {
    try {
      await updateContentStatus(id, "approved")
      setNotification("Approval saved to the shared workspace.")
      setTimeout(() => setNotification(""), 3500)
    } catch (error) {
      setNotification(error instanceof Error ? error.message : "Unable to approve the asset.")
    }
  }

  const handleReject = async (id: string) => {
    try {
      await updateContentStatus(id, "rejected")
      setNotification("Asset archived in the shared workspace.")
      setTimeout(() => setNotification(""), 3500)
    } catch (error) {
      setNotification(error instanceof Error ? error.message : "Unable to archive the asset.")
    }
  }

  const handlePublish = async (id: string) => {
    setPublishingAssetId(id)
    try {
      await updateContentStatus(id, "published")
      setPublishingAssetId(null)
      setNotification("Status marked as published. No social network post was sent.")
      setTimeout(() => setNotification(""), 4000)
    } catch (error) {
      setNotification(error instanceof Error ? error.message : "Unable to update the asset status.")
    } finally {
      setPublishingAssetId(null)
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
          <div className="rounded-md bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium">
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

                  <div className="bg-secondary/30 p-3 rounded text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto">
                    {item.content}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => handleReject(item.id)}
                    className="flex-1 rounded border border-border bg-card py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="flex-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve Asset
                  </button>
                </div>
              </div>
            ))}

            {draftContent.length === 0 && (
              <div className="lg:col-span-2 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-xs italic">
                No items currently awaiting editorial approval. Use the Content Generator or Video Workspace to draft more social campaigns!
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

                  <div className="bg-secondary/30 p-3 rounded text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                    {item.content}
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <button
                    onClick={() => handlePublish(item.id)}
                    disabled={publishingAssetId !== null}
                    className="w-full rounded bg-primary text-primary-foreground py-2 text-xs font-bold hover:bg-primary/90 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {publishingAssetId === item.id ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Updating status...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Mark as Published
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}

            {approvedContent.length === 0 && (
              <div className="lg:col-span-2 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-xs italic">
                No items currently awaiting API posting. Approve draft items above to prepare them for posting.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Live Post Log Feed */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
            3. Live Published Feed / API Posting Logs ({publishedContent.length} Posted)
          </h3>

          <div className="space-y-3">
            {publishedContent.map((item) => (
              <div key={item.id} className="p-4 rounded-lg border border-border bg-secondary/10 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold font-mono">
                      PUBLISHED
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

                <div className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-bold shrink-0">
                  POST OK
                </div>
              </div>
            ))}

            {publishedContent.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-xs italic">
                No campaigns have been posted yet. Run the API publisher above to start populating live campaign feeds!
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
