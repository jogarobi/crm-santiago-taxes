import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    await requirePermission({ staff: ['create'] });

    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.name || !body.role) {
      return NextResponse.json(
        {
          error: 'Missing required fields: email, password, name, role',
        },
        { status: 400 }
      );
    }

    if (!['owner', 'admin', 'staff'].includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create the Supabase auth user with the role stored in app_metadata.
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { name: body.name },
      app_metadata: { role: body.role },
    });

    if (error || !data.user) {
      console.error('User creation failed:', error);

      if (error?.message?.toLowerCase().includes('already')) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error?.message || 'Failed to create user account' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: body.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create user',
      },
      { status: 500 }
    );
  }
}
