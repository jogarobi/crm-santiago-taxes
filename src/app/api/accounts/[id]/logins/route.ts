import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientAccount, clientLogin } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';
import { encrypt } from '@/lib/encrypt';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ client: ['read'] });

    const { id } = await params;
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    const logins = await db
      .select({
        id: clientLogin.id,
        accountId: clientLogin.accountId,
        label: clientLogin.label,
        username: clientLogin.username,
        url: clientLogin.url,
        notes: clientLogin.notes,
        createdAt: clientLogin.createdAt,
        createdBy: clientLogin.createdBy,
        updatedAt: clientLogin.updatedAt,
        updatedBy: clientLogin.updatedBy,
      })
      .from(clientLogin)
      .where(eq(clientLogin.accountId, accountId));

    return NextResponse.json(logins);
  } catch (error) {
    console.error('Error fetching client logins:', error);
    return NextResponse.json({ error: 'Failed to fetch logins' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ client: ['create'] });

    const { id } = await params;
    const accountId = parseInt(id);
    const body = await request.json();

    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    if (!body.label || !body.username || !body.password || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: label, username, password, createdBy' },
        { status: 400 }
      );
    }

    const accountExists = await db
      .select({ id: clientAccount.id })
      .from(clientAccount)
      .where(eq(clientAccount.id, accountId))
      .limit(1);

    if (accountExists.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const encryptedPassword = encrypt(body.password);

    const newLogin = await db
      .insert(clientLogin)
      .values({
        accountId,
        label: body.label,
        username: body.username,
        encryptedPassword,
        url: body.url || null,
        notes: body.notes || null,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .returning({
        id: clientLogin.id,
        accountId: clientLogin.accountId,
        label: clientLogin.label,
        username: clientLogin.username,
        url: clientLogin.url,
        notes: clientLogin.notes,
        createdAt: clientLogin.createdAt,
        createdBy: clientLogin.createdBy,
        updatedAt: clientLogin.updatedAt,
        updatedBy: clientLogin.updatedBy,
      });

    return NextResponse.json(newLogin[0], { status: 201 });
  } catch (error) {
    console.error('Error creating client login:', error);
    return NextResponse.json({ error: 'Failed to create login' }, { status: 500 });
  }
}
