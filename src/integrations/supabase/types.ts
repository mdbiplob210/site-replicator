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
      api_keys: {
        Row: {
          api_first_key: string | null
          api_key: string
          api_second_key: string | null
          created_at: string
          id: string
          is_active: boolean
          label: string
          last_synced_at: string | null
          last_used_at: string | null
          permissions: string[]
          source_url: string | null
          updated_at: string
        }
        Insert: {
          api_first_key?: string | null
          api_key?: string
          api_second_key?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          last_synced_at?: string | null
          last_used_at?: string | null
          permissions?: string[]
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          api_first_key?: string | null
          api_key?: string
          api_second_key?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          last_synced_at?: string | null
          last_used_at?: string | null
          permissions?: string[]
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          id: string
          ip_address: string
          reason: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          ip_address: string
          reason?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          ip_address?: string
          reason?: string | null
        }
        Relationships: []
      }
      blocked_phones: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          id: string
          phone_number: string
          reason: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          phone_number: string
          reason?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          phone_number?: string
          reason?: string | null
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
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          min_order_amount: number
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          min_order_amount?: number
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          min_order_amount?: number
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      courier_orders: {
        Row: {
          consignment_id: string | null
          courier_provider_id: string
          courier_response: Json | null
          courier_status: string
          id: string
          order_id: string
          submitted_at: string
          tracking_id: string | null
          updated_at: string
        }
        Insert: {
          consignment_id?: string | null
          courier_provider_id: string
          courier_response?: Json | null
          courier_status?: string
          id?: string
          order_id: string
          submitted_at?: string
          tracking_id?: string | null
          updated_at?: string
        }
        Update: {
          consignment_id?: string | null
          courier_provider_id?: string
          courier_response?: Json | null
          courier_status?: string
          id?: string
          order_id?: string
          submitted_at?: string
          tracking_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_orders_courier_provider_id_fkey"
            columns: ["courier_provider_id"]
            isOneToOne: false
            referencedRelation: "courier_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_providers: {
        Row: {
          api_configs: Json
          auth_token: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          api_configs?: Json
          auth_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          api_configs?: Json
          auth_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      courier_webhook_logs: {
        Row: {
          courier_slug: string
          created_at: string
          id: string
          payload: Json
          processed: boolean
        }
        Insert: {
          courier_slug: string
          created_at?: string
          id?: string
          payload: Json
          processed?: boolean
        }
        Update: {
          courier_slug?: string
          created_at?: string
          id?: string
          payload?: Json
          processed?: boolean
        }
        Relationships: []
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
      finance_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
        }
        Relationships: []
      }
      fraud_settings: {
        Row: {
          block_popup_message: string
          delivery_ratio_enabled: boolean
          device_fingerprint_enabled: boolean
          id: string
          min_delivery_ratio: number
          protection_enabled: boolean
          repeat_block_duration: string
          updated_at: string
        }
        Insert: {
          block_popup_message?: string
          delivery_ratio_enabled?: boolean
          device_fingerprint_enabled?: boolean
          id?: string
          min_delivery_ratio?: number
          protection_enabled?: boolean
          repeat_block_duration?: string
          updated_at?: string
        }
        Update: {
          block_popup_message?: string
          delivery_ratio_enabled?: boolean
          device_fingerprint_enabled?: boolean
          id?: string
          min_delivery_ratio?: number
          protection_enabled?: boolean
          repeat_block_duration?: string
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
      internal_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          cod_amount: number
          courier_provider_id: string | null
          courier_tracking_id: string | null
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string | null
          delivery_charge: number
          delivery_date: string | null
          discount: number
          id: string
          invoice_number: string
          items: Json | null
          notes: string | null
          order_id: string
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          cod_amount?: number
          courier_provider_id?: string | null
          courier_tracking_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_charge?: number
          delivery_date?: string | null
          discount?: number
          id?: string
          invoice_number: string
          items?: Json | null
          notes?: string | null
          order_id: string
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          cod_amount?: number
          courier_provider_id?: string | null
          courier_tracking_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_charge?: number
          delivery_date?: string | null
          discount?: number
          id?: string
          invoice_number?: string
          items?: Json | null
          notes?: string | null
          order_id?: string
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_courier_provider_id_fkey"
            columns: ["courier_provider_id"]
            isOneToOne: false
            referencedRelation: "courier_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      landing_page_images: {
        Row: {
          created_at: string
          file_name: string
          id: string
          image_url: string
          landing_page_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          file_name?: string
          id?: string
          image_url: string
          landing_page_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          image_url?: string
          landing_page_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_images_landing_page_id_fkey"
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
          exit_popup_discount: number
          exit_popup_enabled: boolean
          exit_popup_message: string
          exit_popup_timer: number
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
          exit_popup_discount?: number
          exit_popup_enabled?: boolean
          exit_popup_message?: string
          exit_popup_timer?: number
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
          exit_popup_discount?: number
          exit_popup_enabled?: boolean
          exit_popup_message?: string
          exit_popup_timer?: number
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
      login_activity: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          email: string | null
          fail_reason: string | null
          id: string
          ip_address: string | null
          os: string | null
          status: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          email?: string | null
          fail_reason?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          status?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          email?: string | null
          fail_reason?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string | null
          id: string
          ip_address: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email?: string | null
          id?: string
          ip_address: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string | null
          id?: string
          ip_address?: string
          success?: boolean
        }
        Relationships: []
      }
      meta_ads: {
        Row: {
          ad_account_id: string
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
          ad_account_id?: string
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
          ad_account_id?: string
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
          ad_account_id: string
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
          ad_account_id?: string
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
          ad_account_id?: string
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
          ad_account_id: string
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
          ad_account_id?: string
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
          ad_account_id?: string
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          order_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          order_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          order_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_activity_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      order_sources: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cancel_reason: string | null
          client_ip: string | null
          courier_note: string | null
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string | null
          delivery_charge: number
          device_info: string | null
          discount: number
          hold_until: string | null
          id: string
          memo_printed: boolean
          notes: string | null
          order_number: string
          payment_status: string
          product_cost: number
          source: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          cancel_reason?: string | null
          client_ip?: string | null
          courier_note?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_charge?: number
          device_info?: string | null
          discount?: number
          hold_until?: string | null
          id?: string
          memo_printed?: boolean
          notes?: string | null
          order_number: string
          payment_status?: string
          product_cost?: number
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          cancel_reason?: string | null
          client_ip?: string | null
          courier_note?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_charge?: number
          device_info?: string | null
          discount?: number
          hold_until?: string | null
          id?: string
          memo_printed?: boolean
          notes?: string | null
          order_number?: string
          payment_status?: string
          product_cost?: number
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      product_purchase_items: {
        Row: {
          created_at: string
          finance_record_id: string | null
          id: string
          product_code: string
          product_id: string | null
          product_name: string
          purchase_price: number
          quantity: number
          total_amount: number
        }
        Insert: {
          created_at?: string
          finance_record_id?: string | null
          id?: string
          product_code?: string
          product_id?: string | null
          product_name: string
          purchase_price?: number
          quantity?: number
          total_amount?: number
        }
        Update: {
          created_at?: string
          finance_record_id?: string | null
          id?: string
          product_code?: string
          product_id?: string | null
          product_name?: string
          purchase_price?: number
          quantity?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_purchase_items_finance_record_id_fkey"
            columns: ["finance_record_id"]
            isOneToOne: false
            referencedRelation: "finance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string | null
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          review_text: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          is_approved?: boolean
          product_id: string
          rating?: number
          review_text?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          price_adjustment: number
          product_id: string
          sku: string | null
          sort_order: number
          stock_quantity: number
          variant_name: string
          variant_value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          price_adjustment?: number
          product_id: string
          sku?: string | null
          sort_order?: number
          stock_quantity?: number
          variant_name?: string
          variant_value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          price_adjustment?: number
          product_id?: string
          sku?: string | null
          sort_order?: number
          stock_quantity?: number
          variant_name?: string
          variant_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
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
          low_stock_threshold: number
          main_image_url: string | null
          name: string
          original_price: number
          product_code: string
          purchase_price: number
          reorder_point: number
          selling_price: number
          short_description: string | null
          slug: string | null
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
          low_stock_threshold?: number
          main_image_url?: string | null
          name: string
          original_price?: number
          product_code: string
          purchase_price?: number
          reorder_point?: number
          selling_price?: number
          short_description?: string | null
          slug?: string | null
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
          low_stock_threshold?: number
          main_image_url?: string | null
          name?: string
          original_price?: number
          product_code?: string
          purchase_price?: number
          reorder_point?: number
          selling_price?: number
          short_description?: string | null
          slug?: string | null
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
      site_settings: {
        Row: {
          id: string
          is_public: boolean
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      stock_audit_items: {
        Row: {
          audit_id: string
          created_at: string
          id: string
          notes: string | null
          physical_stock: number
          product_code: string
          product_id: string
          product_name: string
          system_stock: number
          variance: number
        }
        Insert: {
          audit_id: string
          created_at?: string
          id?: string
          notes?: string | null
          physical_stock?: number
          product_code?: string
          product_id: string
          product_name: string
          system_stock?: number
          variance?: number
        }
        Update: {
          audit_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          physical_stock?: number
          product_code?: string
          product_id?: string
          product_name?: string
          system_stock?: number
          variance?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_audit_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "stock_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_audit_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_audit_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_audits: {
        Row: {
          audit_date: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          matched_items: number
          notes: string | null
          status: string
          total_items: number
          variance_items: number
        }
        Insert: {
          audit_date?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          matched_items?: number
          notes?: string | null
          status?: string
          total_items?: number
          variance_items?: number
        }
        Update: {
          audit_date?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          matched_items?: number
          notes?: string | null
          status?: string
          total_items?: number
          variance_items?: number
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          new_stock: number
          notes: string | null
          previous_stock: number
          product_id: string
          product_name: string
          quantity: number
          reference_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          product_id: string
          product_name: string
          quantity: number
          reference_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          product_id?: string
          product_name?: string
          quantity?: number
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          total_purchases: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          total_purchases?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          total_purchases?: number
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          deadline: string | null
          deleted_at: string | null
          description: string | null
          frequency: string
          id: string
          priority: string
          status: string
          task_date: string | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          deleted_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          priority?: string
          status?: string
          task_date?: string | null
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          deleted_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          priority?: string
          status?: string
          task_date?: string | null
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          current_page: string | null
          device_info: string | null
          id: string
          ip_address: string | null
          is_online: boolean | null
          last_seen_at: string
          user_id: string
        }
        Insert: {
          current_page?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_online?: boolean | null
          last_seen_at?: string
          user_id: string
        }
        Update: {
          current_page?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_online?: boolean | null
          last_seen_at?: string
          user_id?: string
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
      website_events: {
        Row: {
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          page_path: string
          page_title: string | null
          product_code: string | null
          product_id: string | null
          product_name: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          page_path: string
          page_title?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          page_path?: string
          page_title?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_auto_replies: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          match_type: string | null
          reply_message: string
          trigger_keyword: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_type?: string | null
          reply_message: string
          trigger_keyword: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_type?: string | null
          reply_message?: string
          trigger_keyword?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          id: string
          last_message: string | null
          last_message_at: string | null
          status: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          media_url: string | null
          message_type: string | null
          sent_by: string | null
          status: string | null
          wa_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          direction?: string
          id?: string
          media_url?: string | null
          message_type?: string | null
          sent_by?: string | null
          status?: string | null
          wa_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          media_url?: string | null
          message_type?: string | null
          sent_by?: string | null
          status?: string | null
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          api_provider: string | null
          api_token: string | null
          business_account_id: string | null
          created_at: string | null
          id: string
          is_connected: boolean | null
          phone_number_id: string | null
          updated_at: string | null
          webhook_verify_token: string | null
        }
        Insert: {
          api_provider?: string | null
          api_token?: string | null
          business_account_id?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          phone_number_id?: string | null
          updated_at?: string | null
          webhook_verify_token?: string | null
        }
        Update: {
          api_provider?: string | null
          api_token?: string | null
          business_account_id?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          phone_number_id?: string | null
          updated_at?: string | null
          webhook_verify_token?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_transfer_logs: {
        Row: {
          conversation_id: string
          created_at: string | null
          from_user_id: string | null
          id: string
          notes: string | null
          to_user_id: string
          transferred_by: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          notes?: string | null
          to_user_id: string
          transferred_by?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          notes?: string | null
          to_user_id?: string
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_transfer_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      products_public: {
        Row: {
          additional_images: string[] | null
          allow_out_of_stock_orders: boolean | null
          category_id: string | null
          created_at: string | null
          detailed_description: string | null
          free_delivery: boolean | null
          id: string | null
          main_image_url: string | null
          name: string | null
          original_price: number | null
          product_code: string | null
          selling_price: number | null
          short_description: string | null
          slug: string | null
          status: string | null
          stock_quantity: number | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          additional_images?: string[] | null
          allow_out_of_stock_orders?: boolean | null
          category_id?: string | null
          created_at?: string | null
          detailed_description?: string | null
          free_delivery?: boolean | null
          id?: string | null
          main_image_url?: string | null
          name?: string | null
          original_price?: number | null
          product_code?: string | null
          selling_price?: number | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          additional_images?: string[] | null
          allow_out_of_stock_orders?: boolean | null
          category_id?: string | null
          created_at?: string | null
          detailed_description?: string | null
          free_delivery?: boolean | null
          id?: string | null
          main_image_url?: string | null
          name?: string | null
          original_price?: number | null
          product_code?: string | null
          selling_price?: number | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
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
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
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
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "manager"
        | "accounting"
        | "ad_analytics"
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
        | "create_products"
        | "delete_products"
        | "manage_website"
        | "manage_landing_pages"
        | "manage_courier"
        | "manage_meta_ads"
        | "manage_banners"
        | "manage_backup"
        | "manage_automation"
        | "view_dashboard"
        | "manage_categories"
        | "create_users"
        | "create_admin_users"
        | "create_moderator_users"
        | "create_basic_users"
        | "print_memo"
        | "transfer_orders"
        | "manage_whatsapp"
      order_status:
        | "processing"
        | "confirmed"
        | "inquiry"
        | "cancelled"
        | "on_hold"
        | "ship_later"
        | "in_courier"
        | "delivered"
        | "returned"
        | "pending_return"
        | "hand_delivery"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "manager",
        "accounting",
        "ad_analytics",
      ],
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
        "create_products",
        "delete_products",
        "manage_website",
        "manage_landing_pages",
        "manage_courier",
        "manage_meta_ads",
        "manage_banners",
        "manage_backup",
        "manage_automation",
        "view_dashboard",
        "manage_categories",
        "create_users",
        "create_admin_users",
        "create_moderator_users",
        "create_basic_users",
        "print_memo",
        "transfer_orders",
        "manage_whatsapp",
      ],
      order_status: [
        "processing",
        "confirmed",
        "inquiry",
        "cancelled",
        "on_hold",
        "ship_later",
        "in_courier",
        "delivered",
        "returned",
        "pending_return",
        "hand_delivery",
      ],
    },
  },
} as const
