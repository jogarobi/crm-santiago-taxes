import { NextResponse } from 'next/server';
import { square } from '@/app/api/clients';
import { db } from '@/lib/db';
import { appointment, clientAccount, staff } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';
import type * as Square from 'square';

async function resolveServiceName(serviceVariationId: string): Promise<string | null> {
  try {
    const catalogResponse = await square.catalog.object.get({
      objectId: serviceVariationId,
      includeRelatedObjects: true,
    });
    const relatedObjects = catalogResponse.relatedObjects || [];
    const serviceObject = relatedObjects.find((obj) => obj.type === 'ITEM');
    return serviceObject?.itemData?.name || null;
  } catch {
    return null;
  }
}

async function resolveStaffId(teamMemberId: string): Promise<number | null> {
  try {
    const existing = await db.select().from(staff).where(eq(staff.squareId, teamMemberId)).limit(1);
    if (existing.length > 0) return existing[0].id;

    const result = await square.teamMembers.get({ teamMemberId });
    if (!result.teamMember) return null;

    const inserted = await db.insert(staff).values({
      squareId: result.teamMember.id || '',
      title: result.teamMember.wageSetting?.jobAssignments?.[0]?.jobTitle || 'Staff',
      status: result.teamMember.status || 'INACTIVE',
      firstName: result.teamMember.givenName || 'Unknown',
      lastName: result.teamMember.familyName || 'Unknown',
      createdAt: new Date().toISOString(),
      createdBy: 'SQUARE_SYNC',
    });
    return inserted.lastInsertRowid ? Number(inserted.lastInsertRowid) : null;
  } catch {
    return null;
  }
}

const CANCELLED_STATUSES = new Set([
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_SELLER',
  'DECLINED',
]);

export async function POST(request: Request) {
  try {
    await requirePermission({ appointment: ['read'] });

    const locationId = process.env.SQUARE_LOCATION_ID!;

    const body = await request.json().catch(() => ({}));
    let startAt: string;
    let endAt: string;

    if (body.startAtMin && body.startAtMax) {
      startAt = body.startAtMin;
      endAt = body.startAtMax;
    } else {
      // Default: current week Sunday → Saturday
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      startAt = start.toISOString();
      endAt = end.toISOString();
    }

    const page = await square.bookings.list({
      locationId,
      startAtMin: startAt,
      startAtMax: endAt,
      limit: 100,
    });

    const bookings: Square.Booking[] = [];
    for await (const booking of page) {
      bookings.push(booking);
    }

    let synced = 0;

    for (const booking of bookings) {
      if (!booking.id) continue;

      const bookingId = booking.id;
      const customerId = booking.customerId;
      const status = booking.status ?? 'PENDING';
      const startAt = booking.startAt ?? new Date().toISOString();
      const creatorDetails = booking.creatorDetails;
      const segment = booking.appointmentSegments?.[0];
      const durationMinutes = segment?.durationMinutes ?? 60;
      const endAt = new Date(new Date(startAt).getTime() + durationMinutes * 60000).toISOString();

      // Resolve customer
      let accountId: number | null = null;
      let accountName: string | null = null;
      if (customerId) {
        const accounts = await db.select().from(clientAccount).where(eq(clientAccount.squareId, customerId)).limit(1);
        if (accounts.length > 0) {
          accountId = accounts[0].id ?? null;
          accountName = `${accounts[0].firstName} ${accounts[0].lastName}`;
        } else {
          try {
            const customerResponse = await square.customers.get({ customerId });
            const customer = customerResponse.customer;
            if (customer) {
              accountName = `${customer.givenName || ''} ${customer.familyName || ''}`.trim() || null;
            }
          } catch { /* ignore */ }
        }
      }

      // Resolve service and staff
      const serviceVariationId = segment?.serviceVariationId;
      const teamMemberId = segment?.teamMemberId;
      const serviceName = serviceVariationId ? await resolveServiceName(serviceVariationId) : null;
      const staffId = teamMemberId ? await resolveStaffId(teamMemberId) : null;

      const values = {
        squareId: bookingId,
        accountSquareId: customerId || 'N/A',
        status,
        startAt,
        endAt,
        durationMinutes,
        staffId,
        accountId,
        accountName,
        service: serviceName,
        creatorType: creatorDetails?.creatorType || 'CUSTOMER',
        updatedAt: new Date().toISOString(),
        updatedBy: 'SQUARE_SYNC',
      };

      const existing = await db.select().from(appointment).where(eq(appointment.squareId, bookingId)).limit(1);

      if (existing.length === 0) {
        if (CANCELLED_STATUSES.has(status)) continue;
        await db.insert(appointment).values({
          ...values,
          createdAt: new Date().toISOString(),
          createdBy: 'SQUARE_SYNC',
        });
      } else {
        await db.update(appointment).set(values).where(eq(appointment.squareId, bookingId));
      }

      synced++;
    }

    return NextResponse.json({
      success: true,
      synced,
      weekStart: startAt,
      weekEnd: endAt,
    });
  } catch (error) {
    console.error('Error syncing appointments from Square:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
