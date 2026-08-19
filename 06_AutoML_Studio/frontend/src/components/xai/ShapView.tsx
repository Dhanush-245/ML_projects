import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../utils/apiClient';

interface ShapViewProps {
  modelId: string;
  modelLabel: string;
}

export default function ShapView({ modelId, modelLabel }: ShapViewProps) {
  const [shapData, setShapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const strongestFeature = shapData.length > 0 ? shapData[shapData.length - 1] : null;

  useEffect(() => {
    if (!modelId) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      setShapData([]);
      try {
        const response = await api.post(`/xai/shap/${modelId}`);
        const data = response.data || response;
        const rawImportance = Array.isArray(data)
          ? data
          : Array.isArray(data.feature_importance)
            ? data.feature_importance
            : Object.entries(data.feature_importance || {}).map(([feature, importance]) => ({ feature, importance }));
        const formattedData = rawImportance
          .map((item: any) => ({ feature: item.feature, importance: Number(item.importance) }))
          .sort((a: any, b: any) => b.importance - a.importance)
          .slice(0, 20)
          .reverse();
        setShapData(formattedData);
      } catch (err: any) {
        setError(err.message || 'Failed to load SHAP values');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [modelId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 glass-card">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 glass-card text-rose-500 gap-2">
        <AlertCircle className="w-6 h-6" /> {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="font-heading font-semibold text-lg">Global Feature Importance</h3>
          <span className="px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-semibold">{modelLabel}</span>
        </div>
        <p className="text-sm text-slate-500 mb-6">Mean absolute SHAP values across all predictions</p>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shapData} layout="vertical" margin={{ left: 150 }}>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="importance" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-6 flex flex-col justify-center">
        <h3 className="font-heading font-semibold text-lg mb-4">Summary</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          This explanation is calculated specifically for <strong>{modelLabel}</strong>.
        </p>
        {strongestFeature && (
          <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Strongest feature</p>
            <p className="mt-1 text-sm font-mono font-semibold text-slate-900 dark:text-white break-all">{strongestFeature.feature}</p>
            <p className="mt-1 text-xs text-slate-500">Mean |SHAP|: {strongestFeature.importance.toFixed(4)}</p>
          </div>
        )}
        <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-sm text-brand-800 dark:text-brand-300">
          Tip: High impact features should be closely monitored for data drift in production.
        </div>
      </div>
    </div>
  );
}
