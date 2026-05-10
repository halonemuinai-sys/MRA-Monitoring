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
  Package
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
    <div className="p-10 space-y-10 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
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
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity & User</th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification</th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hardware</th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage</th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance</th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((asset: any) => (
              <tr key={asset.id} className="hover:bg-slate-50/50 transition-all group">
                {/* 1. Identity */}
                <td className="px-8 py-7">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                      <Monitor size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-none mb-1">{asset.hostname}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                          {asset.current_user_name?.split('\\')[1] || asset.current_user_name}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. Classification (NEW DROPDOWN EDITOR) */}
                <td className="px-8 py-7">
                  <AssetCategoryEditor 
                    assetId={asset.id} 
                    currentType={asset.device_type} 
                    currentStatus={asset.ownership_status} 
                  />
                </td>

                {/* 3. Hardware */}
                <td className="px-8 py-7">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-tighter truncate max-w-[120px]">{asset.model}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{asset.ram_gb}GB RAM</p>
                  </div>
                </td>

                {/* 4. Storage */}
                <td className="px-8 py-7">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-700 tracking-tight">
                      {asset.storage_free_gb} GB Free
                    </span>
                    <div className="w-24">
                      <StorageBar free={asset.storage_free_gb} total={asset.storage_total_gb} />
                    </div>
                  </div>
                </td>

                {/* 5. Compliance */}
                <td className="px-8 py-7">
                  <div className="flex gap-1.5 items-center">
                    <ComplianceBadge icon={Shield} active={!!asset.antivirus_name} label="AV" />
                    <ComplianceBadge icon={Lock} active={asset.firewall_status === 'Active'} label="FW" />
                    <div className="ml-2 flex flex-col">
                      <span className="text-[10px] font-black text-slate-900">{asset.apps_count || 0}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Apps</span>
                    </div>
                  </div>
                </td>

                {/* 6. Network */}
                <td className="px-8 py-7">
                  <div className="space-y-1">
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-1">
                      <Globe size={10} />
                      {asset.location_city || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                      {new Date(asset.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        w-7 h-7 rounded-lg flex items-center justify-center transition-all border
        ${active 
          ? 'bg-green-50 text-green-600 border-green-100' 
          : 'bg-red-50 text-red-500 border-red-100'}
      `}
    >
      <Icon size={12} strokeWidth={2.5} />
    </div>
  );
}
