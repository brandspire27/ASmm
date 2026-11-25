export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agency_members: {
        Row: { user_id: string; email: string; created_at: string }
        Insert: { user_id: string; email: string; created_at?: string }
        Update: { user_id?: string; email?: string; created_at?: string }
        Relationships: []
      }
      agency_settings: {
        Row: { id: number; providers: Json; updated_at: string }
        Insert: { id?: number; providers: Json; updated_at?: string }
        Update: { id?: number; providers?: Json; updated_at?: string }
        Relationships: []
      }
      brand_assets: {
        Row: {
          id: string
          workspace_id: string
          client_id: string
          name: string
          type: "logo" | "product" | "banner" | "other"
          url: string | null
          storage_path: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id: string
          name: string
          type: "logo" | "product" | "banner" | "other"
          url?: string | null
          storage_path?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string
          name?: string
          type?: "logo" | "product" | "banner" | "other"
          url?: string | null
          storage_path?: string | null
          uploaded_at?: string
        }
        Relationships: []
      }
      brand_profiles: {
        Row: {
          id: string
          workspace_id: string
          name: string
          industry: string
          website_url: string | null
          company_description: string
          target_audience: string
          brand_voice: string
          brand_colors: string[]
          logo_storage_path: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          industry?: string
          website_url?: string | null
          company_description?: string
          target_audience?: string
          brand_voice?: string
          brand_colors?: string[]
          logo_storage_path?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          industry?: string
          website_url?: string | null
          company_description?: string
          target_audience?: string
          brand_voice?: string
          brand_colors?: string[]
          logo_storage_path?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_analytics: {
        Row: {
          id: string
          workspace_id: string
          client_id: string
          campaign_name: string
          impressions: number
          clicks: number
          conversions: number
          spend: number
          ctr: number
          conversion_rate: number
          status: "active" | "completed" | "paused"
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id: string
          campaign_name: string
          impressions?: number
          clicks?: number
          conversions?: number
          spend?: number
          ctr?: number
          conversion_rate?: number
          status?: "active" | "completed" | "paused"
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string
          campaign_name?: string
          impressions?: number
          clicks?: number
          conversions?: number
          spend?: number
          ctr?: number
          conversion_rate?: number
          status?: "active" | "completed" | "paused"
          created_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          workspace_id: string
          name: string
          company_description: string
          target_audience: string
          brand_colors: string[]
          logo_url: string | null
          logo_storage_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          company_description: string
          target_audience: string
          brand_colors?: string[]
          logo_url?: string | null
          logo_storage_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          company_description?: string
          target_audience?: string
          brand_colors?: string[]
          logo_url?: string | null
          logo_storage_path?: string | null
          created_at?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          id: string
          workspace_id: string
          client_id: string
          client_name: string
          type: "strategy" | "caption" | "hashtag" | "ad_script" | "thumbnail" | "video"
          title: string
          content: string
          meta: Json
          status: "draft" | "approved" | "rejected" | "published"
          provider_used: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id: string
          client_name: string
          type: "strategy" | "caption" | "hashtag" | "ad_script" | "thumbnail" | "video"
          title: string
          content: string
          meta?: Json
          status?: "draft" | "approved" | "rejected" | "published"
          provider_used: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string
          client_name?: string
          type?: "strategy" | "caption" | "hashtag" | "ad_script" | "thumbnail" | "video"
          title?: string
          content?: string
          meta?: Json
          status?: "draft" | "approved" | "rejected" | "published"
          provider_used?: string
          created_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          owner_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_memberships: {
        Row: {
          organization_id: string
          user_id: string
          role_key: string
          status: "active" | "suspended"
          invited_by: string | null
          created_at: string
        }
        Insert: {
          organization_id: string
          user_id: string
          role_key: string
          status?: "active" | "suspended"
          invited_by?: string | null
          created_at?: string
        }
        Update: {
          organization_id?: string
          user_id?: string
          role_key?: string
          status?: "active" | "suspended"
          invited_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: { permission_key: string; scope: "organization" | "workspace"; description: string }
        Insert: { permission_key: string; scope: "organization" | "workspace"; description?: string }
        Update: { permission_key?: string; scope?: "organization" | "workspace"; description?: string }
        Relationships: []
      }
      role_permissions: {
        Row: { role_key: string; permission_key: string }
        Insert: { role_key: string; permission_key: string }
        Update: { role_key?: string; permission_key?: string }
        Relationships: []
      }
      roles: {
        Row: {
          role_key: string
          name: string
          scope: "organization" | "workspace"
          description: string
        }
        Insert: {
          role_key: string
          name: string
          scope: "organization" | "workspace"
          description?: string
        }
        Update: {
          role_key?: string
          name?: string
          scope?: "organization" | "workspace"
          description?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          user_id: string
          email: string
          display_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          id: string
          workspace_id: string
          email: string
          role_key: string
          invited_by: string
          status: "pending" | "accepted" | "revoked"
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          role_key: string
          invited_by: string
          status?: "pending" | "accepted" | "revoked"
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          email?: string
          role_key?: string
          invited_by?: string
          status?: "pending" | "accepted" | "revoked"
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          timezone: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          timezone?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          timezone?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_memberships: {
        Row: {
          workspace_id: string
          user_id: string
          role_key: string
          status: "active" | "suspended"
          invited_by: string | null
          created_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role_key: string
          status?: "active" | "suspended"
          invited_by?: string | null
          created_at?: string
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role_key?: string
          status?: "active" | "suspended"
          invited_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      workspace_settings: {
        Row: {
          workspace_id: string
          providers: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          workspace_id: string
          providers?: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          workspace_id?: string
          providers?: Json
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_organization: {
        Args: { p_organization_name: string; p_workspace_name?: string }
        Returns: Array<{ organization_id: string; workspace_id: string }>
      }
      create_workspace: {
        Args: { p_organization_id: string; p_workspace_name: string; p_timezone?: string }
        Returns: string
      }
      accept_my_workspace_invitations: {
        Args: Record<string, never>
        Returns: number
      }
      get_my_workspaces: {
        Args: Record<string, never>
        Returns: Array<{
          workspace_id: string
          organization_id: string
          organization_name: string
          workspace_name: string
          role_key: string
        }>
      }
      has_organization_permission: {
        Args: { target_organization_id: string; required_permission: string }
        Returns: boolean
      }
      has_workspace_permission: {
        Args: { target_workspace_id: string; required_permission: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
