import React from 'react';
import DataUploader from './DataUploader';
import DataPreview from './DataPreview';
import DataProfile from './DataProfile';
import DataQuality from './DataQuality';
import DataCompare from './DataCompare';
import DataPreprocessingStudio from './DataPreprocessingStudio';
import DatasetList from './DatasetList';
import { Database, Eye, BarChart2, ShieldCheck, Sparkles, Download, Sliders, FolderKanban } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export default function DatasetHub() {
  const { activeDataset, datasets, datasetSubTab, setDatasetSubTab, downloadCleanedDataset, autoFixAllIssues } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Data Management & Analytics</h1>
          {activeDataset && (
            <p className="text-xs text-slate-500 mt-1">
              Active Dataset: <span className="font-semibold text-brand-600 dark:text-brand-400">{activeDataset.name}</span> ({activeDataset.rows.toLocaleString()} rows, {activeDataset.columns.length} columns)
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {activeDataset && (
            <div className="flex items-center gap-2">
              <button
                onClick={autoFixAllIssues}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Auto-Preprocess & Clean
              </button>

              <button
                onClick={downloadCleanedDataset}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4 text-brand-500" />
                Download CSV
              </button>
            </div>
          )}

          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
            {[
              { id: 'list', icon: FolderKanban, label: `My Datasets (${datasets.length})` },
              { id: 'upload', icon: Database, label: 'Upload' },
              { id: 'preview', icon: Eye, label: 'Preview', disabled: !activeDataset },
              { id: 'profile', icon: BarChart2, label: 'Profile & Analytics', disabled: !activeDataset },
              { id: 'quality', icon: ShieldCheck, label: 'Quality Score', disabled: !activeDataset },
              { id: 'preprocessing', icon: Sliders, label: 'Preprocessing', disabled: !activeDataset },
              { id: 'compare', icon: Sparkles, label: 'Before/After Comparison', disabled: !activeDataset },
            ].map(tab => (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => setDatasetSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  datasetSubTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {datasetSubTab === 'list' && <DatasetList />}
        {datasetSubTab === 'upload' && <DataUploader />}
        {datasetSubTab === 'preview' && <DataPreview />}
        {datasetSubTab === 'profile' && <DataProfile />}
        {datasetSubTab === 'quality' && <DataQuality />}
        {datasetSubTab === 'preprocessing' && <DataPreprocessingStudio />}
        {datasetSubTab === 'compare' && <DataCompare />}
      </div>
    </div>
  );
}
