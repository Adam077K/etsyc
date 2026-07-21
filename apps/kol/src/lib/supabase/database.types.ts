/**
 * STUB — placeholder Database type for the KOL Supabase schema.
 *
 * The real types are generated post-apply by MIG-APPLY via
 * `supabase gen types typescript` and will REPLACE this file wholesale.
 * Until then this permissive shape keeps the client layer strictly typed
 * without asserting a schema that has not been applied yet
 * (31 tables, 13 FK-ordered migration groups — see ADR-0001).
 */

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
      [table: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      [fn: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
}
