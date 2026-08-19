import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Database, Box, Bell, Save, Palette, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SettingsView() {
  const [activeThemePreset, setActiveThemePreset] = useState('classic');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('theme');

  const themePresets = [
    {
      id: 'classic',
      name: 'AutoML Studio Classic Brand Theme (Initial Theme)',
      desc: 'Clean brand indigo & slate colors, responsive light/dark mode support, high-readability design system.',
      color: 'from-brand-600 to-indigo-600',
      badge: 'Active Selected'
    },
    {
      id: 'cyberpunk',
      name: 'Ultra Modern Glassmorphism & Cyberpunk Neon',
      desc: 'Translucent glass cards, electric violet & cyan accents, glowing borders, dynamic mesh gradients.',
      color: 'from-violet-600 to-cyan-500',
      badge: 'Available'
    },
    {
      id: 'figma-saas',
      name: 'Figma SaaS Platform Layout (Wireframe Kit)',
      desc: 'Collapsible left sidebar, contextual breadcrumb top header, 4-KPI metric grid.',
      color: 'from-blue-600 to-indigo-600',
      badge: 'Available'
    },
    {
      id: 'vision',
      name: 'Apple Vision Translucent (visionOS)',
      desc: 'Ultra-soft frosted glass, 3D pill controls, specular highlights, elegant translucent material physics.',
      color: 'from-slate-500 to-indigo-400',
      badge: 'Available'
    }
  ];

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" /> Platform Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure UI design themes, training parameters, and defaults.</p>
        </div>
        
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all font-semibold text-sm shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saveSuccess ? 'Saved Successfully!' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1.5">
          {[
            { id: 'theme', label: 'UI/UX Design Themes', icon: Palette },
            { id: 'general', label: 'General Parameters', icon: SettingsIcon },
            { id: 'training', label: 'Training Defaults', icon: Sliders },
            { id: 'data', label: 'Data Preferences', icon: Database },
            { id: 'model', label: 'Model Defaults', icon: Box },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-semibold rounded-xl transition-colors ${activeSection === tab.id ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'}`}>
              <tab.icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-6">
          {/* UI/UX Theme Preset Selector */}
          {activeSection === 'theme' && <section className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-heading font-bold flex items-center gap-2">
                  <Palette className="w-5 h-5 text-brand-600 dark:text-brand-400" /> UI/UX Design System Templates
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select visual design theme for AutoML Studio.</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" /> Classic Brand
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {themePresets.map((tp) => {
                const isSelected = activeThemePreset === tp.id;
                return (
                  <div 
                    key={tp.id}
                    onClick={() => setActiveThemePreset(tp.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-brand-50/50 dark:bg-slate-800/90 border-brand-500 shadow-md' 
                        : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-r ${tp.color} flex items-center justify-center text-white font-bold text-xs shadow-md`}>
                        {tp.name[0]}
                      </div>
                      {isSelected ? (
                        <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold bg-brand-600 text-white rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-white" /> Active Theme
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Select</span>
                      )}
                    </div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">{tp.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{tp.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>}

          {/* General Settings */}
          {activeSection === 'general' && <section className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-heading font-bold flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" /> General Parameters
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Platform Instance Name</label>
                <input type="text" defaultValue="AutoML Studio Classic Brand" className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Default Compute Worker</label>
                <select className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500">
                  <option className="bg-white dark:bg-slate-900">GPU Cluster (Nvidia A10G)</option>
                  <option className="bg-white dark:bg-slate-900">CPU Worker (16 Cores)</option>
                </select>
              </div>
            </div>
          </section>}

          {activeSection === 'training' && <section className="glass-card p-6 space-y-5"><h2 className="text-lg font-heading font-bold">Training Defaults</h2><label className="block text-sm">Cross-validation folds<input type="number" min="2" max="20" defaultValue="5" className="mt-2 w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" /></label><label className="block text-sm">Primary optimization metric<select defaultValue="accuracy" className="mt-2 w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"><option value="accuracy">Accuracy</option><option value="f1">F1 score</option><option value="r2">R²</option><option value="rmse">RMSE</option></select></label></section>}
          {activeSection === 'data' && <section className="glass-card p-6 space-y-5"><h2 className="text-lg font-heading font-bold">Data Preferences</h2><label className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked /> Automatically profile uploaded datasets</label><label className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked /> Detect duplicate rows and schema issues</label><label className="block text-sm">Preview row limit<input type="number" min="10" max="1000" defaultValue="100" className="mt-2 w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" /></label></section>}
          {activeSection === 'model' && <section className="glass-card p-6 space-y-5"><h2 className="text-lg font-heading font-bold">Model Defaults</h2><label className="block text-sm">Default registry stage<select className="mt-2 w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"><option>Candidate</option><option>Staging</option></select></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked /> Register the winning model automatically</label></section>}
          {activeSection === 'notifications' && <section className="glass-card p-6 space-y-5"><h2 className="text-lg font-heading font-bold">Notifications</h2><label className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked /> Training completion alerts</label><label className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked /> Deployment and drift warnings</label><label className="block text-sm">Notification email<input type="email" defaultValue="dhanush@automlstudio.ai" className="mt-2 w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" /></label></section>}
        </div>
      </div>
    </div>
  );
}
