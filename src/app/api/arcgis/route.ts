import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('arcgis_points')
      .select('*')
      .order('id');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: (data || []).length,
      data: data || [],
    });
  } catch (error: any) {
    console.error('Error fetching arcgis points:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch points' },
      { status: 500 }
    );
  }
}
