import React, { useState, useEffect } from 'react';
import { Database, Box, Tag, ArrowRight, Activity, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../utils/apiClient';

export default function ModelRegistryView() {
  const [selectedModels, setSelectedModels] = useState<Array<string | number>>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await api.get('/registry/models');
      const records = res.data || res;
      setModels((Array.isArray(records) ? records : []).map((model: any) => ({
        ...model,
        name: `Model ${model.id}`,
        version: `v${model.id}`,
        algo: model.algorithm,
        dataset: `Experiment ${model.experiment_id}`,
        stage: model.is_champion ? 'Production' : 'Candidate',
        metrics: Object.fromEntries(
          Object.entries(model.metrics || {}).filter(([, value]) => typeof value === 'number').slice(0, 4)
        ),
      })));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (id: string | number) => {
    try {
      await api.post(`/registry/models/${id}/promote`);
      fetchModels();
    } catch (err: any) {
      setError(err.message || 'Failed to promote model');
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await api.delete(`/registry/models/${id}`);
      fetchModels();
    } catch (err: any) {
      setError(err.message || 'Failed to delete model');
    }
  };

  const toggleModel = (id: string | number) => {
    setSelectedModels(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const getStageColor = (stage: string) => {
    switch(stage?.toLowerCase()) {
      case 'production': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'staging': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'dev': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Model Registry</h1>
          <p className="text-slate-500 dark:text-slate-400 font-body">Manage model versions, compare performance, and promote to production.</p>
        </div>
        <div className="flex gap-3">
          {selectedModels.length >= 2 && (
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg font-medium text-sm transition-colors">
              <Activity className="w-4 h-4" />
              Compare Models ({selectedModels.length})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 flex items-center gap-2 text-rose-600 bg-rose-50 dark:bg-rose-900/10 rounded-lg">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" onChange={(e) => {
                    if (e.target.checked) setSelectedModels(models.map(m => m.id));
                    else setSelectedModels([]);
                  }} />
                </th>
                <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Model Name</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Version</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Algorithm</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Metrics</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto" />
                    <p className="mt-2 text-sm text-slate-500">Loading registry...</p>
                  </td>
                </tr>
              ) : models.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No models found in the registry.
                  </td>
                </tr>
              ) : models.map((model, idx) => (
                <motion.tr 
                  key={model.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      checked={selectedModels.includes(model.id)}
                      onChange={() => toggleModel(model.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Box className="w-4 h-4 text-brand-500" />
                      {model.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {model.dataset || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium font-mono">
                      <Tag className="w-3 h-3" />
                      {model.version}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {model.algo}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs">
                      {Object.entries(model.metrics || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between w-24">
                          <span className="text-slate-500">{k}:</span>
                          <span className="font-medium text-slate-900 dark:text-white">{typeof v === 'number' ? v.toFixed(3) : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStageColor(model.stage)}`}>
                      {model.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePromote(model.id)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-md transition-colors" title="Promote Stage">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(model.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
