import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { service } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ service: ['read'] });

    const { id } = await params;
    const serviceId = parseInt(id);

    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(service)
      .where(eq(service.id, serviceId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      service: result[0],
    });
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
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Missing required field: updatedBy' },
        { status: 400 }
      );
    }

    const existingService = await db
      .select()
      .from(service)
      .where(eq(service.id, serviceId))
      .limit(1);

    if (existingService.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedBy: body.updatedBy,
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    const updatedService = await db
      .update(service)
      .set(updateData)
      .where(eq(service.id, serviceId))
      .returning();

    return NextResponse.json({
      success: true,
      service: updatedService[0],
    });
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
    await requirePermission({ service: ['delete'] });

    const { id } = await params;
    const serviceId = parseInt(id);

    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    const existingService = await db
      .select()
      .from(service)
      .where(eq(service.id, serviceId))
      .limit(1);

    if (existingService.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await db
      .update(service)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
      })
      .where(eq(service.id, serviceId));

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
