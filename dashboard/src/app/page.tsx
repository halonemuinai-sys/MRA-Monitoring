import React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  ShieldAlert, 
  Database, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getStats() {
  const { data: assets, error } = await supabase
    .from('assets_monitoring')
    .select('*');
  
  if (error || !assets) return { total: 0, critical: 0, warning: 0, healthy: 0, totalStorageTB: '0.0' };
  
  const total = assets.length;
  const critical = assets.filter(a => a.bitlocker_status === 'Unprotected' || a.firewall_status === 'Disabled' || a.storage_free_gb < 10).length;
  const warning = assets.filter(a => a.battery_wear_level > 20 || (a.storage_free_gb < 30 && a.storage_free_gb >= 10)).length;
  const healthy = total - critical - warning;
  
  const totalStorage = assets.reduce((acc, a) => acc + (a.storage_total_gb || 0), 0);
  const totalStorageTB = (totalStorage / 1024).toFixed(1);

  return { total, critical, warning, healthy, totalStorageTB };
}

export default async function OverviewPage() {
  const stats = await getStats();

  return (
    <div className="p-10 space-y-10 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Overview</h2>
          <p className="text-slate-500 mt-1 font-medium italic">Asset intelligence and fleet health</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Live Monitoring</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Fleet" value={stats.total} icon={Database} color="blue" />
        <StatCard title="Storage" value={`${stats.totalStorageTB} TB`} icon={Zap} color="purple" />
        <StatCard title="Healthy" value={stats.healthy} icon={CheckCircle2} color="green" />
        <StatCard title="Warnings" value={stats.warning} icon={AlertTriangle} color="yellow" />
        <StatCard title="Security" value={stats.critical} icon={ShieldAlert} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Fleet Health Index</h3>
                <p className="text-sm text-slate-400 mt-1">Average stability score across all nodes</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100">
                <ArrowUpRight size={14} /> +2.4%
              </div>
            </div>

            <div className="flex items-end gap-12 mb-10">
              <span className="text-7xl font-black text-slate-900 tracking-tighter">94%</span>
              <div className="flex-1 space-y-2 pb-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Current Stability</span>
                  <span>Target: 98%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[94%]" />
                </div>
              </div>
            </div>
            
            {/* Mock Chart Visualization */}
            <div className="flex items-end gap-3 h-40">
              {[
                { h: 'h-[40%]' },
                { h: 'h-[70%]' },
                { h: 'h-[45%]' },
                { h: 'h-[90%]' },
                { h: 'h-[65%]' },
                { h: 'h-[80%]' },
                { h: 'h-[94%]', active: true },
              ].map((item, i) => (
                <div key={i} className="flex-1 group/bar relative">
                  <div 
                    className={`bg-blue-100 group-hover/bar:bg-blue-200 transition-all rounded-xl w-full ${item.h}`}
                  />
                  {item.active && (
                    <div className={`absolute inset-0 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] rounded-xl w-full ${item.h}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl" />
        </div>

        {/* Alerts Panel */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-8">System Alerts</h3>
          <div className="space-y-6 flex-1">
            <AlertItem 
              type="critical" 
              msg="Drive C: is 95% full" 
              device="NB-MRA-042" 
            />
            <AlertItem 
              type="warning" 
              msg="High battery wear (28%)" 
              device="NB-MRA-115" 
            />
            <AlertItem 
              type="security" 
              msg="Firewall Disabled" 
              device="NB-MRA-009" 
            />
          </div>
          <button className="w-full mt-10 py-4 rounded-2xl bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all text-xs font-bold uppercase tracking-widest border border-slate-100">
            Audit History
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-green-600 bg-green-50 border-green-100',
    yellow: 'text-amber-600 bg-amber-50 border-amber-100',
    red: 'text-red-600 bg-red-50 border-red-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 border ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
    </div>
  );
}

function AlertItem({ type, msg, device }: any) {
  const themes: any = {
    critical: { icon: <XCircle size={18} />, color: 'bg-red-50 text-red-600 border-red-100' },
    warning: { icon: <AlertTriangle size={18} />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    security: { icon: <ShieldAlert size={18} />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  };

  const theme = themes[type];

  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
      <div className={`p-2 rounded-xl border ${theme.color}`}>
        {theme.icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 leading-tight">{msg}</p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{device}</p>
      </div>
    </div>
  );
}
