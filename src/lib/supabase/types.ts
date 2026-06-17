// TypeScript types for the live `vorrat` schema of the shared Supabase project.
//
// NOTE: `supabase gen types --schema vorrat` / the Supabase MCP type generator only
// emit the `public` schema (which hosts an UNRELATED intelligence system this app must
// never touch). These types are therefore maintained by hand to mirror the live
// `vorrat` schema exactly (verified against the database, see docs/SCHEMA.sql). Keep
// them in sync if the schema ever changes via a new migration under supabase/migrations/.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  vorrat: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          id: string
          name: string
          category_id: string | null
          unit: string
          barcode: string | null
          target_stock: number
          notes: string | null
          // v2 packaging + reach:
          pack_size: number
          base_unit: string | null
          daily_use_per_person: number | null
          is_asset: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id?: string | null
          unit?: string
          barcode?: string | null
          target_stock?: number
          notes?: string | null
          pack_size?: number
          base_unit?: string | null
          daily_use_per_person?: number | null
          is_asset?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string | null
          unit?: string
          barcode?: string | null
          target_stock?: number
          notes?: string | null
          pack_size?: number
          base_unit?: string | null
          daily_use_per_person?: number | null
          is_asset?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      stock_entries: {
        Row: {
          id: string
          item_id: string
          quantity: number
          expiry_date: string | null
          location: string | null
          opened: boolean
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          quantity: number
          expiry_date?: string | null
          location?: string | null
          opened?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          quantity?: number
          expiry_date?: string | null
          location?: string | null
          opened?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stock_entries_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
        ]
      }
      consumption_log: {
        Row: {
          id: string
          item_id: string
          quantity: number
          consumed_at: string
        }
        Insert: {
          id?: string
          item_id: string
          quantity: number
          consumed_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          quantity?: number
          consumed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'consumption_log_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
        ]
      }
      settings: {
        Row: {
          id: number
          household_size: number
          updated_at: string
        }
        Insert: {
          id?: number
          household_size?: number
          updated_at?: string
        }
        Update: {
          id?: number
          household_size?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      // security_invoker view: current stock + status per item.
      // View columns are typed nullable (Postgres cannot prove non-null on a view);
      // the data layer normalizes them into a clean domain type.
      item_overview: {
        Row: {
          id: string | null
          name: string | null
          category_id: string | null
          unit: string | null
          target_stock: number | null
          pack_size: number | null
          base_unit: string | null
          daily_use_per_person: number | null
          is_asset: boolean | null
          current_stock: number | null
          base_stock: number | null
          next_expiry: string | null
          to_buy: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type VorratSchema = Database['vorrat']

export type Tables<T extends keyof VorratSchema['Tables']> =
  VorratSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof VorratSchema['Tables']> =
  VorratSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof VorratSchema['Tables']> =
  VorratSchema['Tables'][T]['Update']
export type ViewRow<T extends keyof VorratSchema['Views']> =
  VorratSchema['Views'][T]['Row']

// Convenience domain aliases used across the app.
export type Category = Tables<'categories'>
export type Item = Tables<'items'>
export type StockEntry = Tables<'stock_entries'>
export type ConsumptionLog = Tables<'consumption_log'>
export type Settings = Tables<'settings'>
export type ItemInsert = TablesInsert<'items'>
export type ItemUpdate = TablesUpdate<'items'>
export type StockEntryInsert = TablesInsert<'stock_entries'>
export type ConsumptionLogInsert = TablesInsert<'consumption_log'>
export type ItemOverviewRow = ViewRow<'item_overview'>
