import { NextResponse } from 'next/server';
import { square } from '@/app/api/clients';
import {
  TeamMember,
  TeamMemberResponse,
  TeamMemberErrorResponse,
} from '@/lib/types/team';

// GET /api/team/[id] - Retrieve a single team member
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      const errorResponse: TeamMemberErrorResponse = {
        success: false,
        error: 'Missing team member ID',
        message: 'Team member ID is required',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const response = await square.teamMembers.get({
      teamMemberId: id,
    });

    // Serialize BigInt values to strings for JSON compatibility
    const serializedTeamMember: TeamMember = JSON.parse(
      JSON.stringify(response.teamMember || {}, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    const teamMemberResponse: TeamMemberResponse = {
      success: true,
      teamMember: serializedTeamMember,
    };

    return NextResponse.json(teamMemberResponse);
  } catch (error) {
    console.error('Error fetching team member:', error);
    const errorResponse: TeamMemberErrorResponse = {
      success: false,
      error: 'Failed to fetch team member',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
