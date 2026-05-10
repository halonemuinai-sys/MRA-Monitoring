'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Search, Package } from 'lucide-react';

interface AppListModalProps {
  assetId: string;
  hostname: string;
  appCount: number;
}

export default function AppListModal({ assetId, hostname, appCount }: AppListModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApps = async () => {
    setIsOpen(true);
    setLoading(true);
    const { data, error } = await supabase
      .from('asset_installed_apps')
      .select('app_name, app_version')
      .eq('asset_id', assetId)
      .order('app_name', { ascending: true });

    if (!error && data) {
      setApps(data);
    }
    setLoading(false);
  };

  const filteredApps = apps.filter(app => 
    app.app_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <button 
        onClick={fetchApps}
        className="mt-3 flex items-center gap-2 group"
      >
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter bg-white/5 px-2 py-1 rounded group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-all cursor-pointer border border-transparent group-hover:border-blue-500/20">
          {appCount} Apps
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141417] border border-white/10 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Package className="text-blue-500" size={20} />
                  Installed Applications
                </h3>
                <p className="text-xs text-slate-500 mt-1">Inventory for {hostname}</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-white/5">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Filter applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-2 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Fetching software inventory...</p>
                </div>
              ) : filteredApps.length > 0 ? (
                <div className="grid grid-cols-1 gap-1">
                  {filteredApps.map((app, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-white/[0.02] rounded-xl transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/5 flex items-center justify-center text-blue-500/50 group-hover:text-blue-500 transition-colors">
                          <Package size={14} />
                        </div>
                        <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                          {app.app_name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-2 py-0.5 rounded">
                        v{app.app_version || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-slate-500 text-sm italic">No applications found.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
              <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                {filteredApps.length} Shown
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
