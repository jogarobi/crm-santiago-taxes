import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/encrypt';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; loginId: string }> }
) {
  try {
    const { id, loginId } = await params;
    const clientId = parseInt(id);
    const loginIdInt = parseInt(loginId);

    if (isNaN(clientId) || isNaN(loginIdInt)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    if (!body.password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Re-verify the current user's password using a throwaway client so we
    // don't disturb the active session cookies.
    const verifier = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: signInError } = await verifier.auth.signInWithPassword({
      email: session.user.email,
      password: body.password,
    });

    if (signInError) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
    }

    // Fetch and decrypt the stored credential.
    const { data: loginRecord, error } = await supabaseAdmin
      .from('Logins')
      .select('password')
      .eq('id', loginIdInt)
      .eq('clientId', clientId)
      .maybeSingle();

    if (error) throw error;

    if (!loginRecord) {
      return NextResponse.json({ error: 'Login not found' }, { status: 404 });
    }

    const password = decrypt(loginRecord.password);

    return NextResponse.json({ password });
  } catch (error) {
    console.error('Error revealing login password:', error);
    return NextResponse.json(
      { error: 'Failed to reveal password' },
      { status: 500 }
    );
  }
}
