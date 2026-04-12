export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      memberships: {
        Row: { created_at: string; project_id: string; role: string; user_id: string }
        Insert: { created_at?: string; project_id: string; role?: string; user_id: string }
        Update: { created_at?: string; project_id?: string; role?: string; user_id?: string }
      }
      profiles: {
        Row: { created_at: string; display_name: string | null; email: string | null; id: string; theme: string }
        Insert: { created_at?: string; display_name?: string | null; email?: string | null; id: string; theme?: string }
        Update: { created_at?: string; display_name?: string | null; email?: string | null; id?: string; theme?: string }
      }
      projects: {
        Row: { created_at: string; id: string; name: string; schema_name: string; slug: string }
        Insert: { created_at?: string; id?: string; name: string; schema_name: string; slug: string }
        Update: { created_at?: string; id?: string; name?: string; schema_name?: string; slug?: string }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
  app_wee_v1: {
    Tables: {
      media_library: {
        Row: {
          id: string
          title: string
          description: string | null
          tags: string[]
          file_type: 'image' | 'gif' | 'video'
          mime_type: string
          file_size: number
          width: number | null
          height: number | null
          duration_ms: number | null
          file_url: string
          thumbnail_url: string | null
          preview_url: string | null
          downloads: number
          views: number
          is_featured: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
          created_by_session_id: string | null
          created_by_user_id: string | null
          moderation_status: 'none' | 'flagged' | 'reviewed' | 'removed'
          moderation_notes: string | null
          moderated_at: string | null
          moderated_by_user_id: string | null
        }
        Insert: Partial<Database['app_wee_v1']['Tables']['media_library']['Row']> & Pick<Database['app_wee_v1']['Tables']['media_library']['Row'], 'title' | 'file_type' | 'mime_type' | 'file_size' | 'file_url'>
        Update: Partial<Database['app_wee_v1']['Tables']['media_library']['Row']>
      }
      presets: {
        Row: {
          id: string
          name: string
          description: string | null
          tags: string[]
          settings_config: Json
          wallpaper_url: string | null
          wallpaper_file_size: number | null
          wallpaper_mime_type: string | null
          display_image_id: string | null
          display_image_url: string | null
          display_image_size: number | null
          display_image_mime_type: string | null
          downloads: number
          views: number
          is_featured: boolean
          is_public: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
          created_by_session_id: string | null
          created_by_user_id: string | null
          version: number
          parent_preset_id: string | null
          moderation_status: 'none' | 'flagged' | 'reviewed' | 'removed'
          moderation_notes: string | null
          moderated_at: string | null
          moderated_by_user_id: string | null
        }
        Insert: Partial<Database['app_wee_v1']['Tables']['presets']['Row']> & Pick<Database['app_wee_v1']['Tables']['presets']['Row'], 'name' | 'settings_config'>
        Update: Partial<Database['app_wee_v1']['Tables']['presets']['Row']>
      }
      user_sessions: {
        Row: {
          id: string
          session_token: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
          last_activity: string
          is_active: boolean
          user_id: string | null
        }
        Insert: Partial<Database['app_wee_v1']['Tables']['user_sessions']['Row']> & Pick<Database['app_wee_v1']['Tables']['user_sessions']['Row'], 'session_token'>
        Update: Partial<Database['app_wee_v1']['Tables']['user_sessions']['Row']>
      }
      preset_downloads: {
        Row: {
          id: string
          preset_id: string
          session_id: string | null
          user_id: string | null
          downloaded_at: string
          ip_address: string | null
        }
        Insert: Partial<Database['app_wee_v1']['Tables']['preset_downloads']['Row']> & Pick<Database['app_wee_v1']['Tables']['preset_downloads']['Row'], 'preset_id'>
        Update: Partial<Database['app_wee_v1']['Tables']['preset_downloads']['Row']>
      }
      media_downloads: {
        Row: {
          id: string
          media_id: string
          session_id: string | null
          user_id: string | null
          downloaded_at: string
          ip_address: string | null
        }
        Insert: Partial<Database['app_wee_v1']['Tables']['media_downloads']['Row']> & Pick<Database['app_wee_v1']['Tables']['media_downloads']['Row'], 'media_id'>
        Update: Partial<Database['app_wee_v1']['Tables']['media_downloads']['Row']>
      }
      community_reports: {
        Row: {
          id: string
          entity_type: 'preset' | 'media'
          entity_id: string
          reason: string
          details: string | null
          status: 'open' | 'reviewed' | 'dismissed' | 'actioned'
          created_by_session_id: string | null
          created_by_user_id: string | null
          created_at: string
          resolved_at: string | null
          resolved_by_user_id: string | null
        }
        Insert: Partial<Database['app_wee_v1']['Tables']['community_reports']['Row']> &
          Pick<Database['app_wee_v1']['Tables']['community_reports']['Row'], 'entity_type' | 'entity_id' | 'reason'>
        Update: Partial<Database['app_wee_v1']['Tables']['community_reports']['Row']>
      }
    }
    Views: {
      featured_media: { Row: Record<string, Json> }
      featured_presets: { Row: Record<string, Json> }
      popular_media: { Row: Record<string, Json> }
      popular_presets: { Row: Record<string, Json> }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
