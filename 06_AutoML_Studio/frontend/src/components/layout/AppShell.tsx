import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../stores/appStore';
import { Sun, Moon, Search } from 'lucide-react';
import CommandPalette from './CommandPalette';
import NotificationsPopover from './NotificationsPopover';
import UserProfileModal from './UserProfileModal';

import DashboardView from '../dashboard/DashboardView';
import DatasetHub from '../datasets/DatasetHub';
import PipelineCanvas from '../canvas/PipelineCanvas';
import TrainingHub from '../training/TrainingHub';
import ExplainabilityHub from '../xai/ExplainabilityHub';
import DeploymentCenter from '../deployment/DeploymentCenter';
import SettingsView from '../settings/SettingsView';
import ModelRegistryView from '../registry/ModelRegistryView';
import MonitoringView from '../monitoring/MonitoringView';

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'data', label: 'Data' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'training', label: 'Training' },
  { id: 'explainability', label: 'Explainability' },
  { id: 'registry', label: 'Registry' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'settings', label: 'Settings' },
];

export default function AppShell() {
  const { activeView, setActiveView, theme, toggleTheme, toggleCommandPalette } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'data': return <DatasetHub />;
      case 'pipeline': return <PipelineCanvas />;
      case 'training': return <TrainingHub />;
      case 'explainability': return <ExplainabilityHub />;
      case 'registry': return <ModelRegistryView />;
      case 'deploy': return <DeploymentCenter />;
      case 'monitoring': return <MonitoringView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Top Navigation Header */}
      <header className="glass-header sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800">
        <div 
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
            A
          </div>
          <span className="font-heading font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            AutoML Studio
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/60 p-1 rounded-lg">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeView === item.id
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleCommandPalette}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600">
              ⌘K
            </kbd>
          </button>
          
          <button 
            onClick={toggleTheme} 
            className="p-2 text-slate-500 hover:text-amber-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <NotificationsPopover />

          <UserProfileModal />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full p-6 max-w-7xl mx-auto w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <CommandPalette />
    </div>
  );
}
