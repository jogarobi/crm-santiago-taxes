import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ businessId: string; accountId: string }> }
) {
  try {
    await requirePermission({ business: ['update'] });

    const { businessId, accountId } = await params;
    const businessIdInt = parseInt(businessId);
    const accountIdInt = parseInt(accountId);

    if (isNaN(businessIdInt) || isNaN(accountIdInt)) {
      return NextResponse.json(
        { error: 'Invalid business ID or account ID' },
        { status: 400 }
      );
    }

    const { data: links, error: linksError } = await supabaseAdmin
      .from('ClientBusiness')
      .select('id, clientId')
      .eq('businessId', businessIdInt);

    if (linksError) throw linksError;

    const link = (links ?? []).find((l) => l.clientId === accountIdInt);
    if (!link) {
      return NextResponse.json(
        { error: 'Account is not associated with this business' },
        { status: 404 }
      );
    }

    if ((links ?? []).length <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the only person linked to this business' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('ClientBusiness')
      .delete()
      .eq('businessId', businessIdInt)
      .eq('clientId', accountIdInt);

    if (error) throw error;

    return NextResponse.json({
      message: 'Account removed from business successfully',
    });
  } catch (error) {
    console.error('Error removing account from business:', error);
    return NextResponse.json(
      { error: 'Failed to remove account from business' },
      { status: 500 }
    );
  }
}
