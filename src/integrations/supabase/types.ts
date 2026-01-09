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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      market_mappings: {
        Row: {
          created_at: string | null
          id: string
          manual_verified: boolean | null
          market_id_platform1: string
          market_id_platform2: string
          platform1: string | null
          platform2: string | null
          similarity_score: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          manual_verified?: boolean | null
          market_id_platform1: string
          market_id_platform2: string
          platform1?: string | null
          platform2?: string | null
          similarity_score: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          manual_verified?: boolean | null
          market_id_platform1?: string
          market_id_platform2?: string
          platform1?: string | null
          platform2?: string | null
          similarity_score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_mappings_market_a_id_fkey"
            columns: ["market_id_platform1"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_mappings_market_b_id_fkey"
            columns: ["market_id_platform2"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          category: Database["public"]["Enums"]["market_category"]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          platform: string
          resolution_date: string | null
          slug: string
          status: Database["public"]["Enums"]["market_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["market_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          resolution_date?: string | null
          slug: string
          status?: Database["public"]["Enums"]["market_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["market_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          resolution_date?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["market_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          created_at: string
          id: string
          market_id: string
          no_price: number
          platform: Database["public"]["Enums"]["platform"]
          recorded_at: string
          total_volume: number | null
          volume_24h: number | null
          yes_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          market_id: string
          no_price: number
          platform: Database["public"]["Enums"]["platform"]
          recorded_at?: string
          total_volume?: number | null
          volume_24h?: number | null
          yes_price: number
        }
        Update: {
          created_at?: string
          id?: string
          market_id?: string
          no_price?: number
          platform?: Database["public"]["Enums"]["platform"]
          recorded_at?: string
          total_volume?: number | null
          volume_24h?: number | null
          yes_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "prices_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      spreads: {
        Row: {
          buy_platform: Database["public"]["Enums"]["platform"]
          buy_price: number
          created_at: string
          detected_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          market_id: string
          potential_profit: number | null
          sell_platform: Database["public"]["Enums"]["platform"]
          sell_price: number
          skew_percentage: number
        }
        Insert: {
          buy_platform: Database["public"]["Enums"]["platform"]
          buy_price: number
          created_at?: string
          detected_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          market_id: string
          potential_profit?: number | null
          sell_platform: Database["public"]["Enums"]["platform"]
          sell_price: number
          skew_percentage: number
        }
        Update: {
          buy_platform?: Database["public"]["Enums"]["platform"]
          buy_price?: number
          created_at?: string
          detected_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          market_id?: string
          potential_profit?: number | null
          sell_platform?: Database["public"]["Enums"]["platform"]
          sell_price?: number
          skew_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "spreads_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      whale_trades: {
        Row: {
          action: string
          amount: number
          created_at: string
          executed_at: string
          id: string
          market_id: string | null
          price: number | null
          side: string
          tx_hash: string | null
          wallet_id: string
        }
        Insert: {
          action: string
          amount: number
          created_at?: string
          executed_at?: string
          id?: string
          market_id?: string | null
          price?: number | null
          side: string
          tx_hash?: string | null
          wallet_id: string
        }
        Update: {
          action?: string
          amount?: number
          created_at?: string
          executed_at?: string
          id?: string
          market_id?: string | null
          price?: number | null
          side?: string
          tx_hash?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whale_trades_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whale_trades_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "whale_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      whale_wallets: {
        Row: {
          address: string
          chain: string
          created_at: string
          id: string
          is_tracked: boolean
          label: string | null
          last_active_at: string | null
          pnl_24h: number | null
          pnl_change: number | null
          total_pnl: number | null
          trade_count: number | null
          updated_at: string
          win_rate: number | null
        }
        Insert: {
          address: string
          chain?: string
          created_at?: string
          id?: string
          is_tracked?: boolean
          label?: string | null
          last_active_at?: string | null
          pnl_24h?: number | null
          pnl_change?: number | null
          total_pnl?: number | null
          trade_count?: number | null
          updated_at?: string
          win_rate?: number | null
        }
        Update: {
          address?: string
          chain?: string
          created_at?: string
          id?: string
          is_tracked?: boolean
          label?: string | null
          last_active_at?: string | null
          pnl_24h?: number | null
          pnl_change?: number | null
          total_pnl?: number | null
          trade_count?: number | null
          updated_at?: string
          win_rate?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      market_category: "crypto" | "politics" | "sports" | "economy" | "other"
      market_status: "active" | "resolved" | "suspended"
      platform:
        | "polymarket"
        | "kalshi"
        | "drift"
        | "other"
        | "azuro"
        | "pancakeswap"
        | "opinions"
        | "probable"
        | "divvybet"
        | "predictit"
        | "manifold"
        | "metaculus"
        | "futuur"
        | "betdex"
        | "monaco"
        | "thales"
        | "limitless"
        | "myriad"
        | "omen"
        | "augur"
        | "zeitgeist"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      market_category: ["crypto", "politics", "sports", "economy", "other"],
      market_status: ["active", "resolved", "suspended"],
      platform: [
        "polymarket",
        "kalshi",
        "drift",
        "other",
        "azuro",
        "pancakeswap",
        "opinions",
        "probable",
        "divvybet",
        "predictit",
        "manifold",
        "metaculus",
        "futuur",
        "betdex",
        "monaco",
        "thales",
        "limitless",
        "myriad",
        "omen",
        "augur",
        "zeitgeist",
      ],
    },
  },
} as const
