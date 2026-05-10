'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Monitor, 
  ShieldCheck, 
  LogOut,
  Cpu,
  History,
  Settings,
  ChevronRight,
  Activity
} from 'lucide-react';

const menuGroups = [
  {
    title: "MAIN MENU",
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/', badge: 'LIVE', badgeColor: 'bg-emerald-500' },
      { name: 'Assets Inventory', icon: Monitor, href: '/assets' },
      { name: 'Security Audit', icon: ShieldCheck, href: '/security', badge: 'NEW', badgeColor: 'bg-blue-500' },
    ]
  },
  {
    title: "ANALYTICS",
    items: [
      { name: 'Sync History', icon: History, href: '/history' },
      { name: 'Performance', icon: Activity, href: '/performance' },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { name: 'Settings', icon: Settings, href: '/settings' },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Brand Section */}
      <div className="p-8 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-lg shadow-slate-200 border border-slate-100 flex items-center justify-center overflow-hidden p-1">
            <img src="/logo.png" alt="MRA Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">AEGIS MRA</h1>
            <p className="text-[10px] text-blue-600 uppercase tracking-[0.2em] font-black mt-1">Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar py-2">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-4 text-[10px] font-black text-slate-400 mb-3 tracking-[0.15em] uppercase">
              {group.title}
            </p>
            <ul className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group relative ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100/50 shadow-sm' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={19} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                        <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-blue-700' : 'text-slate-600'}`}>
                          {item.name}
                        </span>
                      </div>
                      
                      {item.badge && !isActive && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full text-white ${item.badgeColor} shadow-lg shadow-blue-500/10`}>
                          {item.badge}
                        </span>
                      )}
                      
                      {isActive && <ChevronRight size={14} className="text-blue-300" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profile / Footer Section */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
            AD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-900 truncate">Admin MRA</p>
            <p className="text-[10px] text-slate-400 truncate">System Administrator</p>
          </div>
          <button 
            title="Logout"
            aria-label="Logout"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
        
        <div className="px-2">
          <p className="text-[9px] text-slate-400 text-center leading-relaxed">
            &copy; 2026 MRA Retail.<br />
            <span className="text-slate-300 font-medium">Created By Aris Setiyono.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
