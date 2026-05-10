import React from 'react';
import { supabase } from '@/lib/supabase';
import StorageBar from '@/components/StorageBar';
import AppListModal from '@/components/AppListModal';
import { 
  Shield, 
  Lock, 
  Key, 
  Search, 
  Monitor,
  User,
  Cpu,
  Globe,
  MoreVertical,
  Filter
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAssets() {
  const { data, error } = await supabase
    .from('assets_monitoring')
    .select('*, asset_installed_apps(count)')
    .order('last_seen', { ascending: false });
  
  if (error) return [];
  return data;
}

export default async function AssetsPage() {
  const assets = await getAssets();

  return (
    <div className="p-10 space-y-10 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Assets Inventory</h2>
          <p className="text-slate-500 mt-1 font-medium italic">Detailed hardware and security compliance list</p>
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
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity & User</th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hardware Details</th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage Health</th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Compliance</th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((asset: any) => (
              <tr key={asset.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-7">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                      <Monitor size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-none mb-1">{asset.hostname}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">{asset.current_user_name?.split('\\')[1] || asset.current_user_name}</span>
                        <span className="text-[10px] font-mono text-slate-300">{asset.serial_number}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-8 py-7">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{asset.manufacturer} {asset.model}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{asset.cpu_type} | {asset.ram_gb}GB RAM</p>
                  </div>
                </td>

                <td className="px-8 py-7">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-700 tracking-tight">
                      {asset.storage_free_gb} / {asset.storage_total_gb} GB Free
                    </span>
                    <StorageBar 
                      free={asset.storage_free_gb} 
                      total={asset.storage_total_gb} 
                    />
                  </div>
                </td>

                <td className="px-8 py-7">
                  <div className="flex gap-2">
                    <ComplianceBadge icon={Shield} active={!!asset.antivirus_name} label="AV" />
                    <ComplianceBadge icon={Lock} active={asset.firewall_status === 'Active'} label="FW" />
                    <ComplianceBadge icon={Key} active={asset.bitlocker_status === 'Encrypted'} label="BL" />
                  </div>
                  <div className="mt-3">
                    <AppListModal 
                      assetId={asset.id} 
                      hostname={asset.hostname} 
                      appCount={asset.asset_installed_apps?.[0]?.count || 0} 
                    />
                  </div>
                </td>

                <td className="px-8 py-7">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 font-mono tracking-tight">{asset.public_ip}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                      Last Sync: {new Date(asset.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </td>

                <td className="px-8 py-7 text-right">
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
