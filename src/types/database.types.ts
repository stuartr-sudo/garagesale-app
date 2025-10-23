export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      advertisements: {
        Row: {
          active: boolean | null
          business_id: string
          clicks: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          impressions: number | null
          link_url: string | null
          placement: string
          priority: number | null
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          business_id: string
          clicks?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          link_url?: string | null
          placement: string
          priority?: number | null
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          business_id?: string
          clicks?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          link_url?: string | null
          placement?: string
          priority?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"] | null
          condition: Database["public"]["Enums"]["item_condition"] | null
          created_at: string | null
          description: string | null
          id: string
          image_urls: string[] | null
          location: string | null
          price: number
          seller_id: string
          status: Database["public"]["Enums"]["item_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["item_category"] | null
          condition?: Database["public"]["Enums"]["item_condition"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          location?: string | null
          price?: number
          seller_id: string
          status?: Database["public"]["Enums"]["item_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"] | null
          condition?: Database["public"]["Enums"]["item_condition"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          location?: string | null
          price?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["item_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          buyer_contact_info: Json | null
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          item_id: string | null
          notes: string | null
          seller_id: string
          status: Database["public"]["Enums"]["transaction_status"] | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount: number
          buyer_contact_info?: Json | null
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["transaction_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount?: number
          buyer_contact_info?: Json | null
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["transaction_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // Additional tables truncated for brevity
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type: "individual" | "business"
      item_category:
        | "electronics"
        | "clothing"
        | "furniture"
        | "books"
        | "toys"
        | "sports"
        | "home_garden"
        | "automotive"
        | "collectibles"
        | "other"
      item_condition: "new" | "like_new" | "good" | "fair" | "poor"
      item_status: "active" | "sold" | "inactive" | "pending"
      trade_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "cancelled"
        | "completed"
      transaction_status: "pending" | "completed" | "cancelled" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

