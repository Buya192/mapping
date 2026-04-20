import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type');

    if (type === 'gardu') {
      const { data: gardus, error } = await supabase
        .from('gardus')
        .select('*')
        .order('name');
      if (error) throw error;
      return NextResponse.json(gardus || []);
    }

    if (type === 'tiang') {
      const { data: tiang, error } = await supabase
        .from('tiang_jtm')
        .select('id, nama_tiang, penyulang, jenis_tiang, tipe_tiang, kekuatan_tiang, konstruksi_1, jenis_hantaran_1, ukuran_hantaran_1, penopang, latitude, longitude, "namaGardu", "kondisiTiang"')
        .order('id');
      if (error) throw error;
      return NextResponse.json(tiang || []);
    }

    // Default: return both (for dashboard/store)
    const { data: garduData, error: garduErr } = await supabase
      .from('gardus')
      .select('id, name, "namaGardu", feeder, capacity_kva, construction, brand, lat, lng')
      .order('name');
    if (garduErr) throw garduErr;

    const gardus = (garduData || []).map((g: any) => ({
      ...g,
      nama: g.namaGardu || g.name || 'Unnamed',
      penyulang: g.feeder || '',
      kapasitas_kva: g.capacity_kva || 0,
      kapasitas_mva: 0,
      jenis_konstruksi: g.construction || 'Portal',
    }));

    const { data: tiangData, error: tiangErr } = await supabase
      .from('tiang_jtm')
      .select('id, nama_tiang, penyulang, tipe_tiang, kekuatan_tiang, jenis_hantaran_1, ukuran_hantaran_1, penopang, latitude, longitude')
      .limit(500)
      .order('id');
    if (tiangErr) throw tiangErr;

    const tiangJTM = (tiangData || []).map((t: any) => ({
      ...t,
      lat: t.latitude,
      lng: t.longitude,
    }));

    return NextResponse.json({ gardus, tiangJTM });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
