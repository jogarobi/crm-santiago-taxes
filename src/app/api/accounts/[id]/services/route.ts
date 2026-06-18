import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

type ProvidedServiceRow = {
  id: number;
  clientId: number | null;
  serviceId: number;
  createdAt: string;
  createdBy: string;
  Services: { id: number; name: string | null } | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ client: ['read'] });

    const { id } = await params;
    const accountId = parseInt(id);
    if (isNaN(accountId))
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('ProvidedServices')
      .select('id, clientId, serviceId, createdAt, createdBy, Services(id, name)')
      .eq('clientId', accountId);

    if (error) throw error;

    const rows = (data ?? []).map((r) => {
      const row = r as ProvidedServiceRow;
      return {
        id: row.id,
        accountId: row.clientId,
        serviceId: row.serviceId,
        createdAt: row.createdAt,
        createdBy: row.createdBy,
        service: row.Services
          ? { id: row.Services.id, name: row.Services.name }
          : null,
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching client services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
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

    if (isNaN(accountId))
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    if (!body.serviceId || !body.createdBy)
      return NextResponse.json(
        { error: 'Missing serviceId or createdBy' },
        { status: 400 }
      );

    const serviceIdInt = parseInt(body.serviceId);

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('ProvidedServices')
      .select('id')
      .eq('clientId', accountId)
      .eq('serviceId', serviceIdInt)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing)
      return NextResponse.json(
        { error: 'Service already assigned to this client' },
        { status: 409 }
      );

    const { data, error } = await supabaseAdmin
      .from('ProvidedServices')
      .insert({
        clientId: accountId,
        serviceId: serviceIdInt,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { ...data, accountId: data.clientId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error assigning service:', error);
    return NextResponse.json(
      { error: 'Failed to assign service' },
      { status: 500 }
    );
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

    if (isNaN(accountId) || isNaN(serviceId))
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('ProvidedServices')
      .delete()
      .eq('clientId', accountId)
      .eq('serviceId', serviceId);

    if (error) throw error;

    return NextResponse.json({ message: 'Service removed' });
  } catch (error) {
    console.error('Error removing service:', error);
    return NextResponse.json(
      { error: 'Failed to remove service' },
      { status: 500 }
    );
  }
}
