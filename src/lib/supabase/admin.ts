import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/db/db.types';

/**
 * Server-only Supabase client using the service-role key. Bypasses RLS, so it
 * must never be imported into client components. Authorization for these routes
 * is enforced in application code via requireAuth/requirePermission/withAuth.
 *
 * Also exposes `supabaseAdmin.auth.admin.*` for user management (create/delete).
 */
export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

type TableName = keyof Database['public']['Tables'];

/**
 * Returns the next integer id for a table whose primary key is not an identity
 * column. Several tables in the current schema require an explicit `id` on
 * insert; this derives one from the current max. Best-effort and not safe under
 * heavy concurrency — prefer converting those columns to identity/serial.
 */
export async function nextId(table: TableName): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id')
    .order('id', { ascending: false })
    .limit(1);

  if (error) throw error;

  const rows = (data ?? []) as Array<{ id: number }>;
  return rows.length > 0 ? rows[0].id + 1 : 1;
}
