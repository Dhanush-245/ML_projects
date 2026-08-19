import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../stores/appStore';
import { Search, Database, Play, BarChart2, Layers, X, Rocket, Settings, Activity } from 'lucide-react';

const actions = [
  { id: 'upload', label: 'Upload Dataset', icon: Database, category: 'Data', view: 'data' },
  { id: 'train', label: 'Start Training', icon: Rocket, category: 'Training', view: 'training' },
  { id: 'leaderboard', label: 'View Leaderboard', icon: BarChart2, category: 'Training', view: 'training' },
  { id: 'shap', label: 'SHAP Analysis', icon: Layers, category: 'Explainability', view: 'explainability' },
  { id: 'registry', label: 'Model Registry', icon: Database, category: 'Registry', view: 'registry' },
  { id: 'deploy', label: 'Deploy Model', icon: Play, category: 'Deployment', view: 'deploy' },
  { id: 'monitoring', label: 'Model Monitoring', icon: Activity, category: 'Monitoring', view: 'monitoring' },
  { id: 'settings', label: 'Settings', icon: Settings, category: 'Settings', view: 'settings' },
];

export default function CommandPalette() {
  const { commandPaletteOpen, toggleCommandPalette, setActiveView } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase()) || 
    action.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter' && filteredActions.length > 0) {
      e.preventDefault();
      executeAction(filteredActions[selectedIndex]);
    } else if (e.key === 'Escape') {
      toggleCommandPalette();
    }
  };

  const executeAction = (action: typeof actions[0]) => {
    setActiveView(action.view);
    toggleCommandPalette();
  };

  if (!commandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={toggleCommandPalette}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 px-3 py-2 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-body text-lg"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
            <button onClick={toggleCommandPalette} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredActions.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No results found.</div>
            ) : (
              <div className="space-y-1">
                {filteredActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => executeAction(action)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        idx === selectedIndex
                          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${idx === selectedIndex ? 'text-brand-500' : 'text-slate-400'}`} />
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">{action.label}</span>
                        <span className="text-xs opacity-70">{action.category}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">↑</kbd><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">Enter</kbd> to select</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">Esc</kbd> to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
