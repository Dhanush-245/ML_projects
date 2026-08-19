import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCircle2, Rocket, Database, Shield, X, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export default function NotificationsPopover() {
  const { setActiveView, setDatasetSubTab, activeDataset } = useAppStore();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: 'Dataset Profiled',
      desc: activeDataset ? `Dataset "${activeDataset.name}" parsed (${activeDataset.rows.toLocaleString()} rows).` : 'station_hour.csv dataset ready for training.',
      time: '10m ago',
      read: false,
      icon: Database,
      color: 'text-brand-500 bg-brand-50 dark:bg-brand-900/30',
      view: 'data',
      subTab: 'preview'
    },
    {
      id: 'n2',
      title: 'AutoML Training Completed',
      desc: 'CatBoost Classifier reached champion score 0.942 accuracy.',
      time: '30m ago',
      read: false,
      icon: Rocket,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
      view: 'training',
      subTab: null
    },
    {
      id: 'n3',
      title: 'Model Promoted to Prod',
      desc: 'Credit Risk Scoring v2 promoted to Production stage.',
      time: '2h ago',
      read: false,
      icon: Shield,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
      view: 'registry',
      subTab: null
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item: typeof notifications[0]) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    setActiveView(item.view);
    if (item.subTab) {
      setDatasetSubTab(item.subTab as any);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-brand-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-sm text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button 
                    onClick={markAllRead} 
                    className="text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium"
                    title="Mark all as read"
                  >
                    Mark read
                  </button>
                  <button 
                    onClick={clearAll} 
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                    title="Clear notifications"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button 
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    !item.read ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-semibold ${!item.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
