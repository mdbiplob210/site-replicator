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
      ad_spends: {
        Row: {
          amount_bdt: number
          amount_usd: number
          created_at: string
          id: string
          platform: string
          spend_date: string
        }
        Insert: {
          amount_bdt?: number
          amount_usd?: number
          created_at?: string
          id?: string
          platform?: string
          spend_date?: string
        }
        Update: {
          amount_bdt?: number
          amount_usd?: number
          created_at?: string
          id?: string
          platform?: string
          spend_date?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_panels: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_orders: number
          panel_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_orders?: number
          panel_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_orders?: number
          panel_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["employee_permission"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["employee_permission"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["employee_permission"]
          user_id?: string
        }
        Relationships: []
      }
      finance_records: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string
          notes: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      incomplete_orders: {
        Row: {
          block_reason: string
          client_ip: string | null
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string | null
          delivery_charge: number | null
          device_info: string | null
          discount: number | null
          id: string
          landing_page_slug: string | null
          notes: string | null
          product_code: string | null
          product_name: string | null
          quantity: number | null
          status: string
          total_amount: number | null
          unit_price: number | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          block_reason?: string
          client_ip?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_charge?: number | null
          device_info?: string | null
          discount?: number | null
          id?: string
          landing_page_slug?: string | null
          notes?: string | null
          product_code?: string | null
          product_name?: string | null
          quantity?: number | null
          status?: string
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          block_reason?: string
          client_ip?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_charge?: number | null
          device_info?: string | null
          discount?: number | null
          id?: string
          landing_page_slug?: string | null
          notes?: string | null
          product_code?: string | null
          product_name?: string | null
          quantity?: number | null
          status?: string
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      landing_page_events: {
        Row: {
          created_at: string
          event_name: string | null
          event_type: string
          id: string
          landing_page_id: string
          referrer: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_name?: string | null
          event_type?: string
          id?: string
          landing_page_id: string
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string | null
          event_type?: string
          id?: string
          landing_page_id?: string
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_events_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          checkout_html: string | null
          created_at: string
          custom_head_scripts: string | null
          fb_pixel_id: string | null
          gtm_id: string | null
          html_content: string
          id: string
          is_active: boolean
          slug: string
          tiktok_pixel_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          checkout_html?: string | null
          created_at?: string
          custom_head_scripts?: string | null
          fb_pixel_id?: string | null
          gtm_id?: string | null
          html_content?: string
          id?: string
          is_active?: boolean
          slug: string
          tiktok_pixel_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          checkout_html?: string | null
          created_at?: string
          custom_head_scripts?: string | null
          fb_pixel_id?: string | null
          gtm_id?: string | null
          html_content?: string
          id?: string
          is_active?: boolean
          slug?: string
          tiktok_pixel_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      meta_ads: {
        Row: {
          adset_id: string
          clicks: number
          cost_per_result: number
          ctr: number
          date_preset: string
          id: string
          name: string
          purchases: number
          roas: number
          spend: number
          status: string
          synced_at: string
        }
        Insert: {
          adset_id: string
          clicks?: number
          cost_per_result?: number
          ctr?: number
          date_preset?: string
          id: string
          name: string
          purchases?: number
          roas?: number
          spend?: number
          status?: string
          synced_at?: string
        }
        Update: {
          adset_id?: string
          clicks?: number
          cost_per_result?: number
          ctr?: number
          date_preset?: string
          id?: string
          name?: string
          purchases?: number
          roas?: number
          spend?: number
          status?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_ads_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "meta_adsets"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_adsets: {
        Row: {
          audience: string | null
          campaign_id: string
          clicks: number
          cost_per_purchase: number
          ctr: number
          date_preset: string
          id: string
          name: string
          purchases: number
          roas: number
          spend: number
          status: string
          synced_at: string
        }
        Insert: {
          audience?: string | null
          campaign_id: string
          clicks?: number
          cost_per_purchase?: number
          ctr?: number
          date_preset?: string
          id: string
          name: string
          purchases?: number
          roas?: number
          spend?: number
          status?: string
          synced_at?: string
        }
        Update: {
          audience?: string | null
          campaign_id?: string
          clicks?: number
          cost_per_purchase?: number
          ctr?: number
          date_preset?: string
          id?: string
          name?: string
          purchases?: number
          roas?: number
          spend?: number
          status?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_adsets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "meta_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_campaigns: {
        Row: {
          clicks: number
          cost_per_purchase: number
          ctr: number
          daily_budget: number | null
          date_preset: string
          id: string
          impressions: number
          lifetime_budget: number | null
          name: string
          objective: string | null
          purchase_value: number
          purchases: number
          roas: number
          spend: number
          status: string
          synced_at: string
        }
        Insert: {
          clicks?: number
          cost_per_purchase?: number
          ctr?: number
          daily_budget?: number | null
          date_preset?: string
          id: string
          impressions?: number
          lifetime_budget?: number | null
          name: string
          objective?: string | null
          purchase_value?: number
          purchases?: number
          roas?: number
          spend?: number
          status?: string
          synced_at?: string
        }
        Update: {
          clicks?: number
          cost_per_purchase?: number
          ctr?: number
          daily_budget?: number | null
          date_preset?: string
          id?: string
          impressions?: number
          lifetime_budget?: number | null
          name?: string
          objective?: string | null
          purchase_value?: number
          purchases?: number
          roas?: number
          spend?: number
          status?: string
          synced_at?: string
        }
        Relationships: []
      }
      order_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assigned_to: string
          id: string
          notes: string | null
          order_id: string
          status: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_to: string
          id?: string
          notes?: string | null
          order_id: string
          status?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string
          id?: string
          notes?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_code: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_code?: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_ip: string | null
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string | null
          delivery_charge: number
          device_info: string | null
          discount: number
          id: string
          notes: string | null
          order_number: string
          product_cost: number
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          client_ip?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_charge?: number
          device_info?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_number: string
          product_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          client_ip?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_charge?: number
          device_info?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_number?: string
          product_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          additional_cost: number
          additional_images: string[] | null
          allow_out_of_stock_orders: boolean
          category_id: string | null
          created_at: string
          detailed_description: string | null
          free_delivery: boolean
          id: string
          internal_note: string | null
          main_image_url: string | null
          name: string
          original_price: number
          product_code: string
          purchase_price: number
          selling_price: number
          short_description: string | null
          status: string
          stock_quantity: number
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          additional_cost?: number
          additional_images?: string[] | null
          allow_out_of_stock_orders?: boolean
          category_id?: string | null
          created_at?: string
          detailed_description?: string | null
          free_delivery?: boolean
          id?: string
          internal_note?: string | null
          main_image_url?: string | null
          name: string
          original_price?: number
          product_code: string
          purchase_price?: number
          selling_price?: number
          short_description?: string | null
          status?: string
          stock_quantity?: number
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          additional_cost?: number
          additional_images?: string[] | null
          allow_out_of_stock_orders?: boolean
          category_id?: string | null
          created_at?: string
          detailed_description?: string | null
          free_delivery?: boolean
          id?: string
          internal_note?: string | null
          main_image_url?: string | null
          name?: string
          original_price?: number
          product_code?: string
          purchase_price?: number
          selling_price?: number
          short_description?: string | null
          status?: string
          stock_quantity?: number
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      screenshots: {
        Row: {
          created_at: string
          id: string
          image_url: string
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          title?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["employee_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      employee_permission:
        | "view_orders"
        | "edit_orders"
        | "delete_orders"
        | "change_order_status"
        | "create_orders"
        | "view_products"
        | "edit_products"
        | "view_finance"
        | "edit_finance"
        | "view_analytics"
        | "view_reports"
        | "manage_users"
        | "manage_settings"
      order_status:
        | "processing"
        | "confirmed"
        | "cancelled"
        | "on_hold"
        | "ship_later"
        | "in_courier"
        | "delivered"
        | "returned"
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
      app_role: ["admin", "moderator", "user"],
      employee_permission: [
        "view_orders",
        "edit_orders",
        "delete_orders",
        "change_order_status",
        "create_orders",
        "view_products",
        "edit_products",
        "view_finance",
        "edit_finance",
        "view_analytics",
        "view_reports",
        "manage_users",
        "manage_settings",
      ],
      order_status: [
        "processing",
        "confirmed",
        "cancelled",
        "on_hold",
        "ship_later",
        "in_courier",
        "delivered",
        "returned",
      ],
    },
  },
} as const
