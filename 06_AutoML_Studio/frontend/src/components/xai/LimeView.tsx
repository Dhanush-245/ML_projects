import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../../utils/apiClient';

interface LimeViewProps {
  modelId: string;
  modelLabel: string;
}

export default function LimeView({ modelId, modelLabel }: LimeViewProps) {
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [limeData, setLimeData] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<string>('Loading...');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rowIds = [0, 1, 2, 3, 4];

  useEffect(() => {
    if (!modelId) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      setLimeData([]);
      setPrediction('Loading...');
      try {
        const response = await api.post(`/xai/lime/${modelId}`, { row_index: selectedRow });
        const data = response.data || response;
        if (data.explanations) {
          setLimeData(data.explanations.sort((a: any, b: any) => Math.abs(a.impact) - Math.abs(b.impact)));
        } else if (data.explanation) {
          setLimeData(data.explanation.map((item: any) => ({ feature: item[0], impact: item[1] })));
        } else if (Array.isArray(data)) {
          setLimeData(data.sort((a: any, b: any) => Math.abs(a.impact) - Math.abs(b.impact)));
        }
        setPrediction(data.prediction || 'Unknown');
      } catch (err: any) {
        setError(err.message || 'Failed to load LIME explanation');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [modelId, selectedRow]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="glass-card p-6 flex flex-col">
        <h3 className="font-heading font-semibold text-lg mb-4">Select Instance</h3>
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ID..." 
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 max-h-64 pr-2">
          {rowIds.map((id) => (
            <button 
              key={id} 
              onClick={() => setSelectedRow(id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors ${
              selectedRow === id 
                ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800' 
                : 'bg-white border-slate-100 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'
            }`}>
              <div className="font-medium text-slate-900 dark:text-white">Row ID: {id}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-heading font-semibold text-lg">Local Explanation (Row {selectedRow})</h3>
            <p className="text-sm text-slate-500">How features contributed to this specific prediction</p>
            <p className="text-xs font-semibold text-brand-600 mt-1">{modelLabel}</p>
          </div>
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg text-sm font-semibold border border-emerald-200 dark:border-emerald-800">
            Prediction: {prediction}
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-rose-500 gap-2">
            <AlertCircle className="w-6 h-6" /> {error}
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={limeData} layout="vertical" margin={{ left: 60 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[-0.4, 0.4]} />
                <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="impact" radius={4} barSize={24}>
                  {limeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Supports Prediction</span>
          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Opposes Prediction</span>
        </div>
      </div>
    </div>
  );
}
