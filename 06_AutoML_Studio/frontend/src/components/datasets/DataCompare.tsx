import React, { useState } from 'react';
import { Download, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Database, Layers, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export default function DataCompare() {
  const { originalDataset, activeDataset, downloadCleanedDataset, setDatasetSubTab } = useAppStore();
  const [viewMode, setViewMode] = useState<'cleaned' | 'original'>('cleaned');

  if (!activeDataset || !originalDataset) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white">No Dataset Loaded</h3>
        <p className="text-sm text-slate-500">Please upload a dataset first to compare raw vs preprocessed data.</p>
        <button 
          onClick={() => setDatasetSubTab('upload')}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const currentData = viewMode === 'cleaned' ? activeDataset : originalDataset;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-700 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-300" />
            <h2 className="text-2xl font-heading font-bold">Data Cleaning & Preprocessing Report</h2>
          </div>
          <p className="text-brand-100 text-sm mt-1">
            Compare dataset metrics before and after automated cleaning & download your preprocessed CSV file.
          </p>
        </div>

        <button 
          onClick={downloadCleanedDataset}
          className="flex items-center gap-2 px-6 py-3 bg-white text-brand-700 hover:bg-brand-50 rounded-xl font-semibold text-sm transition-all shadow-md transform hover:-translate-y-0.5 shrink-0"
        >
          <Download className="w-5 h-5 text-brand-600" />
          Download Cleaned CSV
        </button>
      </div>

      {/* Before vs After Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-brand-500">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Quality Score</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl font-bold text-slate-400 line-through">{originalDataset.qualityScore}</span>
            <ArrowRight className="w-4 h-4 text-brand-500" />
            <span className="text-3xl font-heading font-bold text-emerald-500">{activeDataset.qualityScore}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Quality boost</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Missing Values</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl font-bold text-amber-500">{originalDataset.missingValuesCount}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-3xl font-heading font-bold text-emerald-500">{activeDataset.missingValuesCount}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Imputed with mean/mode</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-rose-500">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Duplicate Rows</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl font-bold text-rose-500">{originalDataset.duplicateRowsCount}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-3xl font-heading font-bold text-emerald-500">{activeDataset.duplicateRowsCount}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Deduplicated</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-purple-500">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Rows & Cols</p>
          <div className="mt-2">
            <span className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
              {activeDataset.rows.toLocaleString()} <span className="text-xs font-normal text-slate-500">rows</span>
            </span>
            <span className="text-xs text-slate-400 block font-mono mt-0.5">{activeDataset.columns.length} features</span>
          </div>
        </div>
      </div>

      {/* Applied Preprocessing Operations */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-500" />
          Automated Preprocessing Operations Applied
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Missing Value Imputation</h4>
              <p className="text-xs text-slate-500 mt-1">Filled missing numerical values with column mean/median and categorical values with mode.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Outlier Clipping & Winsorization</h4>
              <p className="text-xs text-slate-500 mt-1">Clipped extreme numerical values to 1.5x IQR boundaries to prevent model instability.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Row Deduplication & Schema Structuring</h4>
              <p className="text-xs text-slate-500 mt-1">Identified and removed exact row duplicates and verified data type schemas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Data Table Comparison Switcher */}
      <div className="glass-card flex flex-col h-[60vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-500" />
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white">Data View Comparison</h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('cleaned')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'cleaned' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm' : 'text-slate-500'
                }`}
              >
                Preprocessed & Cleaned Data
              </button>
              <button 
                onClick={() => setViewMode('original')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'original' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm' : 'text-slate-500'
                }`}
              >
                Raw Original Data
              </button>
            </div>

            <button 
              onClick={downloadCleanedDataset}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 shadow-sm">
              <tr>
                <th className="px-4 py-2.5 font-medium text-slate-400 border-b border-slate-200 dark:border-slate-800 w-12">#</th>
                {currentData.columns.map((col) => (
                  <th key={col.key} className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 font-mono">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentData.data.slice(0, 15).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 font-mono text-xs">
                  <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                  {currentData.columns.map((col) => {
                    const val = row[col.key];
                    const isMissing = val === null || val === undefined || val === '';
                    return (
                      <td key={col.key} className={`px-4 py-2 ${isMissing ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {isMissing ? 'NaN' : typeof val === 'number' ? val.toLocaleString() : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
