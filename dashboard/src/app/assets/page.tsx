import React from 'react';
import { supabase } from '@/lib/supabase';
import StorageBar from '@/components/StorageBar';
import { 
  Shield, 
  Lock, 
  Key, 
  Search, 
  Filter, 
  ChevronRight,
  MoreVertical
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
    <div className="p-10 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Assets Inventory</h2>
          <p className="text-slate-500 mt-1">Detailed hardware and security compliance list</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search serial or hostname..." 
              className="bg-[#141417] border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-blue-500/50 w-80 transition-all"
            />
          </div>
          <button 
            title="Filter Assets"
            aria-label="Filter Assets"
            className="p-3 bg-[#141417] border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:border-white/20 transition-all"
          >
            <Filter size={20} />
          </button>
        </div>
      </header>

      <div className="bg-[#141417] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase tracking-[0.2em] bg-white/[0.01] border-b border-white/5">
              <th className="px-8 py-5 font-bold">Identity & User</th>
              <th className="px-8 py-5 font-bold">Hardware Details</th>
              <th className="px-8 py-5 font-bold">Storage Health</th>
              <th className="px-8 py-5 font-bold">Security Compliance</th>
              <th className="px-8 py-5 font-bold">Network</th>
              <th className="px-8 py-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-white/[0.02] transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform border border-blue-500/10">
                      <MonitorIcon size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{asset.hostname}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded uppercase tracking-tighter">
                          {asset.current_user_name?.split('\\').pop() || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">{asset.serial_number}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-8 py-6">
                  <div className="text-xs font-bold text-slate-300">{asset.manufacturer} {asset.model}</div>
                  <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[200px]">
                    {asset.cpu_type.split(' @')[0]} | {asset.ram_gb}GB RAM
                  </div>
                </td>

                <td className="px-8 py-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400">{asset.storage_free_gb} GB Free</span>
                    <span className="text-[10px] text-slate-500">{Math.round((asset.storage_free_gb / asset.storage_total_gb) * 100)}%</span>
                  </div>
                  <StorageBar free={asset.storage_free_gb} total={asset.storage_total_gb} />
                </td>

                <td className="px-8 py-6">
                  <div className="flex gap-2">
                    <ComplianceBadge icon={Shield} active={!!asset.antivirus_name} label="AV" />
                    <ComplianceBadge icon={Lock} active={asset.firewall_status === 'Active'} label="FW" />
                    <ComplianceBadge icon={Key} active={asset.bitlocker_status === 'Encrypted'} label="BL" />
                  </div>
                </td>

                <td className="px-8 py-6">
                  <div className="text-xs font-mono text-slate-300">{asset.public_ip}</div>
                  <div className="text-[9px] text-slate-600 mt-1 uppercase tracking-widest font-bold">Last Sync: {new Date(asset.last_seen).toLocaleTimeString()}</div>
                </td>

                <td className="px-8 py-6 text-right">
                  <button 
                    title="Device Options"
                    aria-label="Device Options"
                    className="p-2 text-slate-600 hover:text-white transition-colors"
                  >
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

function ComplianceBadge({ icon: Icon, active, label }: any) {
  return (
    <div 
      title={label}
      className={`p-2 rounded-xl border transition-all ${
        active 
          ? 'bg-green-500/10 border-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
          : 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
      }`}
    >
      <Icon size={14} />
    </div>
  );
}

const MonitorIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
);
