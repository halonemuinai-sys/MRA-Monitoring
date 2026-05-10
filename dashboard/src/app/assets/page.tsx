import React from 'react';
import { supabase } from '@/lib/supabase';
import AssetTable from '@/components/AssetTable';

export const dynamic = 'force-dynamic';

async function getAssets() {
  const { data, error } = await supabase
    .from('assets_monitoring')
    .select('*')
    .order('last_seen', { ascending: false });
  
  if (error) return [];
  return data;
}

export default async function AssetsPage() {
  const assets = await getAssets();

  return <AssetTable initialAssets={assets} />;
}
