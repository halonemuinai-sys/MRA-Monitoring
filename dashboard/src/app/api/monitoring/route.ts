import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const payload = await request.json();
  const apiKey = request.headers.get('x-api-key');

  if (apiKey !== process.env.MONITORING_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Upsert data asset utama
    const { data: asset, error: assetError } = await supabase
      .from('assets_monitoring')
      .upsert({
        serial_number: payload.serialNumber,
        hostname: payload.hostname,
        current_user_name: payload.currentUser,
        manufacturer: payload.manufacturer,
        model: payload.model,
        os_version: payload.os,
        cpu_type: payload.cpu,
        gpu_type: payload.gpu,
        
        // Hardware
        ram_gb: payload.hardware?.ramGB,
        storage_total_gb: payload.hardware?.diskTotalGB,
        storage_free_gb: payload.hardware?.diskFreeGB,
        
        // Security
        antivirus_name: payload.security?.antivirus,
        firewall_status: payload.security?.firewall,
        bitlocker_status: payload.security?.bitlocker,
        
        // Network
        public_ip: payload.network?.publicIp,

        // Location
        location_city: payload.location?.city,
        location_region: payload.location?.region,
        location_country: payload.location?.country,
        
        last_seen: new Date().toISOString(),
        full_payload: payload
      }, { onConflict: 'serial_number' })
      .select()
      .single();

    if (assetError) throw assetError;

    // 2. Jika ada daftar aplikasi, simpan ke tabel terpisah
    if (payload.installed_apps && Array.isArray(payload.installed_apps) && asset) {
      // Hapus data aplikasi lama untuk asset ini (Full Snapshot Refresh)
      await supabase
        .from('asset_installed_apps')
        .delete()
        .eq('asset_id', asset.id);

      // Siapkan data aplikasi untuk di-insert massal
      const appsToInsert = payload.installed_apps.map((app: any) => ({
        asset_id: asset.id,
        app_name: app.DisplayName || 'Unknown App',
        app_version: app.DisplayVersion || 'N/A'
      }));

      // Insert massal (bulk insert) untuk performa tinggi
      if (appsToInsert.length > 0) {
        const { error: appsError } = await supabase
          .from('asset_installed_apps')
          .insert(appsToInsert);
        
        if (appsError) debugPrint("Error inserting apps: " + appsError.message);
      }
    }

    return NextResponse.json({ success: true, message: `Sync complete for ${payload.hostname}` });
  } catch (error: any) {
    console.error('Monitoring API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
