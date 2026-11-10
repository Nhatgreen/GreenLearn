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
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          daily_streak_days: number
          last_claim_date: string | null
          custom_openai_key_encrypted: string | null
          custom_gemini_key_encrypted: string | null
          oauth_chatgpt_token: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          daily_streak_days?: number
          last_claim_date?: string | null
          custom_openai_key_encrypted?: string | null
          custom_gemini_key_encrypted?: string | null
          oauth_chatgpt_token?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          daily_streak_days?: number
          last_claim_date?: string | null
          custom_openai_key_encrypted?: string | null
          custom_gemini_key_encrypted?: string | null
          oauth_chatgpt_token?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      study_spaces: {
        Row: {
          id: string
          owner_id: string
          name: string
          subject: string
          is_public: boolean
          camera_transform: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name?: string
          subject?: string
          is_public?: boolean
          camera_transform?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          subject?: string
          is_public?: boolean
          camera_transform?: Json
          created_at?: string
          updated_at?: string
        }
      }
      desk_documents: {
        Row: {
          id: string
          space_id: string
          title: string
          item_type: 'paper' | 'book' | 'exam_sheet' | 'sticky_note' | 'roadmap' | 'code_block' | 'mind_map' | 'sticker'
          x: number
          y: number
          rotation: number
          scale: number
          z_index: number
          page_count: number
          current_page_index: number
          is_binder: boolean
          storage_file_path: string | null
          color_theme: string | null
          cover_color: string | null
          sticky_text: string | null
          sticky_color: string | null
          text_align: 'left' | 'center' | 'right' | null
          is_bold: boolean
          is_exam_sheet: boolean
          exam_data: Json | null
          source_documents: Json | null
          width: number | null
          height: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id: string
          title: string
          item_type: 'paper' | 'book' | 'exam_sheet' | 'sticky_note' | 'roadmap' | 'code_block' | 'mind_map' | 'sticker'
          x?: number
          y?: number
          rotation?: number
          scale?: number
          z_index?: number
          page_count?: number
          current_page_index?: number
          is_binder?: boolean
          storage_file_path?: string | null
          color_theme?: string | null
          cover_color?: string | null
          sticky_text?: string | null
          sticky_color?: string | null
          text_align?: 'left' | 'center' | 'right' | null
          is_bold?: boolean
          is_exam_sheet?: boolean
          exam_data?: Json | null
          source_documents?: Json | null
          width?: number | null
          height?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          title?: string
          item_type?: 'paper' | 'book' | 'exam_sheet' | 'sticky_note' | 'roadmap' | 'code_block' | 'mind_map' | 'sticker'
          x?: number
          y?: number
          rotation?: number
          scale?: number
          z_index?: number
          page_count?: number
          current_page_index?: number
          is_binder?: boolean
          storage_file_path?: string | null
          color_theme?: string | null
          cover_color?: string | null
          sticky_text?: string | null
          sticky_color?: string | null
          text_align?: 'left' | 'center' | 'right' | null
          is_bold?: boolean
          is_exam_sheet?: boolean
          exam_data?: Json | null
          source_documents?: Json | null
          width?: number | null
          height?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      document_pages: {
        Row: {
          id: string
          document_id: string
          page_number: number
          title: string | null
          content: string
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          page_number: number
          title?: string | null
          content: string
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          page_number?: number
          title?: string | null
          content?: string
          embedding?: string | null
          created_at?: string
        }
      }
      desk_drawings: {
        Row: {
          id: string
          space_id: string
          author_id: string | null
          color: string
          width: number
          is_highlighter: boolean
          points: Json
          attached_to_item_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          space_id: string
          author_id?: string | null
          color?: string
          width?: number
          is_highlighter?: boolean
          points: Json
          attached_to_item_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          author_id?: string | null
          color?: string
          width?: number
          is_highlighter?: boolean
          points?: Json
          attached_to_item_id?: string | null
          created_at?: string
        }
      }
      inteline_threads: {
        Row: {
          id: string
          space_id: string
          source_item_id: string
          source_page_number: number
          selected_text: string
          source_offset: Json | null
          target_sticky_id: string
          question: string
          answer: string
          created_at: string
        }
        Insert: {
          id?: string
          space_id: string
          source_item_id: string
          source_page_number: number
          selected_text: string
          source_offset?: Json | null
          target_sticky_id: string
          question: string
          answer: string
          created_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          source_item_id?: string
          source_page_number?: number
          selected_text?: string
          source_offset?: Json | null
          target_sticky_id?: string
          question?: string
          answer?: string
          created_at?: string
        }
      }
      space_members: {
        Row: {
          id: string
          space_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          joined_at: string
        }
        Insert: {
          id?: string
          space_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
          joined_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          joined_at?: string
        }
      }
      rate_limits: {
        Row: {
          id: string
          user_id: string
          action: string
          count: number
          window_start: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          count?: number
          window_start?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          count?: number
          window_start?: string
        }
      }
    }
  }
}
