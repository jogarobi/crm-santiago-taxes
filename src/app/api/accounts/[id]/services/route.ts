import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientService, service } from '@/db/migrations/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ client: ['read'] });

    const { id } = await params;
    const accountId = parseInt(id);
    if (isNaN(accountId)) return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });

    const rows = await db
      .select({
        id: clientService.id,
        accountId: clientService.accountId,
        serviceId: clientService.serviceId,
        createdAt: clientService.createdAt,
        createdBy: clientService.createdBy,
        service: { id: service.id, name: service.name },
      })
      .from(clientService)
      .innerJoin(service, eq(clientService.serviceId, service.id))
      .where(eq(clientService.accountId, accountId));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching client services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ client: ['update'] });

    const { id } = await params;
    const accountId = parseInt(id);
    const body = await request.json();

    if (isNaN(accountId)) return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    if (!body.serviceId || !body.createdBy) return NextResponse.json({ error: 'Missing serviceId or createdBy' }, { status: 400 });

    const serviceIdInt = parseInt(body.serviceId);

    const existing = await db
      .select({ id: clientService.id })
      .from(clientService)
      .where(and(eq(clientService.accountId, accountId), eq(clientService.serviceId, serviceIdInt)))
      .limit(1);

    if (existing.length > 0) return NextResponse.json({ error: 'Service already assigned to this client' }, { status: 409 });

    const newRow = await db
      .insert(clientService)
      .values({ accountId, serviceId: serviceIdInt, createdBy: body.createdBy, createdAt: new Date().toISOString() })
      .returning();

    return NextResponse.json(newRow[0], { status: 201 });
  } catch (error) {
    console.error('Error assigning service:', error);
    return NextResponse.json({ error: 'Failed to assign service' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ client: ['update'] });

    const { id } = await params;
    const accountId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const serviceId = parseInt(searchParams.get('serviceId') ?? '');

    if (isNaN(accountId) || isNaN(serviceId)) return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });

    await db
      .delete(clientService)
      .where(and(eq(clientService.accountId, accountId), eq(clientService.serviceId, serviceId)));

    return NextResponse.json({ message: 'Service removed' });
  } catch (error) {
    console.error('Error removing service:', error);
    return NextResponse.json({ error: 'Failed to remove service' }, { status: 500 });
  }
}
