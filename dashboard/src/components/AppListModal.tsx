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
        className="flex items-center gap-2 group"
      >
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-1 rounded group-hover:bg-blue-50 group-hover:text-blue-600 transition-all cursor-pointer border border-transparent group-hover:border-blue-100">
          {appCount} Apps
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                    <Package size={20} />
                  </div>
                  Software Inventory
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Inventory for {hostname}</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-8 py-4 border-b border-slate-100">
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Filter applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Scanning Registry...</p>
                </div>
              ) : filteredApps.length > 0 ? (
                <div className="grid grid-cols-1 gap-1 px-4">
                  {filteredApps.map((app, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                          <Package size={14} />
                        </div>
                        <span className="text-sm text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">
                          {app.app_name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded group-hover:bg-white transition-all">
                        v{app.app_version || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-slate-400 text-sm italic">No matching applications found.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                {filteredApps.length} Packages Detected
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-slate-900/10"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
