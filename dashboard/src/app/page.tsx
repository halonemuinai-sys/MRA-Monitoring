import React from 'react';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getAssets() {
  const { data, error } = await supabase
    .from('assets_monitoring')
    .select('*')
    .order('last_seen', { ascending: false });
  
  if (error) return [];
  return data;
}

export default async function Dashboard() {
  const assets = await getAssets();

  const totalAssets = assets.length;
  const critical = assets.filter(a => 
    a.bitlocker_status === 'Unprotected' || 
    a.firewall_status === 'Disabled' || 
    a.storage_free_gb < 10
  ).length;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-slate-200 p-8 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
              MRA Asset Intelligence
            </h1>
            <p className="text-slate-500 mt-2 italic text-sm">Enterprise Hardware & Security Compliance Dashboard</p>
          </div>
          <div className="bg-[#141417] px-6 py-3 rounded-2xl border border-white/5 flex gap-8">
            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Fleet</div>
              <div className="text-xl font-bold text-white">{totalAssets}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Security Risk</div>
              <div className="text-xl font-bold text-red-500">{critical}</div>
            </div>
          </div>
        </header>

        <div className="bg-[#141417] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-5 font-bold">Identity & User</th>
                <th className="px-6 py-5 font-bold">Hardware Specs</th>
                <th className="px-6 py-5 font-bold">Storage</th>
                <th className="px-6 py-5 font-bold">Security Compliance</th>
                <th className="px-6 py-5 font-bold">Location</th>
                <th className="px-6 py-5 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-white/[0.02] transition-all group">
                  {/* Identity */}
                  <td className="px-6 py-6">
                    <div className="font-black text-white text-base group-hover:text-blue-400 transition-colors">
                      {asset.hostname}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded border border-blue-500/20">
                        {asset.current_user_name?.split('\\').pop() || 'Unknown'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{asset.serial_number}</div>
                    </div>
                  </td>

                  {/* Hardware */}
                  <td className="px-6 py-6 text-xs text-slate-400">
                    <div className="font-bold text-slate-300 mb-1">{asset.manufacturer} {asset.model}</div>
                    <div>{asset.cpu_type.split(' ')[0]} | {asset.ram_gb}GB RAM</div>
                  </td>

                  {/* Storage */}
                  <td className="px-6 py-6">
                    <div className="text-xs font-mono text-white mb-1.5">{asset.storage_free_gb} / {asset.storage_total_gb} GB</div>
                    <div className="w-24 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full storage-bar-progress ${asset.storage_free_gb < 20 ? 'bg-red-500' : 'bg-blue-500/50'}`}
                        style={{ '--progress-width': `${(asset.storage_free_gb / asset.storage_total_gb) * 100}%` } as React.CSSProperties}
                      ></div>
                    </div>
                  </td>

                  {/* Security Compliance */}
                  <td className="px-6 py-6">
                    <div className="flex gap-2">
                      <div title={`AV: ${asset.antivirus_name}`} className={`p-1.5 rounded-lg border ${asset.antivirus_name ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <ShieldIcon size={14} />
                      </div>
                      <div title={`Firewall: ${asset.firewall_status}`} className={`p-1.5 rounded-lg border ${asset.firewall_status === 'Active' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <LockIcon size={14} />
                      </div>
                      <div title={`BitLocker: ${asset.bitlocker_status}`} className={`p-1.5 rounded-lg border ${asset.bitlocker_status === 'Encrypted' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <KeyIcon size={14} />
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-6">
                    <div className="text-xs font-mono text-slate-300">{asset.public_ip}</div>
                    <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Public Network</div>
                  </td>

                  {/* Last Seen */}
                  <td className="px-6 py-6 text-right">
                    <div className="text-xs font-bold text-white mb-1">
                      {new Date(asset.last_seen).toLocaleTimeString()}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-tighter">
                      Synced {new Date(asset.last_seen).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Icons Placeholder Components
const ShieldIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const LockIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const KeyIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"/></svg>
);
