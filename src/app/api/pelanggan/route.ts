import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('pelanggan')
      .select('*')
      .order('id');

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Pelanggan API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
