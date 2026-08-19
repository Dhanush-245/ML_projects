import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { 
  LayoutDashboard, 
  Database, 
  Layers, 
  Rocket, 
  BarChart3, 
  ShieldCheck, 
  Server, 
  Activity, 
  Settings, 
  ChevronDown, 
  LogOut, 
  Building2,
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const { activeView, setActiveView, setDatasetSubTab, activeDataset, currentUser, logoutUser } = useAppStore();

  const fullName = currentUser?.full_name || 'Lingareddy Dhanushkumar';
  const role = currentUser?.role || 'Admin';
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'LD';

  const navGroups = [
    {
      group: 'CORE WORKFLOWS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'data', label: 'Data Management', icon: Database, action: () => { setActiveView('data'); setDatasetSubTab('list'); } },
        { id: 'pipeline', label: 'Visual Pipeline', icon: Layers },
        { id: 'training', label: 'AutoML Training', icon: Rocket },
      ]
    },
    {
      group: 'GOVERNANCE & SERVING',
      items: [
        { id: 'explainability', label: 'XAI & SHAP Studio', icon: BarChart3 },
        { id: 'registry', label: 'Model Registry', icon: ShieldCheck },
        { id: 'deploy', label: 'Deployments', icon: Server },
        { id: 'monitoring', label: 'Model Monitoring', icon: Activity },
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings & Config', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 saas-sidebar flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Workspace Dropdown Header */}
        <div className="p-4 border-b border-[#232f48]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141c2e] border border-[#232f48] hover:border-[#3b82f6]/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                A
              </div>
              <div className="overflow-hidden">
                <h3 className="font-heading font-bold text-xs text-white truncate">AutoML Studio</h3>
                <p className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5 text-blue-400" /> Enterprise Lab
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Categorized Navigation Menu */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)]">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <h4 className="px-3 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                {group.group}
              </h4>
              <div className="space-y-1 mt-2">
                {group.items.map((item) => {
                  const isActive = activeView === item.id;
                  const handleClick = item.action || (() => setActiveView(item.id));
                  
                  return (
                    <button
                      key={item.id}
                      onClick={handleClick}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-[#141c2e]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.id === 'data' && activeDataset && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Card at Sidebar Bottom */}
      <div className="p-3 border-t border-[#232f48] bg-[#0b0f17]/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#141c2e] border border-[#232f48]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate" title={fullName}>{fullName}</p>
              <span className="text-[10px] text-blue-400 font-mono block">{role}</span>
            </div>
          </div>

          <button 
            onClick={logoutUser}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
