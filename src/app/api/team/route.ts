import { NextResponse } from 'next/server';
import { square } from '@/app/api/client';
import type { TeamMember } from '@/lib/types/team';

// GET /api/team - Search/list all team members
export async function GET() {
  try {
    const response = await square.teamMembers.search({
      query: {
        filter: {
          status: 'ACTIVE',
        },
      },
    });

    // Serialize BigInt values to strings for JSON compatibility
    const serializedTeamMembers: TeamMember[] = JSON.parse(
      JSON.stringify(response.teamMembers || [], (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    // Extract just the TeamMember objects (not the wrapper)
    const teamMembers = serializedTeamMembers.map((tm: any) => tm.teamMember || tm);

    return NextResponse.json({
      success: true,
      teamMembers,
    });
  } catch (error) {
    console.error('Error searching team members:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search team members',
        message:
          error instanceof Error
            ? error.message
            : 'Internal server error occurred',
      },
      { status: 500 }
    );
  }
}
