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
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string
          device_label: string | null
          ip: string | null
          session_token: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_label?: string | null
          ip?: string | null
          session_token: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_label?: string | null
          ip?: string | null
          session_token?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_emails: {
        Row: {
          created_at: string
          email: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          note?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          tenant_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          tenant_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          created_at: string
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          status: string
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          status?: string
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          status?: string
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late: boolean
          attachment_url: string | null
          course_id: string
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          instructions: string | null
          is_published: boolean
          max_score: number
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_late?: boolean
          attachment_url?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_score?: number
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_late?: boolean
          attachment_url?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_score?: number
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          code: string
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          tenant_id: string | null
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          tenant_id?: string | null
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_holder: string
          account_number: string | null
          bank_name: string
          created_at: string
          iban: string | null
          id: string
          is_active: boolean
          notes: string | null
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number?: string | null
          bank_name: string
          created_at?: string
          iban?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string | null
          bank_name?: string
          created_at?: string
          iban?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_courses: {
        Row: {
          bundle_id: string
          course_id: string
          sort_order: number
        }
        Insert: {
          bundle_id: string
          course_id: string
          sort_order?: number
        }
        Update: {
          bundle_id?: string
          course_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_courses_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string
          course_title: string
          enrollment_id: string
          final_score: number | null
          id: string
          issued_at: string
          student_id: string
          student_name: string
          tenant_id: string
          tenant_name: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          course_title: string
          enrollment_id: string
          final_score?: number | null
          id?: string
          issued_at?: string
          student_id: string
          student_name: string
          tenant_id: string
          tenant_name: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          course_title?: string
          enrollment_id?: string
          final_score?: number | null
          id?: string
          issued_at?: string
          student_id?: string
          student_name?: string
          tenant_id?: string
          tenant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          last_message_preview: string | null
          status: string
          student_id: string
          tenant_id: string
          unread_admin: number
          unread_student: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          status?: string
          student_id: string
          tenant_id: string
          unread_admin?: number
          unread_student?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          status?: string
          student_id?: string
          tenant_id?: string
          unread_admin?: number
          unread_student?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_role: string
          tenant_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_role: string
          tenant_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          sort_order: number
          tenant_id: string
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          sort_order?: number
          tenant_id: string
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          sort_order?: number
          tenant_id?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colleges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colleges_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          discount_amount: number
          id: string
          payment_request_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_amount: number
          id?: string
          payment_request_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          payment_request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          bundle_id: string | null
          code: string
          course_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_amount: number
          per_user_limit: number
          scope: Database["public"]["Enums"]["coupon_scope"]
          tenant_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string
          used_count: number
          value: number
        }
        Insert: {
          bundle_id?: string | null
          code: string
          course_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_amount?: number
          per_user_limit?: number
          scope?: Database["public"]["Enums"]["coupon_scope"]
          tenant_id: string
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          used_count?: number
          value: number
        }
        Update: {
          bundle_id?: string | null
          code?: string
          course_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_amount?: number
          per_user_limit?: number
          scope?: Database["public"]["Enums"]["coupon_scope"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          used_count?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      course_answers: {
        Row: {
          content: string
          created_at: string
          id: string
          is_accepted: boolean
          is_instructor_answer: boolean
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          is_instructor_answer?: boolean
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          is_instructor_answer?: boolean
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "course_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_bundles: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          name: string
          price: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_bundles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      course_questions: {
        Row: {
          answers_count: number
          body: string
          course_id: string
          created_at: string
          id: string
          is_answered: boolean
          lesson_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers_count?: number
          body: string
          course_id: string
          created_at?: string
          id?: string
          is_answered?: boolean
          lesson_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers_count?: number
          body?: string
          course_id?: string
          created_at?: string
          id?: string
          is_answered?: boolean
          lesson_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          ad_style: number
          ai_image_prompt: string | null
          allow_installments: boolean
          approved_at: string | null
          approved_by: string | null
          average_rating: number
          college_id: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          instructor_id: string
          is_free: boolean
          major_id: string | null
          min_installment_amount: number | null
          price: number
          qr_code_url: string | null
          rejection_reason: string | null
          requires_approval: boolean
          reviews_count: number
          semester: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          students_count: number
          tenant_id: string
          title: string
          total_duration_seconds: number
          university_id: string | null
          updated_at: string
          year_number: number | null
        }
        Insert: {
          ad_style?: number
          ai_image_prompt?: string | null
          allow_installments?: boolean
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number
          college_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instructor_id: string
          is_free?: boolean
          major_id?: string | null
          min_installment_amount?: number | null
          price?: number
          qr_code_url?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean
          reviews_count?: number
          semester?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          students_count?: number
          tenant_id: string
          title: string
          total_duration_seconds?: number
          university_id?: string | null
          updated_at?: string
          year_number?: number | null
        }
        Update: {
          ad_style?: number
          ai_image_prompt?: string | null
          allow_installments?: boolean
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number
          college_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instructor_id?: string
          is_free?: boolean
          major_id?: string | null
          min_installment_amount?: number | null
          price?: number
          qr_code_url?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean
          reviews_count?: number
          semester?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          students_count?: number
          tenant_id?: string
          title?: string
          total_duration_seconds?: number
          university_id?: string | null
          updated_at?: string
          year_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          paid_amount: number
          progress: number
          source: string
          status: string
          student_id: string
          tenant_id: string
          total_amount: number
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          paid_amount?: number
          progress?: number
          source?: string
          status?: string
          student_id: string
          tenant_id: string
          total_amount?: number
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          paid_amount?: number
          progress?: number
          source?: string
          status?: string
          student_id?: string
          tenant_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      error_events: {
        Row: {
          count: number
          environment: string
          fingerprint: string
          first_seen: string
          id: string
          last_seen: string
          message: string
          path: string | null
          source: string
          stack: string | null
          status: string
          tenant_slug: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          count?: number
          environment?: string
          fingerprint: string
          first_seen?: string
          id?: string
          last_seen?: string
          message: string
          path?: string | null
          source?: string
          stack?: string | null
          status?: string
          tenant_slug?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          count?: number
          environment?: string
          fingerprint?: string
          first_seen?: string
          id?: string
          last_seen?: string
          message?: string
          path?: string | null
          source?: string
          stack?: string | null
          status?: string
          tenant_slug?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      job_locks: {
        Row: {
          locked_until: string
          name: string
          pause_reason: string | null
          paused: boolean
          updated_at: string
        }
        Insert: {
          locked_until: string
          name: string
          pause_reason?: string | null
          paused?: boolean
          updated_at?: string
        }
        Update: {
          locked_until?: string
          name?: string
          pause_reason?: string | null
          paused?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      landing_config: {
        Row: {
          created_at: string
          cta_primary_label: string | null
          cta_secondary_label: string | null
          faq: Json
          features: Json
          hero_eyebrow: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_active: boolean
          pricing: Json
          show_faq: boolean
          show_features: boolean
          show_pricing: boolean
          show_stats: boolean
          show_tenants: boolean
          show_testimonials: boolean
          steps: Json
          testimonials: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_primary_label?: string | null
          cta_secondary_label?: string | null
          faq?: Json
          features?: Json
          hero_eyebrow?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_active?: boolean
          pricing?: Json
          show_faq?: boolean
          show_features?: boolean
          show_pricing?: boolean
          show_stats?: boolean
          show_tenants?: boolean
          show_testimonials?: boolean
          steps?: Json
          testimonials?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_primary_label?: string | null
          cta_secondary_label?: string | null
          faq?: Json
          features?: Json
          hero_eyebrow?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_active?: boolean
          pricing?: Json
          show_faq?: boolean
          show_features?: boolean
          show_pricing?: boolean
          show_stats?: boolean
          show_tenants?: boolean
          show_testimonials?: boolean
          steps?: Json
          testimonials?: Json
          updated_at?: string
        }
        Relationships: []
      }
      landing_events: {
        Row: {
          created_at: string
          cta_id: string | null
          event_type: string
          id: number
          metadata: Json
          path: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          cta_id?: string | null
          event_type: string
          id?: number
          metadata?: Json
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          cta_id?: string | null
          event_type?: string
          id?: number
          metadata?: Json
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lesson_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          lesson_id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          lesson_id: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          lesson_id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          enrollment_id: string
          id: string
          lesson_id: string
          updated_at: string
          watched_seconds: number
        }
        Insert: {
          completed?: boolean
          enrollment_id: string
          id?: string
          lesson_id: string
          updated_at?: string
          watched_seconds?: number
        }
        Update: {
          completed?: boolean
          enrollment_id?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_data: Json
          content_text: string | null
          content_url: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          is_preview: boolean
          order_index: number
          section_id: string
          tenant_id: string | null
          title: string
          type: Database["public"]["Enums"]["lesson_type"]
          video_asset_id: string | null
        }
        Insert: {
          content_data?: Json
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_preview?: boolean
          order_index?: number
          section_id: string
          tenant_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["lesson_type"]
          video_asset_id?: string | null
        }
        Update: {
          content_data?: Json
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_preview?: boolean
          order_index?: number
          section_id?: string
          tenant_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["lesson_type"]
          video_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_video_asset_id_fkey"
            columns: ["video_asset_id"]
            isOneToOne: false
            referencedRelation: "video_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          id: string
          meeting_url: string
          provider: Database["public"]["Enums"]["live_session_provider"]
          recording_url: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["live_session_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          meeting_url: string
          provider?: Database["public"]["Enums"]["live_session_provider"]
          recording_url?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["live_session_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          meeting_url?: string
          provider?: Database["public"]["Enums"]["live_session_provider"]
          recording_url?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["live_session_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      majors: {
        Row: {
          college_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          sort_order: number
          tenant_id: string
          updated_at: string
          years_count: number
        }
        Insert: {
          college_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          sort_order?: number
          tenant_id: string
          updated_at?: string
          years_count?: number
        }
        Update: {
          college_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          sort_order?: number
          tenant_id?: string
          updated_at?: string
          years_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "majors_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "majors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          metadata: Json
          tenant_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json
          tenant_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          bank_account_id: string | null
          bundle_id: string | null
          coupon_id: string | null
          course_id: string | null
          created_at: string
          currency: string
          discount_amount: number
          enrollment_id: string | null
          id: string
          original_amount: number | null
          receipt_url: string | null
          referral_code_used: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_request_status"]
          student_id: string
          student_notes: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          bank_account_id?: string | null
          bundle_id?: string | null
          coupon_id?: string | null
          course_id?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          enrollment_id?: string | null
          id?: string
          original_amount?: number | null
          receipt_url?: string | null
          referral_code_used?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_request_status"]
          student_id: string
          student_notes?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          bank_account_id?: string | null
          bundle_id?: string | null
          coupon_id?: string | null
          course_id?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          enrollment_id?: string | null
          id?: string
          original_amount?: number | null
          receipt_url?: string | null
          referral_code_used?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_request_status"]
          student_id?: string
          student_notes?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      perf_samples: {
        Row: {
          created_at: string
          duration_ms: number
          error_message: string | null
          id: string
          kind: string
          name: string
          status: string
          tenant_slug: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms: number
          error_message?: string | null
          id?: string
          kind?: string
          name: string
          status?: string
          tenant_slug?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          kind?: string
          name?: string
          status?: string
          tenant_slug?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          allow_signups: boolean
          chat_enabled: boolean
          coupons_enabled: boolean
          created_at: string
          custom_settings: Json
          default_commission_pct: number
          enable_referrals: boolean
          id: string
          maintenance_message: string | null
          maintenance_mode: boolean
          marquee_color: string | null
          marquee_enabled: boolean
          marquee_text: string | null
          payment_bank_transfer_enabled: boolean
          payment_cash_enabled: boolean
          playback_token_secret: string
          r2_public_worker_url: string | null
          referral_commission_percent: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          allow_signups?: boolean
          chat_enabled?: boolean
          coupons_enabled?: boolean
          created_at?: string
          custom_settings?: Json
          default_commission_pct?: number
          enable_referrals?: boolean
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          marquee_color?: string | null
          marquee_enabled?: boolean
          marquee_text?: string | null
          payment_bank_transfer_enabled?: boolean
          payment_cash_enabled?: boolean
          playback_token_secret?: string
          r2_public_worker_url?: string | null
          referral_commission_percent?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          allow_signups?: boolean
          chat_enabled?: boolean
          coupons_enabled?: boolean
          created_at?: string
          custom_settings?: Json
          default_commission_pct?: number
          enable_referrals?: boolean
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          marquee_color?: string | null
          marquee_enabled?: boolean
          marquee_text?: string | null
          payment_bank_transfer_enabled?: boolean
          payment_cash_enabled?: boolean
          playback_token_secret?: string
          r2_public_worker_url?: string | null
          referral_commission_percent?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college_id: string | null
          created_at: string
          full_name: string | null
          global_logout_at: string
          id: string
          major_id: string | null
          phone: string | null
          phone_country_code: string | null
          referral_balance: number
          referral_code: string | null
          referred_by: string | null
          research_consent: boolean
          study_year: string | null
          study_year_number: number | null
          university_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          college_id?: string | null
          created_at?: string
          full_name?: string | null
          global_logout_at?: string
          id: string
          major_id?: string | null
          phone?: string | null
          phone_country_code?: string | null
          referral_balance?: number
          referral_code?: string | null
          referred_by?: string | null
          research_consent?: boolean
          study_year?: string | null
          study_year_number?: number | null
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          college_id?: string | null
          created_at?: string
          full_name?: string | null
          global_logout_at?: string
          id?: string
          major_id?: string | null
          phone?: string | null
          phone_country_code?: string | null
          referral_balance?: number
          referral_code?: string | null
          referred_by?: string | null
          research_consent?: boolean
          study_year?: string | null
          study_year_number?: number | null
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          points: number
          question_text: string
          question_type: string
          tags: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          points?: number
          question_text: string
          question_type?: string
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          points?: number
          question_text?: string
          question_type?: string
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank_choices: {
        Row: {
          choice_text: string
          id: string
          is_correct: boolean
          order_index: number
          question_id: string
        }
        Insert: {
          choice_text: string
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id: string
        }
        Update: {
          choice_text?: string
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          enrollment_id: string | null
          id: string
          max_score: number
          passed: boolean
          percent: number
          quiz_id: string
          score: number
          started_at: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          answers?: Json
          enrollment_id?: string | null
          id?: string
          max_score?: number
          passed?: boolean
          percent?: number
          quiz_id: string
          score?: number
          started_at?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          answers?: Json
          enrollment_id?: string | null
          id?: string
          max_score?: number
          passed?: boolean
          percent?: number
          quiz_id?: string
          score?: number
          started_at?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_choices: {
        Row: {
          id: string
          is_correct: boolean
          order_index: number
          question_id: string
          text: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id: string
          text: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          order_index: number
          points: number
          quiz_id: string
          text: string
          type: Database["public"]["Enums"]["quiz_question_type"]
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          order_index?: number
          points?: number
          quiz_id: string
          text: string
          type?: Database["public"]["Enums"]["quiz_question_type"]
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          order_index?: number
          points?: number
          quiz_id?: string
          text?: string
          type?: Database["public"]["Enums"]["quiz_question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          attempts_limit: number | null
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_final: boolean
          passing_score: number
          tenant_id: string
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          attempts_limit?: number | null
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_final?: boolean
          passing_score?: number
          tenant_id: string
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          attempts_limit?: number | null
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_final?: boolean
          passing_score?: number
          tenant_id?: string
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_amount: number
          course_id: string | null
          created_at: string
          id: string
          paid_at: string | null
          payment_request_id: string | null
          referred_user_id: string
          referrer_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          commission_amount: number
          course_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_request_id?: string | null
          referred_user_id: string
          referrer_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          commission_amount?: number
          course_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_request_id?: string | null
          referred_user_id?: string
          referrer_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_locked: boolean
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_locked?: boolean
          order_index?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_locked?: boolean
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_health: {
        Row: {
          checked_at: string
          consecutive_failures: number
          error_message: string | null
          last_ok_at: string | null
          latency_ms: number | null
          name: string
          status: string
        }
        Insert: {
          checked_at?: string
          consecutive_failures?: number
          error_message?: string | null
          last_ok_at?: string | null
          latency_ms?: number | null
          name: string
          status?: string
        }
        Update: {
          checked_at?: string
          consecutive_failures?: number
          error_message?: string | null
          last_ok_at?: string | null
          latency_ms?: number | null
          name?: string
          status?: string
        }
        Relationships: []
      }
      tenant_members: {
        Row: {
          application_note: string | null
          applied_role: Database["public"]["Enums"]["tenant_role"] | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          rejected_at: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          application_note?: string | null
          applied_role?: Database["public"]["Enums"]["tenant_role"] | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          application_note?: string | null
          applied_role?: Database["public"]["Enums"]["tenant_role"] | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_secrets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_secrets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          about_text: string | null
          activated_at: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          cta_subtitle: string | null
          cta_title: string | null
          currency: string
          custom_domain: string | null
          custom_domain_requested_at: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified: boolean
          description: string | null
          faq: Json | null
          features: Json | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          plan: Database["public"]["Enums"]["tenant_plan"]
          primary_color: string
          privacy_text: string | null
          secondary_color: string
          seo_keywords: string | null
          seo_og_image: string | null
          slug: string
          stats: Json | null
          status: Database["public"]["Enums"]["tenant_status"]
          storage_quota_bytes: number
          storage_used_bytes: number
          suspended_at: string | null
          suspension_reason: string | null
          terms_text: string | null
          testimonials: Json | null
          theme: string
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          about_text?: string | null
          activated_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          cta_subtitle?: string | null
          cta_title?: string | null
          currency?: string
          custom_domain?: string | null
          custom_domain_requested_at?: string | null
          custom_domain_verification_token?: string | null
          custom_domain_verified?: boolean
          description?: string | null
          faq?: Json | null
          features?: Json | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          plan?: Database["public"]["Enums"]["tenant_plan"]
          primary_color?: string
          privacy_text?: string | null
          secondary_color?: string
          seo_keywords?: string | null
          seo_og_image?: string | null
          slug: string
          stats?: Json | null
          status?: Database["public"]["Enums"]["tenant_status"]
          storage_quota_bytes?: number
          storage_used_bytes?: number
          suspended_at?: string | null
          suspension_reason?: string | null
          terms_text?: string | null
          testimonials?: Json | null
          theme?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          about_text?: string | null
          activated_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          cta_subtitle?: string | null
          cta_title?: string | null
          currency?: string
          custom_domain?: string | null
          custom_domain_requested_at?: string | null
          custom_domain_verification_token?: string | null
          custom_domain_verified?: boolean
          description?: string | null
          faq?: Json | null
          features?: Json | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          plan?: Database["public"]["Enums"]["tenant_plan"]
          primary_color?: string
          privacy_text?: string | null
          secondary_color?: string
          seo_keywords?: string | null
          seo_og_image?: string | null
          slug?: string
          stats?: Json | null
          status?: Database["public"]["Enums"]["tenant_status"]
          storage_quota_bytes?: number
          storage_used_bytes?: number
          suspended_at?: string | null
          suspension_reason?: string | null
          terms_text?: string | null
          testimonials?: Json | null
          theme?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      universities: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          name_en: string | null
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          name_en?: string | null
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          name_en?: string | null
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "universities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          tenant_id: string
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          tenant_id: string
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          tenant_id?: string
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_assets: {
        Row: {
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          height: number | null
          id: string
          mime_type: string | null
          original_filename: string | null
          r2_key: string
          size_bytes: number | null
          status: Database["public"]["Enums"]["video_status"]
          tenant_id: string
          thumbnail_key: string | null
          updated_at: string
          upload_id: string | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          r2_key: string
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["video_status"]
          tenant_id: string
          thumbnail_key?: string | null
          updated_at?: string
          upload_id?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          r2_key?: string
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["video_status"]
          tenant_id?: string
          thumbnail_key?: string | null
          updated_at?: string
          upload_id?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      video_jobs: {
        Row: {
          asset_id: string
          attempts: number
          created_at: string
          id: string
          kind: string
          last_error: string | null
          locked_until: string | null
          max_attempts: number
          payload: Json
          run_after: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          attempts?: number
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          locked_until?: string | null
          max_attempts?: number
          payload?: Json
          run_after?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          attempts?: number
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          locked_until?: string | null
          max_attempts?: number
          payload?: Json
          run_after?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_jobs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "video_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      web_vitals: {
        Row: {
          created_at: string
          id: string
          metric: string
          path: string | null
          rating: string | null
          tenant_slug: string | null
          url: string | null
          user_agent: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric: string
          path?: string | null
          rating?: string | null
          tenant_slug?: string | null
          url?: string | null
          user_agent?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          path?: string | null
          rating?: string | null
          tenant_slug?: string | null
          url?: string | null
          user_agent?: string | null
          value?: number
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          meta: Json | null
          reason: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          meta?: Json | null
          reason: string
          tenant_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          meta?: Json | null
          reason?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      quiz_choices_public: {
        Row: {
          id: string | null
          order_index: number | null
          question_id: string | null
          text: string | null
        }
        Insert: {
          id?: string | null
          order_index?: number | null
          question_id?: string | null
          text?: string | null
        }
        Update: {
          id?: string | null
          order_index?: number | null
          question_id?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      acquire_job_lock: {
        Args: { _name: string; _seconds: number }
        Returns: boolean
      }
      admin_set_storage_quota: {
        Args: { _quota_bytes: number; _tenant_id: string }
        Returns: number
      }
      apply_to_tenant: {
        Args: {
          _desired_role: Database["public"]["Enums"]["tenant_role"]
          _note?: string
          _tenant_id: string
        }
        Returns: {
          application_note: string | null
          applied_role: Database["public"]["Enums"]["tenant_role"] | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          rejected_at: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tenant_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_course: { Args: { _course_id: string }; Returns: undefined }
      approve_instructor: {
        Args: { _member_id: string }
        Returns: {
          application_note: string | null
          applied_role: Database["public"]["Enums"]["tenant_role"] | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          rejected_at: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tenant_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_payment_request: {
        Args: { _notes?: string; _req_id: string }
        Returns: undefined
      }
      award_badge: {
        Args: { _code: string; _tenant_id?: string; _user_id: string }
        Returns: string
      }
      award_xp: {
        Args: {
          _amount: number
          _meta?: Json
          _reason: string
          _tenant_id: string
          _user_id: string
        }
        Returns: {
          created_at: string
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          tenant_id: string
          total_xp: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_gamification"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bump_global_logout: { Args: { _user_id: string }; Returns: undefined }
      check_storage_quota: {
        Args: { _incoming_bytes: number; _tenant_id: string }
        Returns: {
          allowed: boolean
          quota_bytes: number
          remaining_bytes: number
          used_bytes: number
        }[]
      }
      claim_video_jobs: {
        Args: { _limit?: number }
        Returns: {
          asset_id: string
          attempts: number
          created_at: string
          id: string
          kind: string
          last_error: string | null
          locked_until: string | null
          max_attempts: number
          payload: Json
          run_after: string
          status: string
          tenant_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "video_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cleanup_monitoring: { Args: never; Returns: undefined }
      compute_level: { Args: { _xp: number }; Returns: number }
      course_tenant: { Args: { _course_id: string }; Returns: string }
      create_notification: {
        Args: {
          _link?: string
          _message?: string
          _metadata?: Json
          _tenant_id: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      enrollment_student: { Args: { _enrollment_id: string }; Returns: string }
      error_events_summary: {
        Args: { _hours?: number; _limit?: number }
        Returns: {
          count: number
          first_seen: string
          id: string
          last_seen: string
          message: string
          path: string
          source: string
          status: string
          tenant_slug: string
        }[]
      }
      get_live_session_urls: {
        Args: { _session_id: string }
        Returns: {
          meeting_url: string
          recording_url: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _roles: Database["public"]["Enums"]["tenant_role"][]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      import_bank_question_into_quiz: {
        Args: { _bank_question_id: string; _quiz_id: string }
        Returns: string
      }
      is_admin_email: { Args: { _email: string }; Returns: boolean }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_owner: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      issue_certificate: { Args: { _enrollment_id: string }; Returns: string }
      landing_events_summary: { Args: { _days?: number }; Returns: Json }
      log_activity: {
        Args: {
          _action: string
          _actor_id: string
          _entity_id?: string
          _entity_type?: string
          _metadata?: Json
          _tenant_id: string
        }
        Returns: undefined
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      perf_server_summary: {
        Args: { _hours?: number; _tenant_slug?: string }
        Returns: {
          avg_ms: number
          calls: number
          errors: number
          kind: string
          max_ms: number
          name: string
          p95_ms: number
        }[]
      }
      perf_vitals_summary: {
        Args: { _hours?: number; _tenant_slug?: string }
        Returns: {
          metric: string
          p50: number
          p75: number
          p95: number
          path: string
          poor_ratio: number
          samples: number
        }[]
      }
      recompute_course_rating: {
        Args: { _course_id: string }
        Returns: undefined
      }
      record_error_event: {
        Args: {
          _environment?: string
          _message: string
          _path?: string
          _source: string
          _stack?: string
          _tenant_slug?: string
          _user_agent?: string
        }
        Returns: string
      }
      record_service_health: {
        Args: {
          _error?: string
          _latency_ms?: number
          _name: string
          _status: string
        }
        Returns: undefined
      }
      reject_course: {
        Args: { _course_id: string; _reason: string }
        Returns: undefined
      }
      reject_instructor: {
        Args: { _member_id: string; _reason?: string }
        Returns: {
          application_note: string | null
          applied_role: Database["public"]["Enums"]["tenant_role"] | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          rejected_at: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tenant_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reject_payment_request: {
        Args: { _notes?: string; _req_id: string }
        Returns: undefined
      }
      section_course: { Args: { _section_id: string }; Returns: string }
      submit_quiz_attempt: {
        Args: { _answers: Json; _quiz_id: string }
        Returns: string
      }
      tenant_admin_courses_bundle: { Args: { _slug: string }; Returns: Json }
      tenant_at_risk_students: {
        Args: { _inactive_days?: number; _limit?: number; _tenant_id: string }
        Returns: {
          course_title: string
          enrollment_id: string
          full_name: string
          inactive_days: number
          last_activity: string
          progress: number
          student_id: string
        }[]
      }
      tenant_cohort_retention: {
        Args: { _tenant_id: string; _weeks?: number }
        Returns: {
          cohort_size: number
          cohort_week: string
          week_1_active: number
          week_2_active: number
          week_3_active: number
          week_4_active: number
        }[]
      }
      tenant_courses_bundle: { Args: { _slug: string }; Returns: Json }
      tenant_enrollments_by_day: {
        Args: { _days?: number; _tenant_id: string }
        Returns: {
          count: number
          day: string
        }[]
      }
      tenant_funnel_summary: {
        Args: { _days?: number; _tenant_id: string }
        Returns: {
          count: number
          percent: number
          stage: string
        }[]
      }
      tenant_home_bundle: { Args: { _slug: string }; Returns: Json }
      tenant_leaderboard: {
        Args: { _limit?: number; _period?: string; _tenant_id: string }
        Returns: {
          avatar_url: string
          current_streak: number
          full_name: string
          level: number
          rank: number
          total_xp: number
          user_id: string
        }[]
      }
      tenant_members_bundle: { Args: { _slug: string }; Returns: Json }
      tenant_overview_stats: { Args: { _tenant_id: string }; Returns: Json }
      tenant_revenue_by_day: {
        Args: { _days?: number; _tenant_id: string }
        Returns: {
          day: string
          revenue: number
        }[]
      }
      tenant_student_progress: {
        Args: { _limit?: number; _tenant_id: string }
        Returns: {
          avg_progress: number
          completed_count: number
          enrollments_count: number
          full_name: string
          student_id: string
        }[]
      }
      tenant_top_courses: {
        Args: { _limit?: number; _tenant_id: string }
        Returns: {
          average_rating: number
          course_id: string
          enrollments_count: number
          revenue: number
          title: string
        }[]
      }
      user_gamification_summary: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: {
          current_streak: number
          level: number
          longest_streak: number
          rank: number
          total_xp: number
          xp_for_next: number
          xp_into_level: number
        }[]
      }
      validate_coupon: {
        Args: {
          _amount: number
          _bundle_id?: string
          _code: string
          _course_id?: string
          _tenant_id: string
        }
        Returns: {
          coupon_id: string
          discount: number
          final_amount: number
          message: string
        }[]
      }
      xp_for_level: { Args: { _level: number }; Returns: number }
    }
    Enums: {
      app_role: "super_admin"
      coupon_scope: "all" | "course" | "bundle"
      coupon_type: "percent" | "fixed"
      course_status: "draft" | "published" | "archived" | "pending_approval"
      lesson_type: "video" | "text" | "pdf"
      live_session_provider:
        | "zoom"
        | "google_meet"
        | "jitsi"
        | "teams"
        | "other"
      live_session_status: "scheduled" | "live" | "ended" | "cancelled"
      payment_request_status: "pending" | "approved" | "rejected" | "cancelled"
      quiz_question_type: "mcq" | "true_false"
      tenant_plan: "free" | "starter" | "pro" | "enterprise"
      tenant_role:
        | "owner"
        | "instructor"
        | "student"
        | "admin"
        | "pending_instructor"
      tenant_status: "active" | "suspended" | "trial"
      video_status: "pending" | "uploading" | "processing" | "ready" | "failed"
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
      app_role: ["super_admin"],
      coupon_scope: ["all", "course", "bundle"],
      coupon_type: ["percent", "fixed"],
      course_status: ["draft", "published", "archived", "pending_approval"],
      lesson_type: ["video", "text", "pdf"],
      live_session_provider: ["zoom", "google_meet", "jitsi", "teams", "other"],
      live_session_status: ["scheduled", "live", "ended", "cancelled"],
      payment_request_status: ["pending", "approved", "rejected", "cancelled"],
      quiz_question_type: ["mcq", "true_false"],
      tenant_plan: ["free", "starter", "pro", "enterprise"],
      tenant_role: [
        "owner",
        "instructor",
        "student",
        "admin",
        "pending_instructor",
      ],
      tenant_status: ["active", "suspended", "trial"],
      video_status: ["pending", "uploading", "processing", "ready", "failed"],
    },
  },
} as const
