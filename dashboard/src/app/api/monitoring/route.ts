import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      hostname, 
      serial_number, 
      manufacturer, 
      model, 
      current_user_name,
      os_version,
      cpu_type,
      gpu_type,
      ram_gb,
      storage_free_gb,
      storage_total_gb,
      antivirus_name,
      firewall_status,
      bitlocker_status,
      battery_wear_level,
      public_ip,
      location_city,
      location_region,
      location_country,
      installed_apps, // Array of strings or objects
      api_key 
    } = body;

    // Security Check
    if (api_key !== process.env.MONITORING_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Upsert Asset Monitoring Record
    const { data: asset, error: assetError } = await supabase
      .from('assets_monitoring')
      .upsert({
        hostname,
        serial_number,
        manufacturer,
        model,
        current_user_name,
        os_version,
        cpu_type,
        gpu_type,
        ram_gb,
        storage_free_gb,
        storage_total_gb,
        antivirus_name,
        firewall_status,
        bitlocker_status,
        battery_wear_level,
        public_ip,
        location_city,
        location_region,
        location_country,
        apps_count: Array.isArray(installed_apps) ? installed_apps.length : 0,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'serial_number' })
      .select()
      .single();

    if (assetError) throw assetError;

    // 2. Sync Installed Apps to separate table (On-Demand indexing)
    if (Array.isArray(installed_apps) && asset) {
      // Clear old apps for this asset first to keep it fresh
      await supabase.from('asset_installed_apps').delete().eq('asset_id', asset.id);
      
      // Batch insert new apps
      const appRecords = installed_apps.map((appName: string) => ({
        asset_id: asset.id,
        app_name: appName
      }));

      if (appRecords.length > 0) {
        await supabase.from('asset_installed_apps').insert(appRecords);
      }
    }

    return NextResponse.json({ success: true, asset_id: asset.id });
  } catch (error: any) {
    console.error('Monitoring API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
