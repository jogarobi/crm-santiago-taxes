import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { account, clientLogin } from '@/db/migrations/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { decrypt } from '@/lib/encrypt';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { hexToBytes } from '@noble/hashes/utils.js';

async function verifyUserPassword(hash: string, password: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;
  const derived = await scryptAsync(password.normalize('NFKC'), salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  const expected = hexToBytes(key);
  if (derived.length !== expected.length) return false;
  let result = 0;
  for (let i = 0; i < derived.length; i++) result |= derived[i] ^ expected[i];
  return result === 0;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; loginId: string }> }
) {
  try {
    const { id, loginId } = await params;
    const accountId = parseInt(id);
    const loginIdInt = parseInt(loginId);

    if (isNaN(accountId) || isNaN(loginIdInt)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    if (!body.password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Get the current session user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up the user's credential account to get the password hash
    const credentialAccount = await db
      .select({ password: account.password })
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    if (credentialAccount.length === 0 || !credentialAccount[0].password) {
      return NextResponse.json({ error: 'Cannot verify password' }, { status: 400 });
    }

    const isValid = await verifyUserPassword(
      credentialAccount[0].password,
      body.password
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
    }

    // Fetch and decrypt the stored credential
    const loginRecord = await db
      .select({ encryptedPassword: clientLogin.encryptedPassword })
      .from(clientLogin)
      .where(
        and(
          eq(clientLogin.id, loginIdInt),
          eq(clientLogin.accountId, accountId)
        )
      )
      .limit(1);

    if (loginRecord.length === 0) {
      return NextResponse.json({ error: 'Login not found' }, { status: 404 });
    }

    const password = decrypt(loginRecord[0].encryptedPassword);

    return NextResponse.json({ password });
  } catch (error) {
    console.error('Error revealing login password:', error);
    return NextResponse.json({ error: 'Failed to reveal password' }, { status: 500 });
  }
}
