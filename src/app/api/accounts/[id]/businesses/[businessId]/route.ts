import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/db/db.types';

type BusinessUpdate = Database['public']['Tables']['Businesses']['Update'];

type BusinessRow = {
  id: number;
  name: string;
  establishedAt: string;
  ein: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  typeId: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  BusinessTypes?: { id: number; name: string } | null;
};

function mapBusiness(b: BusinessRow, accountId: number) {
  return {
    id: b.id,
    accountId,
    registeredName: b.name,
    establishedDate: b.establishedAt,
    ein: b.ein,
    address: b.address,
    city: b.city,
    state: b.state,
    zipCode: b.zipCode,
    entityId: b.typeId,
    createdAt: b.createdAt,
    createdBy: b.createdBy,
    updatedAt: b.updatedAt,
    updatedBy: b.updatedBy,
    entity: b.BusinessTypes
      ? { id: b.BusinessTypes.id, name: b.BusinessTypes.name }
      : undefined,
  };
}

async function isLinked(
  businessId: number,
  accountId: number
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('ClientBusiness')
    .select('id')
    .eq('businessId', businessId)
    .eq('clientId', accountId)
    .maybeSingle();
  return !!data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; businessId: string }> }
) {
  try {
    await requirePermission({ business: ['read'] });

    const { id, businessId } = await params;
    const accountId = parseInt(id);
    const businessIdInt = parseInt(businessId);

    if (isNaN(accountId) || isNaN(businessIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or business ID' },
        { status: 400 }
      );
    }

    if (!(await isLinked(businessIdInt, accountId))) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { data: business, error } = await supabaseAdmin
      .from('Businesses')
      .select('*, BusinessTypes(id, name)')
      .eq('id', businessIdInt)
      .maybeSingle();

    if (error) throw error;
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Primary account (the one in the URL) plus all associated accounts.
    const { data: account } = await supabaseAdmin
      .from('Clients')
      .select('id, firstName, lastName')
      .eq('id', accountId)
      .maybeSingle();

    const { data: links } = await supabaseAdmin
      .from('ClientBusiness')
      .select('Clients(id, firstName, lastName)')
      .eq('businessId', businessIdInt);

    const accounts = (links ?? [])
      .map((l) => l.Clients)
      .filter(
        (c): c is { id: number; firstName: string; lastName: string } =>
          c !== null
      );

    return NextResponse.json({
      ...mapBusiness(business as BusinessRow, accountId),
      account: account ?? undefined,
      accounts,
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; businessId: string }> }
) {
  try {
    await requirePermission({ business: ['update'] });

    const { id, businessId } = await params;
    const accountId = parseInt(id);
    const businessIdInt = parseInt(businessId);
    const body = await request.json();

    if (isNaN(accountId) || isNaN(businessIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or business ID' },
        { status: 400 }
      );
    }

    if (!(await isLinked(businessIdInt, accountId))) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const updateData: BusinessUpdate = {
      updatedBy: body.updatedBy,
      updatedAt: new Date().toISOString(),
    };
    if (body.registeredName !== undefined) updateData.name = body.registeredName;
    if (body.establishedDate !== undefined)
      updateData.establishedAt = body.establishedDate || '';
    if (body.ein !== undefined) updateData.ein = body.ein || '';
    if (body.address !== undefined) updateData.address = body.address || '';
    if (body.city !== undefined) updateData.city = body.city || '';
    if (body.state !== undefined) updateData.state = body.state || '';
    if (body.zipCode !== undefined)
      updateData.zipCode = body.zipCode != null ? String(body.zipCode) : '';
    if (body.entityId !== undefined) updateData.typeId = Number(body.entityId);

    const { data: updated, error } = await supabaseAdmin
      .from('Businesses')
      .update(updateData)
      .eq('id', businessIdInt)
      .select('*, BusinessTypes(id, name)')
      .single();

    if (error) throw error;

    return NextResponse.json(mapBusiness(updated as BusinessRow, accountId));
  } catch (error) {
    console.error('Error updating business:', error);
    return NextResponse.json(
      { error: 'Failed to update business' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; businessId: string }> }
) {
  try {
    await requirePermission({ business: ['delete'] });

    const { id, businessId } = await params;
    const accountId = parseInt(id);
    const businessIdInt = parseInt(businessId);

    if (isNaN(accountId) || isNaN(businessIdInt)) {
      return NextResponse.json(
        { error: 'Invalid account ID or business ID' },
        { status: 400 }
      );
    }

    if (!(await isLinked(businessIdInt, accountId))) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Remove junction links first, then the business itself.
    await supabaseAdmin
      .from('ClientBusiness')
      .delete()
      .eq('businessId', businessIdInt);

    const { error } = await supabaseAdmin
      .from('Businesses')
      .delete()
      .eq('id', businessIdInt);

    if (error) throw error;

    return NextResponse.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    return NextResponse.json(
      { error: 'Failed to delete business' },
      { status: 500 }
    );
  }
}
