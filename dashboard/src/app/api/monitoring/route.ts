import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      hostname, 
      serialNumber, 
      manufacturer, 
      model, 
      currentUser,
      os,
      cpu,
      gpu,
      hardware,
      security,
      battery,
      network,
      location,
      installed_apps,
      api_key 
    } = body;

    // Security Check (API Key handling)
    // Note: In your agent it sends 'x-api-key' in header, but body also works if you want
    
    // 1. Upsert Asset Monitoring Record
    const { data: asset, error: assetError } = await supabase
      .from('assets_monitoring')
      .upsert({
        hostname,
        serial_number: serialNumber,
        manufacturer,
        model,
        current_user_name: currentUser,
        os_version: os,
        cpu_type: cpu,
        gpu_type: gpu,
        ram_gb: hardware?.ramGB,
        storage_free_gb: hardware?.diskFreeGB,
        storage_total_gb: hardware?.diskTotalGB,
        antivirus_name: security?.antivirus,
        firewall_status: security?.firewall,
        bitlocker_status: security?.bitlocker,
        battery_wear_level: battery?.wearLevel,
        public_ip: network?.publicIp,
        location_city: location?.city,
        location_region: location?.region,
        location_country: location?.country,
        apps_count: Array.isArray(installed_apps) ? installed_apps.length : 0,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'serial_number' })
      .select()
      .single();

    if (assetError) throw assetError;

    // 2. Sync Installed Apps with VERSION
    if (Array.isArray(installed_apps) && asset) {
      await supabase.from('asset_installed_apps').delete().eq('asset_id', asset.id);
      
      const appRecords = installed_apps.map((app: any) => ({
        asset_id: asset.id,
        app_name: app.DisplayName || app,
        app_version: app.DisplayVersion || 'Unknown'
      }));

      if (appRecords.length > 0) {
        // Chunking insert to avoid large payload errors
        const chunkSize = 100;
        for (let i = 0; i < appRecords.length; i += chunkSize) {
          const chunk = appRecords.slice(i, i + chunkSize);
          await supabase.from('asset_installed_apps').insert(chunk);
        }
      }
    }

    return NextResponse.json({ success: true, asset_id: asset.id });
  } catch (error: any) {
    console.error('Monitoring API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
