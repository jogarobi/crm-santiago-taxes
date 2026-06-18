import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('BusinessTypes').select('*');

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error fetching business entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business entities' },
      { status: 500 }
    );
  }
}
