import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Map DREAM asset class to our table names
function getTableForAssetClass(assetclasshi: string, classstructureid: string): string {
  const cls = (assetclasshi || '').toUpperCase();
  const struct = (classstructureid || '').toUpperCase();
  
  if (cls.includes('TIANG') || struct.includes('TIANG')) return 'tiang_jtm';
  if (cls.includes('GARDU') || cls.includes('TRAFO') || struct.includes('GARDU') || struct.includes('TRAFO')) return 'gardus';
  if (cls.includes('SUTM') || cls.includes('JTM') || struct.includes('SUTM')) return 'jtm_segments';
  if (cls.includes('SUTR') || cls.includes('JTR') || cls.includes('LVCABLE') || struct.includes('SUTR')) return 'jtr_segments';
  if (cls.includes('SWITCHING') || cls.includes('LBS') || cls.includes('RECLOSER')) return 'hardware_items';
  if (cls.includes('PROTEKSI') || cls.includes('FCO') || cls.includes('LA')) return 'hardware_items';
  
  return 'tiang_jtm'; // default
}

// Transform DREAM/Maximo asset data to our DB format
function transformAssetToDb(asset: Record<string, unknown>, tableName: string) {
  const base = {
    assetnum: asset.assetnum as string,
    description: asset.description as string,
    classstructureid: asset.classstructureid as string,
    assetclasshi: asset.assetclasshi as string,
    orgid: asset.orgid as string,
    siteid: asset.siteid as string,
    parent: asset.parent as string,
    cxpenyulang: asset.cxpenyulang as string,
    cxunit: asset.cxunit as string,
    saddresscode: asset.saddresscode as string,
    changeby: asset.changeby as string,
    dream_status: asset.status as string || 'ACTIVE',
    verified: false,
    updatedAt: new Date().toISOString(),
  };

  // GPS coordinates
  const lat = parseFloat(asset.latitudey as string);
  const lng = parseFloat(asset.longitudex as string);
  
  // Service address
  const sa = asset.serviceaddress as Record<string, string> | undefined;

  if (tableName === 'tiang_jtm') {
    return {
      ...base,
      nama_tiang: asset.assetnum as string,
      penyulang: asset.cxpenyulang as string,
      latitude: isNaN(lat) ? 0 : lat,
      longitude: isNaN(lng) ? 0 : lng,
      latitudeY: asset.latitudey as string,
      longitudeX: asset.longitudex as string,
      install_date: asset.installdate as string,
      streetaddress: sa?.streetaddress,
      city: sa?.city,
      status: 'aktif',
    };
  }

  if (tableName === 'gardus') {
    return {
      ...base,
      name: asset.assetnum as string,
      namaGardu: asset.description as string,
      feeder: asset.cxpenyulang as string,
      lat: isNaN(lat) ? 0 : lat,
      lng: isNaN(lng) ? 0 : lng,
      latitudeY: asset.latitudey as string,
      longitudeX: asset.longitudex as string,
      streetaddress: sa?.streetaddress,
      city: sa?.city,
      status: 'aktif',
    };
  }

  if (tableName === 'jtm_segments') {
    return {
      ...base,
      name: asset.assetnum as string,
      feeder: asset.cxpenyulang as string,
      install_date: asset.installdate as string,
      operating_date: asset.actualoprdate as string,
      lat: isNaN(lat) ? null : lat,
      lng: isNaN(lng) ? null : lng,
      status: 'aktif',
    };
  }

  return base;
}

// POST: Pull data from Maximo API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, serverUrl, action, siteid, assetType, pageSize = 100 } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password Maximo diperlukan' }, { status: 400 });
    }

    const baseUrl = serverUrl || 'https://dev.manage.masdev.apps.eam.pusat.corp.pln.co.id';

    // Step 1: Authenticate
    if (action === 'login') {
      try {
        const authRes = await fetch(`${baseUrl}/maximo/api/script/authenticate?lean=1&upPass=1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'maxauth': Buffer.from(`${username}:${password}`).toString('base64'),
          },
          body: JSON.stringify({ username, password }),
        });

        if (!authRes.ok) {
          return NextResponse.json({ 
            error: 'Login gagal. Periksa username/password.',
            status: authRes.status 
          }, { status: 401 });
        }

        const authData = await authRes.json();
        
        // Try to get cookies for session
        const cookies = authRes.headers.get('set-cookie');

        return NextResponse.json({ 
          success: true, 
          message: 'Login berhasil',
          data: authData,
          cookies,
        });
      } catch (fetchErr) {
        return NextResponse.json({ 
          error: 'Tidak bisa terhubung ke server Maximo. Pastikan terhubung ke jaringan PLN.',
          details: String(fetchErr),
        }, { status: 503 });
      }
    }

    // Step 2: Pull asset data
    if (action === 'pull_assets') {
      const maxauth = Buffer.from(`${username}:${password}`).toString('base64');
      
      // Build OSLC select query based on asset type
      let endpoint = '';
      let select = '';
      
      if (assetType === 'xarasset') {
        endpoint = '/maximo/api/os/xarasset';
        select = 'parent,cxpenyulang,arassetid,siteid,orgid,reqnum,description,cxunit,installdate,actualoprdate,classstructureid,assetclasshi,location,groupname,priority,changeby,saddresscode,latitudey,longitudex,status,arassetspec,serviceaddress';
      } else if (assetType === 'xarlocations') {
        endpoint = '/maximo/api/os/xarlocations';
        select = 'parent,cxpenyulang,arlocationsid,siteid,orgid,reqnum,description,cxunit,installdate,actualoprdate,classstructureid,assetclasshi,location,groupname,locpriority,changeby,saddresscode,latitudey,longitudex,tujdnumber,status,arlocationspec,serviceaddress';
      } else if (assetType === 'mxapiasset') {
        endpoint = '/maximo/api/os/mxapiasset';
        select = 'classstructureid,assetnum,description,assetclasshi,siteid,orgid,latitudey,longitudex,status,installdate,manufacturer,changedate,changeby,cxpenyulang,cxunit,saddresscode,serviceaddress,assetspec,assetmeter';
      } else {
        endpoint = '/maximo/api/os/mxapiasset';
        select = '*';
      }

      let whereClause = '';
      if (siteid) whereClause = `siteid="${siteid}"`;

      const params = new URLSearchParams({
        'oslc.select': select,
        'ignorecollectionref': '1',
        'collectioncount': '1',
        'ignorekeyref': '1',
        'ignorers': '1',
        'lean': '1',
        'oslc.pageSize': String(pageSize),
      });
      if (whereClause) params.set('oslc.where', whereClause);

      try {
        const url = `${baseUrl}${endpoint}?${params.toString()}`;
        const dataRes = await fetch(url, {
          headers: {
            'maxauth': maxauth,
            'Accept': 'application/json',
          },
        });

        if (!dataRes.ok) {
          const errText = await dataRes.text();
          return NextResponse.json({
            error: `Gagal tarik data: ${dataRes.status}`,
            details: errText,
          }, { status: dataRes.status });
        }

        const rawData = await dataRes.json();
        const members = rawData.member || rawData.rdfs_member || [];
        const totalCount = rawData.totalCount || rawData.responseInfo?.totalCount || members.length;

        return NextResponse.json({
          success: true,
          totalCount,
          count: members.length,
          data: members,
        });
      } catch (fetchErr) {
        return NextResponse.json({
          error: 'Gagal terhubung ke Maximo API',
          details: String(fetchErr),
        }, { status: 503 });
      }
    }

    // Step 3: Import pulled data to Supabase
    if (action === 'import') {
      const { assets } = body;
      if (!assets || !Array.isArray(assets) || assets.length === 0) {
        return NextResponse.json({ error: 'Tidak ada data untuk diimport' }, { status: 400 });
      }

      const results = { inserted: 0, updated: 0, errors: 0, details: [] as string[] };

      for (const asset of assets) {
        try {
          const tableName = getTableForAssetClass(
            asset.assetclasshi || '',
            asset.classstructureid || ''
          );
          const dbData = transformAssetToDb(asset, tableName);
          
          // Check if asset exists by assetnum
          const { data: existing } = await supabase
            .from(tableName)
            .select('id, assetnum')
            .eq('assetnum', asset.assetnum)
            .maybeSingle();

          if (existing) {
            // Update existing
            await supabase.from(tableName).update(dbData).eq('id', existing.id);
            results.updated++;
          } else {
            // Insert new - generate ID
            const newData = { 
              ...dbData, 
              id: tableName === 'tiang_jtm' ? undefined : `DREAM-${asset.assetnum}`,
              createdAt: new Date().toISOString(),
            };
            await supabase.from(tableName).insert(newData);
            results.inserted++;
          }
        } catch (err) {
          results.errors++;
          results.details.push(`Error ${asset.assetnum}: ${String(err)}`);
        }
      }

      return NextResponse.json({ success: true, results });
    }

    // Step 4: Pull class structure (master data)
    if (action === 'pull_classstructure') {
      const maxauth = Buffer.from(`${username}:${password}`).toString('base64');
      
      try {
        const url = `${baseUrl}/maximo/api/os/mxapiclassstructure?ignorecollectionref=1&collectioncount=1&ignorekeyref=1&ignorers=1&lean=1&oslc.select=classstructureid,hierarchypath,description,sortorder,classificationid,classspec&oslc.pageSize=200`;
        const res = await fetch(url, {
          headers: { 'maxauth': maxauth, 'Accept': 'application/json' },
        });

        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        return NextResponse.json({ success: true, data: data.member || [] });
      } catch (err) {
        return NextResponse.json({ error: 'Gagal tarik class structure', details: String(err) }, { status: 503 });
      }
    }

    // Step 5: Pull penyulang/feeder list
    if (action === 'pull_feeders') {
      const maxauth = Buffer.from(`${username}:${password}`).toString('base64');
      
      try {
        // Use distance endpoint to get feeders
        const url = `${baseUrl}/maximo/api/os/mxapiasset?oslc.select=cxpenyulang,siteid&ignorecollectionref=1&lean=1&oslc.pageSize=500`;
        const res = await fetch(url, {
          headers: { 'maxauth': maxauth, 'Accept': 'application/json' },
        });

        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        const feeders = [...new Set((data.member || []).map((m: Record<string, string>) => m.cxpenyulang).filter(Boolean))];
        return NextResponse.json({ success: true, feeders });
      } catch (err) {
        return NextResponse.json({ error: 'Gagal tarik data feeder', details: String(err) }, { status: 503 });
      }
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
