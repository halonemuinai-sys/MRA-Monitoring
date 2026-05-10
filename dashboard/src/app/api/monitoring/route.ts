import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');

    if (apiKey !== process.env.MONITORING_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();

    const dbPayload = {
      serial_number: payload.serialNumber,
      hostname: payload.hostname,
      current_user_name: payload.currentUser,
      manufacturer: payload.manufacturer,
      model: payload.model,
      os_version: payload.os,
      cpu_type: payload.cpu,
      gpu_type: payload.gpu,
      last_boot_time: payload.lastBoot,
      
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
      
      last_seen: new Date().toISOString(),
      full_payload: payload
    };

    const { error } = await supabase
      .from('assets_monitoring')
      .upsert(dbPayload, { onConflict: 'serial_number' });

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Sync complete for ${payload.hostname}` });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
