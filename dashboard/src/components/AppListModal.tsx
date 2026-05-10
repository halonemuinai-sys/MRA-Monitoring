'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, X, Search, Loader2 } from 'lucide-react';

interface Props {
  assetId: string;
  hostname: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AppListModal({ assetId, hostname, isOpen, onClose }: Props) {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchApps();
    }
  }, [isOpen, assetId]);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('installed_apps')
        .select('app_name')
        .eq('asset_id', assetId)
        .order('app_name', { ascending: true });

      if (error) throw error;
      setApps(data || []);
    } catch (err) {
      console.error("Failed to fetch apps:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredApps = apps.filter(app => 
    app.app_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                <Package size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Software Inventory</h3>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{hostname}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-slate-100">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search installed software..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="text-blue-500 animate-spin" size={32} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Indexing Database...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredApps.map((app, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-all font-black text-[10px]">
                    {i + 1}
                  </div>
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{app.app_name}</span>
                </div>
              ))}
              {filteredApps.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-slate-400 font-medium italic">No applications found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Detected: {filteredApps.length} Packages
          </span>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
