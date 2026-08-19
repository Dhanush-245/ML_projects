import React, { useState } from 'react';
import { Database, Trash2, Download, Eye, Sparkles, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { downloadDatasetAsCSV } from '../../utils/csvParser';
import { api } from '../../utils/apiClient';

export default function DatasetList() {
  const { datasets, activeDataset, setActiveDataset, deleteDataset, setDatasetSubTab, getBackendDatasetId } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = datasets.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete dataset "${name}"?`)) {
      setDeletingId(id);
      try {
        const backendId = getBackendDatasetId(id);
        if (backendId !== null) await api.delete(`/datasets/${backendId}`);
        deleteDataset(id);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Dataset could not be deleted.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (datasets.length === 0) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
        <Database className="w-12 h-12 text-brand-500 mx-auto" />
        <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white">No Datasets Uploaded</h3>
        <p className="text-sm text-slate-500">Upload your first CSV dataset to start profiling, cleaning, and training models.</p>
        <button 
          onClick={() => setDatasetSubTab('upload')}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold mx-auto transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Upload Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Uploaded Datasets ({datasets.length})</h2>
          <span className="px-2.5 py-0.5 text-xs bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-semibold rounded-full">
            Active: {activeDataset ? activeDataset.name : 'None'}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search datasets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 w-full sm:w-64"
          />
          <button 
            onClick={() => setDatasetSubTab('upload')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Upload New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((ds) => {
          const isActive = activeDataset?.id === ds.id;
          const scoreColor = ds.qualityScore >= 85 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ds.qualityScore >= 65 ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';

          return (
            <div 
              key={ds.id} 
              className={`glass-card p-6 flex flex-col justify-between transition-all ${
                isActive ? 'border-2 border-brand-500 shadow-md' : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-base text-slate-900 dark:text-white truncate max-w-[160px]" title={ds.name}>
                        {ds.name}
                      </h3>
                      <span className="text-xs text-slate-400">{ds.columns.length} columns</span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                      Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block">Rows</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{ds.rows.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Null Cells</span>
                    <span className={`font-mono font-semibold ${ds.missingValuesCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {ds.missingValuesCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Duplicates</span>
                    <span className={`font-mono font-semibold ${ds.duplicateRowsCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {ds.duplicateRowsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Quality</span>
                    <span className={`font-mono font-bold ${scoreColor.split(' ')[0]}`}>{ds.qualityScore}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-2">
                <button 
                  onClick={() => setActiveDataset(ds)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-1 justify-center ${
                    isActive 
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200 dark:border-brand-800' 
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isActive ? 'Previewing' : 'Select'}
                </button>

                <button 
                  onClick={() => downloadDatasetAsCSV(ds, '_export.csv')}
                  className="p-2 text-slate-500 hover:text-brand-600 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Download CSV file"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => void handleDelete(ds.id, ds.name)}
                  disabled={deletingId === ds.id}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                  title="Delete Dataset"
                >
                  {deletingId === ds.id ? <span className="block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
