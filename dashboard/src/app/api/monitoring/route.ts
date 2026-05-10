import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const payload = await request.json();
  const apiKey = request.headers.get('x-api-key');

  if (apiKey !== process.env.MONITORING_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Hitung total aplikasi dari payload
    const appsCount = payload.installed_apps?.length || 0;

    // Update data asset utama termasuk apps_count
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
        battery_wear_level: payload.battery?.wearLevel,
        
        // Network & Location
        public_ip: payload.network?.publicIp,
        location_city: payload.location?.city,
        location_region: payload.location?.region,
        location_country: payload.location?.country,

        // Apps Count (Sederhana & Cepat)
        apps_count: appsCount,
        
        last_seen: new Date().toISOString(),
        full_payload: payload
      }, { onConflict: 'serial_number' })
      .select()
      .single();

    if (assetError) throw assetError;

    // Note: Kita berhenti menyimpan ke tabel asset_installed_apps untuk optimasi load
    
    return NextResponse.json({ success: true, message: `Sync complete for ${payload.hostname} with ${appsCount} apps` });
  } catch (error: any) {
    console.error('Monitoring API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
