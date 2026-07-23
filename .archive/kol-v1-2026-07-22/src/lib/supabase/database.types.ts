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
    PostgrestVersion: "14.5"
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
      answers: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["answer_kind"]
          maker_id: string
          media_id: string | null
          question_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["answer_kind"]
          maker_id: string
          media_id?: string | null
          question_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["answer_kind"]
          maker_id?: string
          media_id?: string | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          ai_assisted_fields: string[]
          created_at: string
          disclosure: string | null
          id: string
          kind: Database["public"]["Enums"]["badge_kind"]
          store_id: string
          transparency_level:
            | Database["public"]["Enums"]["ai_transparency_level"]
            | null
          updated_at: string
          verification_id: string | null
        }
        Insert: {
          ai_assisted_fields?: string[]
          created_at?: string
          disclosure?: string | null
          id?: string
          kind: Database["public"]["Enums"]["badge_kind"]
          store_id: string
          transparency_level?:
            | Database["public"]["Enums"]["ai_transparency_level"]
            | null
          updated_at?: string
          verification_id?: string | null
        }
        Update: {
          ai_assisted_fields?: string[]
          created_at?: string
          disclosure?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["badge_kind"]
          store_id?: string
          transparency_level?:
            | Database["public"]["Enums"]["ai_transparency_level"]
            | null
          updated_at?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badges_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badges_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          allowed_states: string[]
          created_at: string
          id: string
          prop_schema_ref: string | null
          type: string
          variant: string
        }
        Insert: {
          allowed_states?: string[]
          created_at?: string
          id?: string
          prop_schema_ref?: string | null
          type: string
          variant: string
        }
        Update: {
          allowed_states?: string[]
          created_at?: string
          id?: string
          prop_schema_ref?: string | null
          type?: string
          variant?: string
        }
        Relationships: []
      }
      buyer_signals: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          subject_id: string
          subject_type: Database["public"]["Enums"]["signal_subject"]
          weight: number
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          subject_id: string
          subject_type: Database["public"]["Enums"]["signal_subject"]
          weight?: number
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          signal_type?: Database["public"]["Enums"]["signal_type"]
          subject_id?: string
          subject_type?: Database["public"]["Enums"]["signal_subject"]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "buyer_signals_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["cart_status"]
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["cart_status"]
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["cart_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
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
      commission_drafts: {
        Row: {
          commission_id: string
          content: Json
          created_at: string
          id: string
          media_ids: string[]
          note: string | null
          status: Database["public"]["Enums"]["commission_draft_status"]
          version: number
        }
        Insert: {
          commission_id: string
          content?: Json
          created_at?: string
          id?: string
          media_ids?: string[]
          note?: string | null
          status?: Database["public"]["Enums"]["commission_draft_status"]
          version: number
        }
        Update: {
          commission_id?: string
          content?: Json
          created_at?: string
          id?: string
          media_ids?: string[]
          note?: string | null
          status?: Database["public"]["Enums"]["commission_draft_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_drafts_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          brief: Json
          buyer_id: string
          created_at: string
          id: string
          maker_id: string
          status: Database["public"]["Enums"]["commission_status"]
          store_id: string | null
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          brief?: Json
          buyer_id: string
          created_at?: string
          id?: string
          maker_id: string
          status?: Database["public"]["Enums"]["commission_status"]
          store_id?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          brief?: Json
          buyer_id?: string
          created_at?: string
          id?: string
          maker_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
          store_id?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          maker_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          maker_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          maker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_answers: {
        Row: {
          answer_text: string | null
          beat_key: string
          created_at: string
          id: string
          interview_id: string
          media_id: string | null
          ordinal: number
          question: string | null
        }
        Insert: {
          answer_text?: string | null
          beat_key: string
          created_at?: string
          id?: string
          interview_id: string
          media_id?: string | null
          ordinal?: number
          question?: string | null
        }
        Update: {
          answer_text?: string | null
          beat_key?: string
          created_at?: string
          id?: string
          interview_id?: string
          media_id?: string | null
          ordinal?: number
          question?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          created_at: string
          id: string
          maker_id: string
          mode: Database["public"]["Enums"]["interview_mode"]
          status: Database["public"]["Enums"]["interview_status"]
          store_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          maker_id: string
          mode: Database["public"]["Enums"]["interview_mode"]
          status?: Database["public"]["Enums"]["interview_status"]
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          maker_id?: string
          mode?: Database["public"]["Enums"]["interview_mode"]
          status?: Database["public"]["Enums"]["interview_status"]
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt: string | null
          aspect: string | null
          created_at: string
          duration_ms: number | null
          focal_point: Json | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime: string | null
          owner_id: string
          src: string
          store_id: string | null
        }
        Insert: {
          alt?: string | null
          aspect?: string | null
          created_at?: string
          duration_ms?: number | null
          focal_point?: Json | null
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime?: string | null
          owner_id: string
          src: string
          store_id?: string | null
        }
        Update: {
          alt?: string | null
          aspect?: string | null
          created_at?: string
          duration_ms?: number | null
          focal_point?: Json | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime?: string | null
          owner_id?: string
          src?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["message_kind"]
          media_id: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          media_id?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          media_id?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          currency: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price_amount: number
          variation: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price_amount: number
          variation?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price_amount?: number
          variation?: string | null
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
          buyer_id: string
          commission_id: string | null
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          stripe_payment_intent_id: string | null
          subtotal_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          commission_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          stripe_payment_intent_id?: string | null
          subtotal_amount: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          commission_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          stripe_payment_intent_id?: string | null
          subtotal_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_provenance: {
        Row: {
          created_at: string
          id: string
          maker_role: string | null
          materials: string | null
          partners: string | null
          process: string | null
          process_media_ids: string[]
          product_id: string
          production_location: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          maker_role?: string | null
          materials?: string | null
          partners?: string | null
          process?: string | null
          process_media_ids?: string[]
          product_id: string
          production_location?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          maker_role?: string | null
          materials?: string | null
          partners?: string | null
          process?: string | null
          process_media_ids?: string[]
          product_id?: string
          production_location?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_provenance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_specs: {
        Row: {
          care: string | null
          created_at: string
          customization_limits: string | null
          dimensions: string | null
          handmade_variation: string | null
          id: string
          materials: string | null
          product_id: string
          production_time: string | null
          repairs: string | null
          returns: string | null
          shipping: string | null
          texture: string | null
          updated_at: string
        }
        Insert: {
          care?: string | null
          created_at?: string
          customization_limits?: string | null
          dimensions?: string | null
          handmade_variation?: string | null
          id?: string
          materials?: string | null
          product_id: string
          production_time?: string | null
          repairs?: string | null
          returns?: string | null
          shipping?: string | null
          texture?: string | null
          updated_at?: string
        }
        Update: {
          care?: string | null
          created_at?: string
          customization_limits?: string | null
          dimensions?: string | null
          handmade_variation?: string | null
          id?: string
          materials?: string | null
          product_id?: string
          production_time?: string | null
          repairs?: string | null
          returns?: string | null
          shipping?: string | null
          texture?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badges: string[]
          created_at: string
          currency: string
          description: string | null
          id: string
          inventory_qty: number | null
          inventory_status: Database["public"]["Enums"]["inventory_status"]
          materials: string | null
          model3d_id: string | null
          price_amount: number
          search_tsv: unknown
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          badges?: string[]
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          inventory_qty?: number | null
          inventory_status?: Database["public"]["Enums"]["inventory_status"]
          materials?: string | null
          model3d_id?: string | null
          price_amount: number
          search_tsv?: unknown
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          badges?: string[]
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          inventory_qty?: number | null
          inventory_status?: Database["public"]["Enums"]["inventory_status"]
          materials?: string | null
          model3d_id?: string | null
          price_amount?: number
          search_tsv?: unknown
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_model3d_id_fkey"
            columns: ["model3d_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          handle: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          handle?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          handle?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          body: string
          buyer_id: string
          created_at: string
          id: string
          product_id: string
          store_id: string
        }
        Insert: {
          body: string
          buyer_id: string
          created_at?: string
          id?: string
          product_id: string
          store_id: string
        }
        Update: {
          body?: string
          buyer_id?: string
          created_at?: string
          id?: string
          product_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      review_media: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["review_media_kind"]
          review_id: string
          src: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["review_media_kind"]
          review_id: string
          src: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["review_media_kind"]
          review_id?: string
          src?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          buyer_id: string
          created_at: string
          expectation_accuracy: number | null
          id: string
          maker_response: string | null
          order_item_id: string | null
          product_id: string
          rating: number
          updated_at: string
          variation: string | null
          verified: boolean | null
        }
        Insert: {
          body?: string | null
          buyer_id: string
          created_at?: string
          expectation_accuracy?: number | null
          id?: string
          maker_response?: string | null
          order_item_id?: string | null
          product_id: string
          rating: number
          updated_at?: string
          variation?: string | null
          verified?: boolean | null
        }
        Update: {
          body?: string | null
          buyer_id?: string
          created_at?: string
          expectation_accuracy?: number | null
          id?: string
          maker_response?: string | null
          order_item_id?: string | null
          product_id?: string
          rating?: number
          updated_at?: string
          variation?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          subject_id: string
          subject_type: Database["public"]["Enums"]["save_subject"]
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          subject_id: string
          subject_type: Database["public"]["Enums"]["save_subject"]
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          subject_id?: string
          subject_type?: Database["public"]["Enums"]["save_subject"]
        }
        Relationships: [
          {
            foreignKeyName: "saves_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_versions: {
        Row: {
          approved_sections: Json
          config: Json
          created_at: string
          critic_score: number | null
          id: string
          status: Database["public"]["Enums"]["store_version_status"]
          store_id: string
          updated_at: string
          version: number
        }
        Insert: {
          approved_sections?: Json
          config: Json
          created_at?: string
          critic_score?: number | null
          id?: string
          status?: Database["public"]["Enums"]["store_version_status"]
          store_id: string
          updated_at?: string
          version: number
        }
        Update: {
          approved_sections?: Json
          config?: Json
          created_at?: string
          critic_score?: number | null
          id?: string
          status?: Database["public"]["Enums"]["store_version_status"]
          store_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_versions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          bio: string | null
          config: Json
          craft: string | null
          created_at: string
          handle: string
          id: string
          name: string
          owner_id: string
          published: boolean
          search_tsv: unknown
          updated_at: string
        }
        Insert: {
          bio?: string | null
          config?: Json
          craft?: string | null
          created_at?: string
          handle: string
          id?: string
          name?: string
          owner_id: string
          published?: boolean
          search_tsv?: unknown
          updated_at?: string
        }
        Update: {
          bio?: string | null
          config?: Json
          craft?: string | null
          created_at?: string
          handle?: string
          id?: string
          name?: string
          owner_id?: string
          published?: boolean
          search_tsv?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          buyer_id: string
          commission_id: string | null
          created_at: string
          id: string
          maker_id: string
          store_id: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          commission_id?: string | null
          created_at?: string
          id?: string
          maker_id: string
          store_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          commission_id?: string | null
          created_at?: string
          id?: string
          maker_id?: string
          store_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          created_at: string
          id: string
          maker_id: string
          status: Database["public"]["Enums"]["verification_status"]
          store_id: string
          updated_at: string
          verified_at: string | null
          voice_anchor_clip_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          maker_id: string
          status?: Database["public"]["Enums"]["verification_status"]
          store_id: string
          updated_at?: string
          verified_at?: string | null
          voice_anchor_clip_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          maker_id?: string
          status?: Database["public"]["Enums"]["verification_status"]
          store_id?: string
          updated_at?: string
          verified_at?: string | null
          voice_anchor_clip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_maker_id_fkey"
            columns: ["maker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_voice_anchor_clip_id_fkey"
            columns: ["voice_anchor_clip_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_profiles: {
        Row: {
          anti_repetition_key: string | null
          created_at: string
          id: string
          mood: string[]
          page_eligibility: string[]
          product_links: string[]
          purpose: string[]
          video_id: string
        }
        Insert: {
          anti_repetition_key?: string | null
          created_at?: string
          id?: string
          mood?: string[]
          page_eligibility?: string[]
          product_links?: string[]
          purpose?: string[]
          video_id: string
        }
        Update: {
          anti_repetition_key?: string | null
          created_at?: string
          id?: string
          mood?: string[]
          page_eligibility?: string[]
          product_links?: string[]
          purpose?: string[]
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_profiles_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          captions_src: string | null
          created_at: string
          duration_ms: number | null
          id: string
          owner_id: string
          poster: string | null
          src: string
          store_id: string | null
        }
        Insert: {
          captions_src?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          owner_id: string
          poster?: string | null
          src: string
          store_id?: string | null
        }
        Update: {
          captions_src?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          owner_id?: string
          poster?: string | null
          src?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      voiceovers: {
        Row: {
          created_at: string
          duration_ms: number | null
          element_field: string | null
          element_id: string
          element_kind: Database["public"]["Enums"]["voiceover_element_kind"]
          id: string
          label: string
          media_id: string | null
          src: string
          store_id: string
          transcript: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          element_field?: string | null
          element_id: string
          element_kind: Database["public"]["Enums"]["voiceover_element_kind"]
          id?: string
          label: string
          media_id?: string | null
          src: string
          store_id: string
          transcript?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          element_field?: string | null
          element_id?: string
          element_kind?: Database["public"]["Enums"]["voiceover_element_kind"]
          id?: string
          label?: string
          media_id?: string | null
          src?: string
          store_id?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voiceovers_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voiceovers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_order: { Args: { p_order_id: string }; Returns: undefined }
      create_order: {
        Args: { p_items: Json; p_store_id: string }
        Returns: string
      }
      get_public_profile: {
        Args: { p_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      set_order_status: {
        Args: {
          p_order_id: string
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      ai_transparency_level: "maker-authored" | "ai-assisted" | "ai-drafted"
      answer_kind: "text" | "audio" | "video"
      badge_kind: "real-maker" | "ai-transparency"
      cart_status: "active" | "checked_out" | "abandoned"
      commission_draft_status: "proposed" | "revised" | "approved" | "rejected"
      commission_status:
        | "brief"
        | "negotiating"
        | "drafting"
        | "approved"
        | "rejected"
        | "cancelled"
      interview_mode: "film" | "voice"
      interview_status: "in_progress" | "complete"
      inventory_status: "in-stock" | "made-to-order" | "sold-out"
      media_kind: "image" | "audio" | "model3d" | "poster"
      message_kind: "text" | "audio" | "video"
      order_status: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded"
      review_media_kind: "image" | "video"
      save_subject: "product" | "store"
      signal_subject: "maker" | "store" | "product"
      signal_type:
        | "visit"
        | "purchase"
        | "question"
        | "save"
        | "follow"
        | "commission"
        | "review"
      store_version_status: "draft" | "in_review" | "approved" | "published"
      user_role: "buyer" | "seller"
      verification_status: "pending" | "verified" | "rejected"
      voiceover_element_kind: "block" | "product" | "field"
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
    Enums: {
      ai_transparency_level: ["maker-authored", "ai-assisted", "ai-drafted"],
      answer_kind: ["text", "audio", "video"],
      badge_kind: ["real-maker", "ai-transparency"],
      cart_status: ["active", "checked_out", "abandoned"],
      commission_draft_status: ["proposed", "revised", "approved", "rejected"],
      commission_status: [
        "brief",
        "negotiating",
        "drafting",
        "approved",
        "rejected",
        "cancelled",
      ],
      interview_mode: ["film", "voice"],
      interview_status: ["in_progress", "complete"],
      inventory_status: ["in-stock", "made-to-order", "sold-out"],
      media_kind: ["image", "audio", "model3d", "poster"],
      message_kind: ["text", "audio", "video"],
      order_status: ["pending", "paid", "fulfilled", "cancelled", "refunded"],
      review_media_kind: ["image", "video"],
      save_subject: ["product", "store"],
      signal_subject: ["maker", "store", "product"],
      signal_type: [
        "visit",
        "purchase",
        "question",
        "save",
        "follow",
        "commission",
        "review",
      ],
      store_version_status: ["draft", "in_review", "approved", "published"],
      user_role: ["buyer", "seller"],
      verification_status: ["pending", "verified", "rejected"],
      voiceover_element_kind: ["block", "product", "field"],
    },
  },
} as const
