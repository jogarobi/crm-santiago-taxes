import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientLogin } from '@/db/migrations/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';
import { encrypt } from '@/lib/encrypt';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; loginId: string }> }
) {
  try {
    await requirePermission({ client: ['update'] });

    const { id, loginId } = await params;
    const accountId = parseInt(id);
    const loginIdInt = parseInt(loginId);
    const body = await request.json();

    if (isNaN(accountId) || isNaN(loginIdInt)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    if (!body.updatedBy) {
      return NextResponse.json({ error: 'Missing updatedBy' }, { status: 400 });
    }

    const existing = await db
      .select({ id: clientLogin.id })
      .from(clientLogin)
      .where(and(eq(clientLogin.id, loginIdInt), eq(clientLogin.accountId, accountId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Login not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedBy: body.updatedBy,
      updatedAt: new Date().toISOString(),
    };

    if (body.label !== undefined) updateData.label = body.label;
    if (body.username !== undefined) updateData.username = body.username;
    if (body.password) updateData.encryptedPassword = encrypt(body.password);
    if (body.url !== undefined) updateData.url = body.url || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;

    const updated = await db
      .update(clientLogin)
      .set(updateData)
      .where(eq(clientLogin.id, loginIdInt))
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

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating client login:', error);
    return NextResponse.json({ error: 'Failed to update login' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; loginId: string }> }
) {
  try {
    await requirePermission({ client: ['delete'] });

    const { id, loginId } = await params;
    const accountId = parseInt(id);
    const loginIdInt = parseInt(loginId);

    if (isNaN(accountId) || isNaN(loginIdInt)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const existing = await db
      .select({ id: clientLogin.id })
      .from(clientLogin)
      .where(and(eq(clientLogin.id, loginIdInt), eq(clientLogin.accountId, accountId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Login not found' }, { status: 404 });
    }

    await db.delete(clientLogin).where(eq(clientLogin.id, loginIdInt));

    return NextResponse.json({ message: 'Login deleted successfully' });
  } catch (error) {
    console.error('Error deleting client login:', error);
    return NextResponse.json({ error: 'Failed to delete login' }, { status: 500 });
  }
}
