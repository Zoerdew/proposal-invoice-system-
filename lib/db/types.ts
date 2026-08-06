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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      applications: {
        Row: {
          annual_turnover: string | null
          anything_else: string | null
          applicant_name: string
          biggest_opportunity: string | null
          budget_fit: string | null
          business_name: string | null
          client_id: string | null
          created_at: string
          data_history: string | null
          data_state: string | null
          email: string | null
          fit_notes_private: string | null
          id: string
          main_offers_pricing: string | null
          openness_to_evidence: string | null
          repeat_business: string | null
          slow_week_behaviour: string | null
          start_timing: string | null
          status: string | null
          submitted_at: string | null
          time_in_business: string | null
          tools_used: string[]
          top_revenue_offer: string | null
          updated_at: string
          website: string | null
          what_business_does: string | null
          what_theyre_after: string | null
          what_theyve_tried: string | null
          why_now: string | null
        }
        Insert: {
          annual_turnover?: string | null
          anything_else?: string | null
          applicant_name: string
          biggest_opportunity?: string | null
          budget_fit?: string | null
          business_name?: string | null
          client_id?: string | null
          created_at?: string
          data_history?: string | null
          data_state?: string | null
          email?: string | null
          fit_notes_private?: string | null
          id?: string
          main_offers_pricing?: string | null
          openness_to_evidence?: string | null
          repeat_business?: string | null
          slow_week_behaviour?: string | null
          start_timing?: string | null
          status?: string | null
          submitted_at?: string | null
          time_in_business?: string | null
          tools_used?: string[]
          top_revenue_offer?: string | null
          updated_at?: string
          website?: string | null
          what_business_does?: string | null
          what_theyre_after?: string | null
          what_theyve_tried?: string | null
          why_now?: string | null
        }
        Update: {
          annual_turnover?: string | null
          anything_else?: string | null
          applicant_name?: string
          biggest_opportunity?: string | null
          budget_fit?: string | null
          business_name?: string | null
          client_id?: string | null
          created_at?: string
          data_history?: string | null
          data_state?: string | null
          email?: string | null
          fit_notes_private?: string | null
          id?: string
          main_offers_pricing?: string | null
          openness_to_evidence?: string | null
          repeat_business?: string | null
          slow_week_behaviour?: string | null
          start_timing?: string | null
          status?: string | null
          submitted_at?: string | null
          time_in_business?: string | null
          tools_used?: string[]
          top_revenue_offer?: string | null
          updated_at?: string
          website?: string | null
          what_business_does?: string | null
          what_theyre_after?: string | null
          what_theyve_tried?: string | null
          why_now?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          client_id: string
          created_at: string
          date: string
          felt_like: string | null
          id: string
          notes: string | null
          qualitative_notes: string | null
          responded: boolean
          revenue_this_week: number | null
          updated_at: string
          your_response: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          date?: string
          felt_like?: string | null
          id?: string
          notes?: string | null
          qualitative_notes?: string | null
          responded?: boolean
          revenue_this_week?: number | null
          updated_at?: string
          your_response?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          felt_like?: string | null
          id?: string
          notes?: string | null
          qualitative_notes?: string | null
          responded?: boolean
          revenue_this_week?: number | null
          updated_at?: string
          your_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_offers: {
        Row: {
          client_id: string
          created_at: string
          delivery_hours: number | null
          id: string
          name: string
          price: number | null
          still_live: boolean
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          delivery_hours?: number | null
          id?: string
          name: string
          price?: number | null
          still_live?: boolean
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          delivery_hours?: number | null
          id?: string
          name?: string
          price?: number | null
          still_live?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_offers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          annual_turnover: number | null
          baseline_date: string | null
          baseline_monthly_revenue: number | null
          baseline_repeat_buyer_pct: number | null
          business_name: string | null
          commercial_objectives: string | null
          created_at: string
          email: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          onboarding_complete: boolean
          package_price: number | null
          payment_plan: string | null
          portal_token: string
          proposal_id: string | null
          start_date: string | null
          status: string | null
          target_figure: number | null
          updated_at: string
        }
        Insert: {
          annual_turnover?: number | null
          baseline_date?: string | null
          baseline_monthly_revenue?: number | null
          baseline_repeat_buyer_pct?: number | null
          business_name?: string | null
          commercial_objectives?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          onboarding_complete?: boolean
          package_price?: number | null
          payment_plan?: string | null
          portal_token: string
          proposal_id?: string | null
          start_date?: string | null
          status?: string | null
          target_figure?: number | null
          updated_at?: string
        }
        Update: {
          annual_turnover?: number | null
          baseline_date?: string | null
          baseline_monthly_revenue?: number | null
          baseline_repeat_buyer_pct?: number | null
          business_name?: string | null
          commercial_objectives?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          onboarding_complete?: boolean
          package_price?: number | null
          payment_plan?: string | null
          portal_token?: string
          proposal_id?: string | null
          start_date?: string | null
          status?: string | null
          target_figure?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          client_id: string
          created_at: string
          file_url: string | null
          id: string
          kind: string | null
          period_covered: string | null
          received_at: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          kind?: string | null
          period_covered?: string | null
          received_at?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          kind?: string | null
          period_covered?: string | null
          received_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          client_id: string
          created_at: string
          decided_at: string | null
          decision: string
          expected: string | null
          id: string
          outcome: string | null
          prompted_by_number: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          decided_at?: string | null
          decision: string
          expected?: string | null
          id?: string
          outcome?: string | null
          prompted_by_number?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          decided_at?: string | null
          decision?: string
          expected?: string | null
          id?: string
          outcome?: string | null
          prompted_by_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      findings: {
        Row: {
          client_id: string
          created_at: string
          date_found: string | null
          description: string | null
          id: string
          source: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          date_found?: string | null
          description?: string | null
          id?: string
          source?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          date_found?: string | null
          description?: string | null
          id?: string
          source?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "findings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          kind: string | null
          line_total: number | null
          proposal_id: string
          quantity: number
          selected: boolean
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          kind?: string | null
          line_total?: number | null
          proposal_id: string
          quantity?: number
          selected?: boolean
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          kind?: string | null
          line_total?: number | null
          proposal_id?: string
          quantity?: number
          selected?: boolean
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "line_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_readings: {
        Row: {
          created_at: string
          id: string
          metric_id: string
          read_at: string
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          metric_id: string
          read_at?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metric_id?: string
          read_at?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_readings_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          baseline: number | null
          client_id: string
          created_at: string
          definition: string | null
          id: string
          name: string
          target: number | null
          updated_at: string
        }
        Insert: {
          baseline?: number | null
          client_id: string
          created_at?: string
          definition?: string | null
          id?: string
          name: string
          target?: number | null
          updated_at?: string
        }
        Update: {
          baseline?: number | null
          client_id?: string
          created_at?: string
          definition?: string | null
          id?: string
          name?: string
          target?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          kind: string | null
          offer_id: string
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          kind?: string | null
          offer_id: string
          quantity?: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          kind?: string | null
          offer_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_line_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          default_contract_terms: string | null
          description: string | null
          id: string
          name: string
          payment_plan_options: string[]
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_contract_terms?: string | null
          description?: string | null
          id?: string
          name: string
          payment_plan_options?: string[]
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_contract_terms?: string | null
          description?: string | null
          id?: string
          name?: string
          payment_plan_options?: string[]
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      onboarding: {
        Row: {
          anything_else: string | null
          best_day_for_checkin: string | null
          best_email: string | null
          biggest_challenge_right_now: string | null
          client_id: string
          created_at: string
          definition_of_success: string | null
          id: string
          six_month_risk: string | null
          updated_at: string
          whats_generating_leads_now: string | null
          where_revenue_data_lives: string | null
          why_now: string | null
        }
        Insert: {
          anything_else?: string | null
          best_day_for_checkin?: string | null
          best_email?: string | null
          biggest_challenge_right_now?: string | null
          client_id: string
          created_at?: string
          definition_of_success?: string | null
          id?: string
          six_month_risk?: string | null
          updated_at?: string
          whats_generating_leads_now?: string | null
          where_revenue_data_lives?: string | null
          why_now?: string | null
        }
        Update: {
          anything_else?: string | null
          best_day_for_checkin?: string | null
          best_email?: string | null
          biggest_challenge_right_now?: string | null
          client_id?: string
          created_at?: string
          definition_of_success?: string | null
          id?: string
          six_month_risk?: string | null
          updated_at?: string
          whats_generating_leads_now?: string | null
          where_revenue_data_lives?: string | null
          why_now?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proof: {
        Row: {
          client_id: string
          created_at: string
          date_added: string | null
          id: string
          screenshot_url: string | null
          source: string | null
          text: string
          type: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_added?: string | null
          id?: string
          screenshot_url?: string | null
          source?: string | null
          text: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_added?: string | null
          id?: string
          screenshot_url?: string | null
          source?: string | null
          text?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_invoices: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string
          id: string
          proposal_id: string
          sequence: number
          updated_at: string
          xero_invoice_id: string | null
          xero_online_invoice_url: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          proposal_id: string
          sequence: number
          updated_at?: string
          xero_invoice_id?: string | null
          xero_online_invoice_url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          proposal_id?: string
          sequence?: number
          updated_at?: string
          xero_invoice_id?: string | null
          xero_online_invoice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_invoices_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          application_id: string | null
          client_email: string
          client_id: string | null
          client_name: string
          company: string | null
          contract_terms: string | null
          created_at: string
          date_signed: string | null
          deposit_amount: number | null
          id: string
          notes: string | null
          offer_id: string | null
          payment_plan: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          client_email: string
          client_id?: string | null
          client_name: string
          company?: string | null
          contract_terms?: string | null
          created_at?: string
          date_signed?: string | null
          deposit_amount?: number | null
          id?: string
          notes?: string | null
          offer_id?: string | null
          payment_plan?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          client_email?: string
          client_id?: string | null
          client_name?: string
          company?: string | null
          contract_terms?: string | null
          created_at?: string
          date_signed?: string | null
          deposit_amount?: number | null
          id?: string
          notes?: string | null
          offer_id?: string | null
          payment_plan?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          confirmed: boolean
          created_at: string
          id: string
          ip_address: string | null
          proposal_id: string
          signed_at: string
          signed_name: string
          updated_at: string
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          proposal_id: string
          signed_at?: string
          signed_name: string
          updated_at?: string
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          proposal_id?: string
          signed_at?: string
          signed_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          client_id: string
          created_at: string
          id: string
          month: string
          updated_at: string
          what_happened: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          month: string
          updated_at?: string
          what_happened?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          month?: string
          updated_at?: string
          what_happened?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_connection: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          label: string
          refresh_token: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string
          refresh_token?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string
          refresh_token?: string | null
          tenant_id?: string | null
          updated_at?: string
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
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
