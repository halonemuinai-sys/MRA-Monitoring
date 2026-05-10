import React from 'react';
import { supabase } from '@/lib/supabase';
import StorageBar from '@/components/StorageBar';
import AssetCategoryEditor from '@/components/AssetCategoryEditor';
import { 
  Shield, 
  Lock, 
  Key, 
  Search, 
  Monitor,
  Globe,
  MoreVertical,
  Filter,
  Package,
  Cpu as CpuIcon,
  HardDrive
} from 'lucide-react';

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

  return (
    <div className="p-10 space-y-10 max-w-full mx-auto">
      <header className="flex justify-between items-end px-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Assets Inventory</h2>
          <p className="text-slate-500 mt-1 font-medium italic">Hardware health and system compliance</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search serial or hostname..." 
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 shadow-sm w-80 transition-all"
            />
          </div>
          <button title="Filter Assets" className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-900 hover:shadow-md transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </header>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mx-4">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity & User</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System & Hardware</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage Health</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network</th>
              <th className="px-6 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((asset: any) => (
              <tr key={asset.id} className="hover:bg-slate-50/50 transition-all group">
                {/* 1. Identity */}
                <td className="px-6 py-7">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                      <Monitor size={20} />
                    </div>
                    <div className="min-w-[120px]">
                      <h4 className="text-base font-bold text-slate-900 leading-none mb-2">{asset.hostname}</h4>
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded w-fit">
                          <Package size={10} className="text-slate-400" />
                          {asset.current_user_name?.split('\\')[1] || asset.current_user_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-300 font-bold tracking-tight">SN: {asset.serial_number}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. Classification */}
                <td className="px-6 py-7">
                  <AssetCategoryEditor 
                    assetId={asset.id} 
                    currentType={asset.device_type} 
                    currentStatus={asset.ownership_status} 
                  />
                </td>

                {/* 3. System & Hardware Details */}
                <td className="px-6 py-7">
                  <div className="space-y-2 max-w-[220px]">
                    {/* OS Version */}
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <p className="text-[11px] font-bold text-slate-800 truncate" title={asset.os_version}>
                        {asset.os_version}
                      </p>
                    </div>
                    
                    {/* CPU & RAM */}
                    <div className="flex items-center gap-2 text-slate-500">
                      <CpuIcon size={12} className="shrink-0" />
                      <p className="text-[10px] font-bold uppercase tracking-tight truncate">
                        {asset.cpu_type} • {asset.ram_gb}GB
                      </p>
                    </div>

                    {/* GPU */}
                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="w-3 h-3 flex items-center justify-center border border-slate-200 rounded-[3px]">
                        <span className="text-[7px] font-black italic">G</span>
                      </div>
                      <p className="text-[9px] font-bold uppercase tracking-widest truncate">
                        {asset.gpu_type || 'Integrated Graphics'}
                      </p>
                    </div>

                    {/* Manufacturer & Model */}
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      {asset.manufacturer} / {asset.model}
                    </p>
                  </div>
                </td>

                {/* 4. Storage Health */}
                <td className="px-6 py-7">
                  <div className="flex flex-col gap-2.5 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <HardDrive size={14} className="text-slate-400" />
                      <span className="text-[11px] font-black text-slate-700 tracking-tight">
                        {asset.storage_free_gb} / {asset.storage_total_gb} GB
                      </span>
                    </div>
                    <StorageBar free={asset.storage_free_gb} total={asset.storage_total_gb} />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      {( (asset.storage_free_gb / asset.storage_total_gb) * 100 ).toFixed(0)}% Free Space
                    </p>
                  </div>
                </td>

                {/* 5. Compliance */}
                <td className="px-6 py-7">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <ComplianceBadge icon={Shield} active={!!asset.antivirus_name} label="AV" />
                      <ComplianceBadge icon={Lock} active={asset.firewall_status === 'Active'} label="FW" />
                      <ComplianceBadge icon={Key} active={asset.bitlocker_status === 'Encrypted'} label="BL" />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg w-fit border border-slate-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {asset.apps_count || 0} Apps Installed
                      </span>
                    </div>
                  </div>
                </td>

                {/* 6. Network */}
                <td className="px-6 py-7">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-900 font-mono tracking-tighter bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100/50">
                      {asset.public_ip}
                    </p>
                    <div className="flex items-center gap-1.5 px-1">
                      <Globe size={11} className="text-blue-500" />
                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
                        {asset.location_city || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-[0.1em]">
                        Sync: {new Date(asset.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-7 text-right">
                  <button title="More Options" className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplianceBadge({ icon: Icon, active, label }: { icon: any; active: boolean; label: string }) {
  return (
    <div 
      title={`${label}: ${active ? 'Healthy' : 'Risk'}`}
      className={`
        w-8 h-8 rounded-xl flex items-center justify-center transition-all border
        ${active 
          ? 'bg-green-50 text-green-600 border-green-100 shadow-sm' 
          : 'bg-red-50 text-red-500 border-red-100 shadow-sm'}
      `}
    >
      <Icon size={14} strokeWidth={2.5} />
    </div>
  );
}
