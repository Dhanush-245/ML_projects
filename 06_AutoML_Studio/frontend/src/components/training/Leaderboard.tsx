import React, { useState, useEffect } from 'react';
import { Trophy, ChevronRight, BarChart2, Activity, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../utils/apiClient';

interface TrainedModelResult {
  id: number;
  algorithm: string;
  metrics: Record<string, any>;
  hyperparameters: Record<string, any>;
  is_champion: boolean;
  created_at: string;
}

export default function Leaderboard({ experimentId, onSelectModel }: { experimentId: number | null; onSelectModel: (id: string) => void }) {
  const [models, setModels] = useState<TrainedModelResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!experimentId) {
      setError('No experiment ID available.');
      setLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        const result = await api.get(`/training/experiments/${experimentId}/leaderboard`);
        setModels(Array.isArray(result) ? result : []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load leaderboard.');
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [experimentId]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading leaderboard from backend...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl flex items-center gap-3 max-w-xl mx-auto mt-12">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  // Determine the best model (first in sorted list)
  const championIdx = 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Leaderboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real model rankings from Experiment #{experimentId}. {models.length} models trained.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            disabled={selectedIds.size < 2}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
          >
            Compare Selected
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 w-12 text-center"><input type="checkbox" className="rounded" /></th>
              <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Rank</th>
              <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Model Name</th>
              <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Accuracy / R²</th>
              <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">F1 / MAE</th>
              <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Train Time</th>
              <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {models.map((model, idx) => {
              const isChampion = idx === championIdx;
              const acc = model.metrics?.accuracy ?? model.metrics?.r2 ?? 0;
              const f1 = model.metrics?.f1 ?? model.metrics?.mae ?? 0;
              const trainTime = model.metrics?.training_time_seconds 
                ? `${model.metrics.training_time_seconds.toFixed(1)}s` 
                : '-';

              return (
                <tr 
                  key={model.id} 
                  className={`group transition-colors ${
                    isChampion ? 'bg-amber-50/30 dark:bg-amber-900/10 hover:bg-amber-50/50 dark:hover:bg-amber-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={selectedIds.has(String(model.id))} onChange={() => toggleSelect(String(model.id))} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    {isChampion ? (
                      <Trophy className="w-5 h-5 text-amber-500" />
                    ) : (
                      <span className="text-slate-500 font-mono pl-1">{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">{model.algorithm}</span>
                      {isChampion && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs rounded-full font-semibold">Champion</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {typeof acc === 'number' ? acc.toFixed(4) : '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                    {typeof f1 === 'number' ? f1.toFixed(4) : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{trainTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onSelectModel(String(model.id))} className="p-1.5 text-slate-500 hover:text-brand-600 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700" title="View Details">
                        <BarChart2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onSelectModel(String(model.id))} className="flex items-center gap-1 px-2 py-1 bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 rounded text-xs font-medium hover:bg-brand-100 transition-colors">
                        Details <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
