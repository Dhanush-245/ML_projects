import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, Key, Shield, LogOut, Moon, Sun, CheckCircle2, ChevronRight, X, Building } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export default function UserProfileModal() {
  const { setActiveView, theme, toggleTheme, activeDataset, datasets, experiments, currentUser, logoutUser } = useAppStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fullName = currentUser?.full_name || 'Lingareddy Dhanushkumar';
  const email = currentUser?.email || 'dhanush@automlstudio.ai';
  const role = currentUser?.role || 'Admin';
  const username = currentUser?.username || 'dhanush';
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'LD';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md border-2 border-white dark:border-slate-800 cursor-pointer hover:opacity-90 transition-opacity"
        title="User Profile & Account Settings"
      >
        <span className="font-heading font-bold text-xs">{initials}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-88 glass-card shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header Profile Info */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-brand-600 to-indigo-700 text-white relative">
            <button 
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg border border-white/30 shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-heading font-bold text-base truncate" title={fullName}>{fullName}</h3>
                <p className="text-xs text-brand-100 font-mono mt-0.5 truncate" title={email}>{email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-amber-400 text-slate-900 rounded-md">
                    {role}
                  </span>
                  <span className="text-[11px] text-brand-100 flex items-center gap-1 font-mono">
                    @{username}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Platform Stats */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-slate-400 block text-[10px]">Active Data</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block" title={activeDataset?.name || 'None'}>
                {activeDataset ? activeDataset.name : 'None'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-slate-400 block text-[10px]">Datasets</span>
              <span className="font-semibold text-slate-900 dark:text-white">{datasets.length}</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-slate-400 block text-[10px]">Experiments</span>
              <span className="font-semibold text-slate-900 dark:text-white">{experiments.length}</span>
            </div>
          </div>

          {/* Menu Options */}
          <div className="p-2 space-y-1 text-xs">
            <button 
              onClick={() => {
                setActiveView('settings');
                setOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Account & Platform Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button 
              onClick={() => {
                setActiveView('settings');
                setOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-amber-500" />
                <span>API Keys & Credentials</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                Verified
              </span>
            </button>

            <button 
              onClick={() => {
                toggleTheme();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span>Theme Preference</span>
              </div>
              <span className="text-slate-400 capitalize">{theme}</span>
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => {
                  logoutUser();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
