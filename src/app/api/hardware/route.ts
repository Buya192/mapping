import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type');

    let query = supabase.from('hardware_items').select('*').order('name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Hardware API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
