'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

type Session = { user: SessionUser } | null;

/**
 * Client-side hook exposing the current Supabase user in a `{ user }` shape,
 * a drop-in replacement for the previous better-auth `useSession()`.
 */
export function useSessionUser(): Session {
  const [session, setSession] = useState<Session>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (user) {
        const metadata = user.user_metadata ?? {};
        setSession({
          user: {
            id: user.id,
            email: user.email ?? '',
            name:
              (metadata.name as string | undefined) ??
              (metadata.full_name as string | undefined) ??
              user.email ??
              '',
          },
        });
      } else {
        setSession(null);
      }
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return session;
}
