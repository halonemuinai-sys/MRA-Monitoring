'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Laptop, Monitor, Tag, CreditCard, User } from 'lucide-react';

interface Props {
  assetId: string;
  currentType: string;
  currentStatus: string;
}

export default function AssetCategoryEditor({ assetId, currentType, currentStatus }: Props) {
  const [type, setType] = useState(currentType || 'Laptop');
  const [status, setStatus] = useState(currentStatus || 'Asset');
  const [loading, setLoading] = useState(false);

  const updateCategory = async (newType: string, newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('assets_monitoring')
        .update({ 
          device_type: newType, 
          ownership_status: newStatus 
        })
        .eq('id', assetId);

      if (error) throw error;
      setType(newType);
      setStatus(newStatus);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Device Type Dropdown */}
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${type === 'Laptop' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
          {type === 'Laptop' ? <Laptop size={12} /> : <Monitor size={12} />}
        </div>
        <select 
          value={type}
          onChange={(e) => updateCategory(e.target.value, status)}
          disabled={loading}
          className="text-[10px] font-black uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors"
        >
          <option value="Laptop">Laptop</option>
          <option value="PC">PC / Desktop</option>
          <option value="Server">Server</option>
        </select>
      </div>

      {/* Ownership Status Dropdown */}
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${
          status === 'Asset' ? 'bg-emerald-50 text-emerald-600' : 
          status === 'Rental' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
        }`}>
          {status === 'Asset' ? <Tag size={12} /> : status === 'Rental' ? <CreditCard size={12} /> : <User size={12} />}
        </div>
        <select 
          value={status}
          onChange={(e) => updateCategory(type, e.target.value)}
          disabled={loading}
          className="text-[10px] font-black uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer hover:text-slate-900 transition-colors"
        >
          <option value="Asset">Asset Kantor</option>
          <option value="Rental">Rental / Sewa</option>
          <option value="Pribadi">Pribadi</option>
        </select>
      </div>
    </div>
  );
}
