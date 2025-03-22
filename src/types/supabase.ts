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
      agencies: {
        Row: {
          id: string
          name: string
          gtfs_id: string
          feed_id: string
          last_check: string
          is_available: boolean
          error_message: string | null
        }
        Insert: {
          id: string
          name: string
          gtfs_id: string
          feed_id: string
          last_check?: string
          is_available?: boolean
          error_message?: string | null
        }
        Update: {
          id?: string
          name?: string
          gtfs_id?: string
          feed_id?: string
          last_check?: string
          is_available?: boolean
          error_message?: string | null
        }
      }
      agency_transport_modes: {
        Row: {
          id: string
          agency_id: string
          mode: string
          route_count: number
          check_time: string
        }
        Insert: {
          id?: string
          agency_id: string
          mode: string
          route_count: number
          check_time?: string
        }
        Update: {
          id?: string
          agency_id?: string
          mode?: string
          route_count?: number
          check_time?: string
        }
      }
      agency_mappings: {
        Row: {
          id: string
          agency_id: string
          display_name: string | null
          network_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          display_name?: string | null
          network_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          display_name?: string | null
          network_name?: string | null
          updated_at?: string
        }
      }
      network_mapping: {
        Row: {
          id: number
          agency_name: string
          agency_displayname: string | null
          region_id: string
          feed_id: string
          feed_filter: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          agency_name: string
          agency_displayname?: string | null
          region_id: string
          feed_id: string
          feed_filter?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          agency_name?: string
          agency_displayname?: string | null
          region_id?: string
          feed_id?: string
          feed_filter?: Json | null
          is_active?: boolean
          updated_at?: string
        }
      }
      network_status: {
        Row: {
          id: number
          network_id: number
          check_time: string
          is_available: boolean
          error_message: string | null
        }
        Insert: {
          id?: never
          network_id: number
          check_time?: string
          is_available: boolean
          error_message?: string | null
        }
        Update: {
          id?: never
          network_id?: number
          check_time?: string
          is_available?: boolean
          error_message?: string | null
        }
      }
      network_transport_modes: {
        Row: {
          id: string
          network_id: number
          mode: string
          route_count: number
          check_time: string
        }
        Insert: {
          id?: string
          network_id: number
          mode: string
          route_count: number
          check_time?: string
        }
        Update: {
          id?: string
          network_id?: number
          mode?: string
          route_count?: number
          check_time?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}