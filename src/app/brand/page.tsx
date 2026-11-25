"use client"

import React, { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { useAppState, type BrandProfile } from "@/context/AppStateContext"

interface BrandProfileFormState {
  name: string
  industry: string
  websiteUrl: string
  companyDescription: string
  targetAudience: string
  brandVoice: string
  brandColors: string
}

function formFromProfile(profile: BrandProfile | null): BrandProfileFormState {
  return {
    name: profile?.name ?? "",
    industry: profile?.industry ?? "",
    websiteUrl: profile?.websiteUrl ?? "",
    companyDescription: profile?.companyDescription ?? "",
    targetAudience: profile?.targetAudience ?? "",
    brandVoice: profile?.brandVoice ?? "",
    brandColors: profile?.brandColors.join(", ") ?? "#003b91, #ffca28"
  }
}

export default function BrandProfilePage() {
  const { state, updateBrandProfile } = useAppState()
  const [form, setForm] = useState(() => formFromProfile(state.brandProfile))
  const [syncedProfile, setSyncedProfile] = useState(state.brandProfile)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  if (state.brandProfile !== syncedProfile) {
    setSyncedProfile(state.brandProfile)
    setForm(formFromProfile(state.brandProfile))
  }

  const updateFormField = (field: keyof BrandProfileFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage("")
    setError("")
    const colors = form.brandColors.split(",").map((color) => color.trim()).filter(Boolean)
    if (colors.some((color) => !/^#[0-9a-fA-F]{6}$/.test(color))) {
      setError("Enter brand colors as comma-separated 6-digit hex values, for example #003b91, #ffca28.")
      return
    }

    setIsSaving(true)
    try {
      await updateBrandProfile({
        name: form.name.trim(),
        industry: form.industry.trim(),
        websiteUrl: form.websiteUrl.trim(),
        companyDescription: form.companyDescription.trim(),
        targetAudience: form.targetAudience.trim(),
        brandVoice: form.brandVoice.trim(),
        brandColors: colors
      })
      setMessage("Brand profile saved to this workspace.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the brand profile.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Brand Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Store approved brand facts and voice guidance for the active workspace.
          </p>
        </div>

        {message && <div role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">{message}</div>}
        {error && <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-muted-foreground">
              <span className="block uppercase tracking-wider">Brand name</span>
              <input value={form.name} onChange={(event) => updateFormField("name", event.target.value)} required maxLength={100} className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-muted-foreground">
              <span className="block uppercase tracking-wider">Industry</span>
              <input value={form.industry} onChange={(event) => updateFormField("industry", event.target.value)} maxLength={120} className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
            </label>
          </div>
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            <span className="block uppercase tracking-wider">Website</span>
            <input type="url" value={form.websiteUrl} onChange={(event) => updateFormField("websiteUrl", event.target.value)} maxLength={2048} placeholder="https://example.com" className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            <span className="block uppercase tracking-wider">Approved company description</span>
            <textarea value={form.companyDescription} onChange={(event) => updateFormField("companyDescription", event.target.value)} rows={3} maxLength={5000} className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            <span className="block uppercase tracking-wider">Target audience</span>
            <textarea value={form.targetAudience} onChange={(event) => updateFormField("targetAudience", event.target.value)} rows={2} maxLength={2000} className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            <span className="block uppercase tracking-wider">Brand voice</span>
            <textarea value={form.brandVoice} onChange={(event) => updateFormField("brandVoice", event.target.value)} rows={2} maxLength={2000} placeholder="Tone, vocabulary, and phrases to avoid" className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground" />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            <span className="block uppercase tracking-wider">Brand colors</span>
            <input value={form.brandColors} onChange={(event) => updateFormField("brandColors", event.target.value)} maxLength={400} className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-sm text-foreground" />
          </label>
          <div className="flex justify-end">
            <button type="submit" disabled={isSaving || !state.activeWorkspaceId} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
              {isSaving ? "Saving..." : "Save brand profile"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
