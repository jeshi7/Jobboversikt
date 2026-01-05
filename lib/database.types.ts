export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          name: string;
          role: "admin" | "consultant" | "client";
          password_hash: string | null;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          name: string;
          role: "admin" | "consultant" | "client";
          password_hash?: string | null;
          must_change_password?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          name?: string;
          role?: "admin" | "consultant" | "client";
          password_hash?: string | null;
          must_change_password?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          organization_id: string;
          company: string;
          job_title: string;
          status: string;
          deadline: string | null;
          location: string | null;
          employment_type: string | null;
          salary: string | null;
          listing_url: string | null;
          angle: string | null;
          notes: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          sent_at: string | null;
          interview_dates: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          organization_id: string;
          company: string;
          job_title: string;
          status?: string;
          deadline?: string | null;
          location?: string | null;
          employment_type?: string | null;
          salary?: string | null;
          listing_url?: string | null;
          angle?: string | null;
          notes?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          sent_at?: string | null;
          interview_dates?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          organization_id?: string;
          company?: string;
          job_title?: string;
          status?: string;
          deadline?: string | null;
          location?: string | null;
          employment_type?: string | null;
          salary?: string | null;
          listing_url?: string | null;
          angle?: string | null;
          notes?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          sent_at?: string | null;
          interview_dates?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          application_id: string;
          name: string;
          type: string;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          name: string;
          type: string;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          name?: string;
          type?: string;
          storage_path?: string;
          original_name?: string;
          mime_type?: string;
          size?: number;
          created_at?: string;
        };
      };
      follow_up_notes: {
        Row: {
          id: string;
          application_id: string;
          type: string;
          number: number | null;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          type: string;
          number?: number | null;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          type?: string;
          number?: number | null;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      competence_banks: {
        Row: {
          id: string;
          client_id: string;
          skills: Json;
          experiences: Json;
          education: Json;
          languages: Json;
          certifications: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          skills?: Json;
          experiences?: Json;
          education?: Json;
          languages?: Json;
          certifications?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          skills?: Json;
          experiences?: Json;
          education?: Json;
          languages?: Json;
          certifications?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "admin" | "consultant" | "client";
      application_status:
        | "planlagt"
        | "forberedes"
        | "sendt"
        | "intervju"
        | "avslått"
        | "tilbud"
        | "ansatt";
      document_type: "cv" | "cover_letter" | "job_listing" | "other";
    };
  };
}

