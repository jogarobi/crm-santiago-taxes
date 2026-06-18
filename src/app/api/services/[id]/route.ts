import { NextResponse } from 'next/server';
import { requirePermission, actorFromSession } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/db/db.types';

type ServiceUpdate = Database['public']['Tables']['Services']['Update'];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ service: ['read'] });

    const { id } = await params;
    const serviceId = parseInt(id);

    if (isNaN(serviceId)) {
      return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('Services')
      .select('*')
      .eq('id', serviceId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, service: data });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ service: ['update'] });

    const { id } = await params;
    const serviceId = parseInt(id);
    const body = await request.json();

    if (isNaN(serviceId)) {
      return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
    }

    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Missing required field: updatedBy' },
        { status: 400 }
      );
    }

    const updateData: ServiceUpdate = {
      updatedBy: body.updatedBy,
      updatedAt: new Date().toISOString(),
    };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const { data, error } = await supabaseAdmin
      .from('Services')
      .update(updateData)
      .eq('id', serviceId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, service: data });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await requirePermission({ service: ['delete'] });
    const actor = actorFromSession(session);

    const { id } = await params;
    const serviceId = parseInt(id);

    if (isNaN(serviceId)) {
      return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('Services')
      .select('id')
      .eq('id', serviceId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to 0.
    const { error } = await supabaseAdmin
      .from('Services')
      .update({
        isActive: 0,
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
      })
      .eq('id', serviceId);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Service deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
