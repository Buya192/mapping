import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const [
      { count: gardu },
      { count: tiang },
      { count: jtm },
      { count: jtr },
      { count: sr },
      { count: pelanggan },
      { count: hardware },
    ] = await Promise.all([
      supabase.from('gardus').select('id', { count: 'exact', head: true }),
      supabase.from('tiang_jtm').select('id', { count: 'exact', head: true }),
      supabase.from('jtm_segments').select('id', { count: 'exact', head: true }),
      supabase.from('jtr_segments').select('id', { count: 'exact', head: true }),
      supabase.from('sr_lines').select('id', { count: 'exact', head: true }),
      supabase.from('pelanggan').select('id', { count: 'exact', head: true }),
      supabase.from('hardware_items').select('id', { count: 'exact', head: true }),
    ]);

    const pembangkit = (await supabase.from('hardware_items').select('id', { count: 'exact', head: true }).eq('type', 'pembangkit')).count || 0;
    const fco = (await supabase.from('hardware_items').select('id', { count: 'exact', head: true }).eq('type', 'fco')).count || 0;
    const recloser = (await supabase.from('hardware_items').select('id', { count: 'exact', head: true }).eq('type', 'recloser')).count || 0;
    const arcgis = (await supabase.from('arcgis_points').select('id', { count: 'exact', head: true })).count || 0;

    const total = (gardu || 0) + (tiang || 0) + (jtm || 0) + (jtr || 0) + (sr || 0) + (pelanggan || 0) + (arcgis || 0) + (pembangkit || 0) + (fco || 0) + (recloser || 0);

    return NextResponse.json({
      gardu: gardu || 0,
      tiang: tiang || 0,
      jtm: jtm || 0,
      jtr: jtr || 0,
      sr: sr || 0,
      pelanggan: pelanggan || 0,
      arcgis,
      pembangkit,
      fco,
      recloser,
      total,
    });
  } catch (error) {
    console.error('Counts API Error:', error);
    return NextResponse.json({
      gardu: 0, tiang: 0, jtm: 0, jtr: 0, sr: 0, pelanggan: 0,
      arcgis: 0, pembangkit: 0, fco: 0, recloser: 0, total: 0,
    }, { status: 500 });
  }
}
