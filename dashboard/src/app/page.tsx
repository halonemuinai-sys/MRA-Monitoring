import React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  ShieldAlert, 
  Database, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getStats() {
  const { data: assets, error } = await supabase
    .from('assets_monitoring')
    .select('*');
  
  if (error || !assets) return { total: 0, critical: 0, warning: 0, healthy: 0 };
  
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
    <div className="p-10 space-y-10">
      <header>
        <h2 className="text-3xl font-bold text-white">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">Real-time status of your IT ecosystem</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Fleet" value={stats.total} icon={Database} color="blue" />
        <StatCard title="Storage Capacity" value={`${stats.totalStorageTB} TB`} icon={Zap} color="purple" />
        <StatCard title="Healthy Nodes" value={stats.healthy} icon={CheckCircle2} color="green" />
        <StatCard title="Risk Warnings" value={stats.warning} icon={AlertTriangle} color="yellow" />
        <StatCard title="Security Breach" value={stats.critical} icon={ShieldAlert} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Health Score Chart Placeholder */}
        <div className="lg:col-span-2 bg-[#141417] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-6">Fleet Health Score</h3>
            <div className="flex items-end gap-2 mb-10">
              <span className="text-6xl font-black text-white">94%</span>
              <span className="text-green-500 font-bold mb-2 flex items-center gap-1">
                <Activity size={16} /> +2.4%
              </span>
            </div>
            
            {/* Mock Chart Visualization */}
            <div className="flex items-end gap-3 h-48">
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
                  <div className={`bg-blue-600/20 group-hover/bar:bg-blue-600/40 transition-all rounded-t-lg ${item.h}`} />
                  {item.active && (
                    <div className={`absolute inset-0 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] rounded-t-lg ${item.h}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
          {/* Decorative background circle */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-all" />
        </div>

        {/* Quick Actions / Notifications */}
        <div className="bg-[#141417] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-6">System Alerts</h3>
          <div className="space-y-4">
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
          <button className="w-full mt-8 py-3 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold">
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-500 bg-green-500/10 border-green-500/20',
    yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="bg-[#141417] border border-white/5 p-8 rounded-3xl shadow-xl hover:border-white/10 transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-4xl font-black text-white">{value}</h3>
    </div>
  );
}

function AlertItem({ type, msg, device }: any) {
  const icons: any = {
    critical: <XCircle className="text-red-500" size={18} />,
    warning: <AlertTriangle className="text-yellow-500" size={18} />,
    security: <ShieldAlert className="text-blue-500" size={18} />,
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
      <div className="mt-0.5">{icons[type]}</div>
      <div>
        <p className="text-sm font-bold text-white leading-tight">{msg}</p>
        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{device}</p>
      </div>
    </div>
  );
}
