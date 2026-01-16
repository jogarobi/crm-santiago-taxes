import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staff, member, user } from '@/db/migrations/schema';
import { like, or, desc, sql, eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    await requirePermission({ staff: ['read'] });
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Build where conditions
    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          like(staff.firstName, `%${search}%`),
          like(staff.lastName, `%${search}%`),
          like(staff.title, `%${search}%`),
          like(sql`CAST(${staff.id} AS TEXT)`, `%${search}%`)
        )
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(staff)
      .where(whereConditions.length > 0 ? or(...whereConditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated staff with role from member table
    const staffMembers = await db
      .select({
        id: staff.id,
        userId: staff.userId,
        squareId: staff.squareId,
        title: staff.title,
        status: staff.status,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        createdAt: staff.createdAt,
        createdBy: staff.createdBy,
        updatedAt: staff.updatedAt,
        updatedBy: staff.updatedBy,
        role: member.role,
      })
      .from(staff)
      .leftJoin(user, eq(staff.userId, user.id))
      .leftJoin(member, eq(user.id, member.userId))
      .where(whereConditions.length > 0 ? or(...whereConditions) : undefined)
      .orderBy(desc(staff.createdAt))
      .limit(pageSize)
      .offset(pageIndex * pageSize);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: staffMembers,
      meta: {
        total,
        pageIndex,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission({ staff: ['create'] });

    const body = await request.json();

    if (
      !body.firstName ||
      !body.lastName ||
      !body.title ||
      !body.status ||
      !body.createdBy
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: firstName, lastName, title, status, createdBy',
        },
        { status: 400 }
      );
    }

    // Email, password, and role are now required for all staff members
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    if (!body.role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    let userId = null;

    // Create user account (always required)
    console.log('Creating user account for staff member:', body.email, 'with role:', body.role);
    try {
      const createUserResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/staff/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            name: `${body.firstName} ${body.lastName}`,
            email: body.email,
            password: body.password,
            role: body.role,
          }),
        }
      );

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json();
        console.error('User creation failed:', errorData);
        return NextResponse.json(
          { error: errorData.error || 'Failed to create user account' },
          { status: createUserResponse.status }
        );
      }

      const userData = await createUserResponse.json();
      console.log('User created successfully, data:', userData);
      userId = userData.user?.id || null;
      console.log('Extracted userId:', userId);
    } catch (error) {
      console.error('Error creating user account:', error);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    console.log('Creating staff record with userId:', userId);
    const newStaff = await db
      .insert(staff)
      .values({
        firstName: body.firstName,
        lastName: body.lastName,
        title: body.title,
        status: body.status,
        email: body.email || null,
        squareId: body.squareId || null,
        userId: userId,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .returning();

    console.log('Staff member created:', newStaff[0]);
    return NextResponse.json(newStaff[0], { status: 201 });
  } catch (error) {
    console.error('Error creating staff member:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
