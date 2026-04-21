import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ASSET_TABLES = ['tiang_jtm', 'gardus', 'jtm_segments', 'jtr_segments', 'pelanggan'] as const;

// GET: Get verification progress per feeder
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const penyulang = searchParams.get('penyulang');
    const table = searchParams.get('table');

    if (penyulang) {
      const progress: Record<string, { total: number; verified: number }> = {};
      const tablesToCheck = table ? [table] : [...ASSET_TABLES];
      
      for (const t of tablesToCheck) {
        const feederCol = t === 'tiang_jtm' ? 'penyulang' : 'feeder';
        
        const { count: total } = await supabase
          .from(t)
          .select('*', { count: 'exact', head: true })
          .eq(feederCol, penyulang);
        
        const { count: verified } = await supabase
          .from(t)
          .select('*', { count: 'exact', head: true })
          .eq(feederCol, penyulang)
          .eq('verified', true);

        progress[t] = { total: total || 0, verified: verified || 0 };
      }

      return NextResponse.json({ success: true, penyulang, progress });
    }

    const overallProgress: Record<string, { total: number; verified: number }> = {};
    
    for (const t of ASSET_TABLES) {
      const { count: total } = await supabase
        .from(t)
        .select('*', { count: 'exact', head: true });
      
      const { count: verified } = await supabase
        .from(t)
        .select('*', { count: 'exact', head: true })
        .eq('verified', true);

      overallProgress[t] = { total: total || 0, verified: verified || 0 };
    }

    return NextResponse.json({ success: true, progress: overallProgress });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST: Verify / edit / create asset
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, asset_table, asset_id, data, verified_by, notes, latitude, longitude, photo_url } = body;

    if (!action || !asset_table) {
      return NextResponse.json({ error: 'action dan asset_table diperlukan' }, { status: 400 });
    }

    if (action === 'verify') {
      const { error } = await supabase
        .from(asset_table)
        .update({ 
          verified: true, 
          verified_by, 
          verified_at: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', asset_id);

      if (error) throw error;

      await supabase.from('verifikasi_log').insert({
        asset_table, asset_id, action: 'verify',
        verified_by, latitude, longitude, photo_url, notes,
      });

      return NextResponse.json({ success: true, message: 'Aset berhasil diverifikasi' });
    }

    if (action === 'edit') {
      if (!data || !asset_id) {
        return NextResponse.json({ error: 'data dan asset_id diperlukan' }, { status: 400 });
      }

      const { data: oldData } = await supabase
        .from(asset_table).select('*').eq('id', asset_id).single();

      const fieldChanges: Record<string, { old: unknown; new: unknown }> = {};
      if (oldData) {
        for (const [key, val] of Object.entries(data)) {
          if (oldData[key] !== val) {
            fieldChanges[key] = { old: oldData[key], new: val };
          }
        }
      }

      const updateData = {
        ...data,
        verified: true, verified_by,
        verified_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        changeby: verified_by,
        changedate: new Date().toISOString(),
      };

      const { error } = await supabase
        .from(asset_table).update(updateData).eq('id', asset_id);

      if (error) throw error;

      await supabase.from('verifikasi_log').insert({
        asset_table, asset_id, action: 'edit',
        field_changes: fieldChanges,
        verified_by, latitude, longitude, photo_url, notes,
      });

      return NextResponse.json({ success: true, message: 'Aset berhasil diperbarui & diverifikasi' });
    }

    if (action === 'create') {
      if (!data) {
        return NextResponse.json({ error: 'data diperlukan' }, { status: 400 });
      }

      const insertData = {
        ...data,
        verified: true, verified_by,
        verified_at: new Date().toISOString(),
        dream_status: 'ACTIVE',
        changeby: verified_by,
        changedate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: newAsset, error } = await supabase
        .from(asset_table).insert(insertData).select().single();

      if (error) throw error;

      await supabase.from('verifikasi_log').insert({
        asset_table, asset_id: newAsset?.id, action: 'create',
        verified_by, latitude, longitude, photo_url, notes,
        penyulang: data.penyulang || data.feeder,
      });

      return NextResponse.json({ success: true, message: 'Aset baru berhasil ditambahkan', asset: newAsset });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
