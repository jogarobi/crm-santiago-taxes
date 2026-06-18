import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin, nextId } from '@/lib/supabase/admin';

// Builds a userId -> role map from Supabase auth users.
async function getRoleMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) {
    console.error('Failed to list users for role map:', error);
    return map;
  }
  for (const user of data.users) {
    const role =
      (user.app_metadata?.role as string | undefined) ??
      (user.user_metadata?.role as string | undefined);
    if (role) map.set(user.id, role);
  }
  return map;
}

export async function GET(request: Request) {
  try {
    await requirePermission({ staff: ['read'] });
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    let query = supabaseAdmin
      .from('Staff')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false });

    if (search) {
      query = query.or(
        `firstName.ilike.%${search}%,lastName.ilike.%${search}%,title.ilike.%${search}%`
      );
    }

    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const roleMap = await getRoleMap();
    const staffMembers = (data ?? []).map((s) => ({
      ...s,
      role: s.userId ? roleMap.get(s.userId) ?? null : null,
    }));

    const total = count ?? 0;
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

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    if (!body.role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Create the auth user (role stored in app_metadata).
    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { name: `${body.firstName} ${body.lastName}` },
        app_metadata: { role: body.role },
      });

    if (createError || !created.user) {
      console.error('User creation failed:', createError);
      if (createError?.message?.toLowerCase().includes('already')) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user account' },
        { status: 500 }
      );
    }

    const { data: newStaff, error: staffError } = await supabaseAdmin
      .from('Staff')
      .insert({
        id: await nextId('Staff'),
        firstName: body.firstName,
        lastName: body.lastName,
        title: body.title,
        status: body.status,
        email: body.email || null,
        squareId: body.squareId || null,
        userId: created.user.id,
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (staffError) {
      // Roll back the auth user so we don't leave an orphaned login.
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw staffError;
    }

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    console.error('Error creating staff member:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
