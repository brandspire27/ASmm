"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAppState } from "@/context/AppStateContext"
import BrandLogo from "@/components/BrandLogo"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Cpu,
  PenTool,
  Video,
  CheckSquare,
  BarChart3,
  LogOut,
  ChevronDown,
  Building,
  Settings2,
  Radio,
  CalendarDays,
  ListOrdered
} from "lucide-react"

export default function Sidebar({ onNavigate = () => {} }: { onNavigate?: () => void }) {
  const { state, setActiveClient, switchWorkspace, logout } = useAppState()
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Brand Profile", href: "/brand", icon: Building },
    { label: "Workspaces", href: "/workspaces", icon: Settings2 },
    { label: "Client Manager", href: "/clients", icon: Users },
    ...(["workspace_owner", "workspace_admin"].includes(state.activeRole ?? "") ? [{ label: "Social Accounts", href: "/social-accounts", icon: Radio }] : []),
    { label: "Brand Assets", href: "/assets", icon: Briefcase },
    { label: "AI Router", href: "/router", icon: Cpu },
    ...(["workspace_owner", "workspace_admin", "social_media_manager", "content_creator"].includes(state.activeRole ?? "") ? [{ label: "Create Post", href: "/create-post", icon: PenTool }] : []),
    ...(["workspace_owner", "workspace_admin", "social_media_manager"].includes(state.activeRole ?? "") ? [{ label: "Content Calendar", href: "/calendar", icon: CalendarDays }] : []),
    ...(["workspace_owner", "workspace_admin", "social_media_manager"].includes(state.activeRole ?? "") ? [{ label: "Publishing Queue", href: "/publishing-queue", icon: ListOrdered }] : []),
    { label: "Content Generator", href: "/generator", icon: PenTool },
    { label: "Video Generator", href: "/videos", icon: Video },
    { label: "Approvals", href: "/approval", icon: CheckSquare },
    { label: "Performance", href: "/analytics", icon: BarChart3 },
  ]

  const activeClient = state.clients.find((c) => c.id === state.activeClientId)

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to sign out.")
    }
  }

  const handleWorkspaceChange = async (workspaceId: string) => {
    try {
      await switchWorkspace(workspaceId)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to switch workspace.")
    }
  }

  return (
    <aside className="w-64 flex-col border-r border-border bg-card flex h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 gap-2.5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BrandLogo className="h-7 w-auto max-w-full object-contain" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground tracking-tight">BrandSpire Social AI</h1>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-mono">
            Workspace Hub
          </span>
        </div>
      </div>

      <div className="border-b border-border bg-secondary/20 p-4">
        <label htmlFor="active-workspace" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Active Workspace
        </label>
        <select
          id="active-workspace"
          value={state.activeWorkspaceId ?? ""}
          onChange={(event) => void handleWorkspaceChange(event.target.value)}
          className="w-full rounded-md border border-border bg-card px-2 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {state.workspaces.map((workspace) => (
            <option key={workspace.workspaceId} value={workspace.workspaceId}>
              {workspace.organizationName} / {workspace.workspaceName}
            </option>
          ))}
        </select>
        {state.activeRole && (
          <p className="mt-1.5 text-[10px] capitalize text-muted-foreground">
            Role: {state.activeRole.replaceAll("_", " ")}
          </p>
        )}
      </div>

      {/* Active Client Selector */}
      <div className="p-4 border-b border-border bg-secondary/20">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
          Focus Client
        </label>
        <div className="relative">
          <select
            value={state.activeClientId || ""}
            onChange={(e) => setActiveClient(e.target.value || null)}
            className="w-full appearance-none rounded-md border border-border bg-card py-1.5 pl-8 pr-8 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">-- Select Client --</option>
            {state.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
        {activeClient && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Brand Palette:</span>
            <div className="flex gap-1">
              {activeClient.brandColors.map((color, idx) => (
                <div
                  key={idx}
                  className="h-2 w-2 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Saved AI provider preferences */}
      <div className="p-4 border-t border-border bg-secondary/10 space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <Radio className="h-3 w-3 text-muted-foreground" />
            Provider Preferences
          </span>
          <span className="text-muted-foreground font-bold uppercase font-mono">Saved</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
          <div className="bg-card border border-border rounded p-1 text-center" title="Selected text provider (not connected)">
            <div className="text-muted-foreground">TXT</div>
            <div className="font-semibold text-foreground truncate">
              {state.providers.text.active}
            </div>
          </div>
          <div className="bg-card border border-border rounded p-1 text-center" title="Selected image provider (not connected)">
            <div className="text-muted-foreground">IMG</div>
            <div className="font-semibold text-foreground truncate">
              {state.providers.image.active}
            </div>
          </div>
          <div className="bg-card border border-border rounded p-1 text-center" title="Selected video provider (not connected)">
            <div className="text-muted-foreground">VID</div>
            <div className="font-semibold text-foreground truncate">
              {state.providers.video.active}
            </div>
          </div>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/20">
        <div className="truncate mr-2">
          <div className="text-xs font-semibold text-foreground truncate">
            {state.currentUser?.name || "MARKETER"}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {state.currentUser?.email || "internal@agency.co"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign Out of Workspace"
          className="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
