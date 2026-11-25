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
        Row: {
          user_id: string
          email: string
          created_at: string
        }
        Insert: {
          user_id: string
          email: string
          created_at?: string
        }
        Update: {
          user_id?: string
          email?: string
          created_at?: string
        }
        Relationships: []
      }
      agency_settings: {
        Row: {
          id: number
          providers: Json
          updated_at: string
        }
        Insert: {
          id?: number
          providers: Json
          updated_at?: string
        }
        Update: {
          id?: number
          providers?: Json
          updated_at?: string
        }
        Relationships: []
      }
      brand_assets: {
        Row: {
          id: string
          client_id: string
          name: string
          type: "logo" | "product" | "banner" | "other"
          url: string | null
          storage_path: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          type: "logo" | "product" | "banner" | "other"
          url?: string | null
          storage_path?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          type?: "logo" | "product" | "banner" | "other"
          url?: string | null
          storage_path?: string | null
          uploaded_at?: string
        }
        Relationships: []
      }
      campaign_analytics: {
        Row: {
          id: string
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
          client_id: string
          campaign_name: string
          impressions: number
          clicks: number
          conversions: number
          spend: number
          ctr: number
          conversion_rate: number
          status: "active" | "completed" | "paused"
          created_at?: string
        }
        Update: {
          id?: string
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
          name: string
          company_description: string
          target_audience: string
          brand_colors: string[]
          logo_url?: string | null
          logo_storage_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
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
    }
    Views: Record<string, never>
    Functions: {
      is_agency_member: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
