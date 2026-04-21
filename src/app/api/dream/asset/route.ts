import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch assets for verification map
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table') || 'tiang_jtm';
    const penyulang = searchParams.get('penyulang');
    const verified = searchParams.get('verified');
    const limit = parseInt(searchParams.get('limit') || '1000');

    let query = supabase.from(table).select('*').limit(limit);

    // Filter by penyulang/feeder
    if (penyulang) {
      const feederCol = table === 'tiang_jtm' ? 'penyulang' : 'feeder';
      query = query.eq(feederCol, penyulang);
    }

    // Filter by verification status
    if (verified === 'true') query = query.eq('verified', true);
    if (verified === 'false') query = query.eq('verified', false);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform for map display
    const assets = (data || []).map(item => {
      const lat = item.latitude || item.lat || parseFloat(item.latitudeY) || 0;
      const lng = item.longitude || item.lng || parseFloat(item.longitudeX) || 0;
      return {
        ...item,
        _lat: lat,
        _lng: lng,
        _table: table,
        _hasGPS: lat !== 0 && lng !== 0,
      };
    }).filter(item => item._hasGPS);

    return NextResponse.json({ 
      success: true, 
      count: assets.length,
      totalCount: count,
      data: assets 
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET feeders list
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.action === 'get_feeders') {
      // Get unique feeders from tiang_jtm
      const { data: tiangFeeders } = await supabase
        .from('tiang_jtm')
        .select('penyulang')
        .not('penyulang', 'is', null);

      const { data: garduFeeders } = await supabase
        .from('gardus')
        .select('feeder')
        .not('feeder', 'is', null);

      const allFeeders = new Set<string>();
      tiangFeeders?.forEach(t => { if (t.penyulang) allFeeders.add(t.penyulang); });
      garduFeeders?.forEach(g => { if (g.feeder) allFeeders.add(g.feeder); });

      const feeders = [...allFeeders].sort();
      return NextResponse.json({ success: true, feeders });
    }

    if (body.action === 'get_all_assets') {
      const penyulang = body.penyulang;
      if (!penyulang) {
        return NextResponse.json({ error: 'penyulang diperlukan' }, { status: 400 });
      }

      // Fetch from all tables
      const [tiangRes, garduRes, jtmRes, jtrRes] = await Promise.all([
        supabase.from('tiang_jtm').select('*').eq('penyulang', penyulang),
        supabase.from('gardus').select('*').eq('feeder', penyulang),
        supabase.from('jtm_segments').select('*').eq('feeder', penyulang),
        supabase.from('jtr_segments').select('*').eq('feeder', penyulang),
      ]);

      const transform = (items: Record<string, unknown>[] | null, table: string) => 
        (items || []).map(item => {
          const lat = Number(item.latitude || item.lat || item.latitudeY) || 0;
          const lng = Number(item.longitude || item.lng || item.longitudeX) || 0;
          return { ...item, _lat: lat, _lng: lng, _table: table, _hasGPS: lat !== 0 && lng !== 0 };
        }).filter(item => item._hasGPS);

      const allAssets = [
        ...transform(tiangRes.data, 'tiang_jtm'),
        ...transform(garduRes.data, 'gardus'),
        ...transform(jtmRes.data, 'jtm_segments'),
        ...transform(jtrRes.data, 'jtr_segments'),
      ];

      const totalVerified = allAssets.filter(a => (a as Record<string, unknown>).verified === true).length;

      return NextResponse.json({
        success: true,
        penyulang,
        totalAssets: allAssets.length,
        totalVerified,
        data: allAssets,
      });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
