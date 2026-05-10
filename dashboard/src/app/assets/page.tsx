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
  HardDrive,
  Info
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
    <div className="p-10 space-y-10 w-full max-w-[1600px] mx-auto">
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
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-x-auto mx-4">
        <table className="w-full border-collapse text-left min-w-[1300px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity & User</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System & Model</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Specifications</th>
              <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage</th>
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

                {/* 3. System & Model */}
                <td className="px-6 py-7">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100/50 w-fit">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <p className="text-[11px] font-black text-blue-700 truncate max-w-[150px]">
                        {asset.os_version}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">
                        {asset.manufacturer}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">
                        {asset.model}
                      </p>
                    </div>
                  </div>
                </td>

                {/* 4. Specifications */}
                <td className="px-6 py-7">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <CpuIcon size={14} className="text-slate-400" />
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight truncate max-w-[140px]">
                        {asset.cpu_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 flex items-center justify-center border-2 border-slate-200 rounded bg-slate-50">
                        <span className="text-[8px] font-black text-slate-400">G</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[140px]">
                        {asset.gpu_type || 'Integrated'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info size={12} className="text-blue-400" />
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        {asset.ram_gb}GB RAM DDR
                      </p>
                    </div>
                  </div>
                </td>

                {/* 5. Storage */}
                <td className="px-6 py-7">
                  <div className="flex flex-col gap-2.5 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <HardDrive size={14} className="text-slate-400" />
                      <span className="text-[11px] font-black text-slate-700 tracking-tight">
                        {asset.storage_free_gb} / {asset.storage_total_gb} GB
                      </span>
                    </div>
                    <StorageBar free={asset.storage_free_gb} total={asset.storage_total_gb} />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {( (asset.storage_free_gb / asset.storage_total_gb) * 100 ).toFixed(0)}% Available
                    </p>
                  </div>
                </td>

                {/* 6. Compliance */}
                <td className="px-6 py-7">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <ComplianceBadge icon={Shield} active={!!asset.antivirus_name} label="AV" />
                      <ComplianceBadge icon={Lock} active={asset.firewall_status === 'Active'} label="FW" />
                      <ComplianceBadge icon={Key} active={asset.bitlocker_status === 'Encrypted'} label="BL" />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg w-fit border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {asset.apps_count || 0} Apps
                      </span>
                    </div>
                  </div>
                </td>

                {/* 7. Network */}
                <td className="px-6 py-7">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-900 font-mono tracking-tighter bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100/50">
                      {asset.public_ip}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Globe size={11} className="text-blue-500" />
                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
                        {asset.location_city || 'Unknown'}
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-300 uppercase font-bold tracking-[0.1em]">
                      {new Date(asset.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
