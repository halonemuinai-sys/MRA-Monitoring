'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Monitor, 
  ShieldCheck, 
  Settings, 
  LogOut,
  Cpu
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Assets Inventory', icon: Monitor, href: '/assets' },
  { name: 'Security Audit', icon: ShieldCheck, href: '/security' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 bg-[#0d0d0f] border-r border-white/5 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Cpu size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">MRA Monitor</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-500' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-white'} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User / Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            AD
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white">Admin MRA</p>
            <p className="text-[10px] text-slate-500">System Administrator</p>
          </div>
          <button 
            title="Logout"
            aria-label="Logout"
            className="text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
