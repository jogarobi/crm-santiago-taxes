import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
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

    // Get the current session to verify permissions and get organization ID
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the active organization
    const activeOrg = session.session.activeOrganizationId;
    if (!activeOrg) {
      return NextResponse.json(
        { error: 'No active organization found' },
        { status: 400 }
      );
    }

    // Step 1: Create the user account
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
    });

    if (!signUpResult || !signUpResult.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Step 2: Add the user to the organization with the specified role
    await auth.api.addMember({
      body: {
        userId: signUpResult.user.id,
        organizationId: activeOrg,
        role: body.role,
      },
    });

    return NextResponse.json(
      {
        message: 'User created and added to organization successfully',
        user: {
          id: signUpResult.user.id,
          email: signUpResult.user.email,
          name: signUpResult.user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Handle specific error cases
    if (error?.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
