import React, { useState } from 'react';
import { ArrowRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../utils/apiClient';

interface CounterfactualViewProps {
  modelId: string;
  modelLabel: string;
}

export default function CounterfactualView({ modelId, modelLabel }: CounterfactualViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!modelId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/xai/counterfactual/${modelId}`, { desired_outcome: 1 });
      const data = response.data || response;
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate counterfactual');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-lg mb-2">What-If Analysis</h3>
        <p className="text-sm text-slate-500 mb-6">Find the minimum changes required to flip a prediction.</p>
        <p className="text-xs font-semibold text-brand-600 -mt-4 mb-6">{modelLabel}</p>
        
        {error && (
          <div className="mb-4 p-4 flex items-center gap-2 text-rose-600 bg-rose-50 dark:bg-rose-900/10 rounded-lg">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
          <div className="md:col-span-2 p-5 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-rose-200/50 dark:border-rose-800/50 pb-2">
              <span className="font-medium text-rose-900 dark:text-rose-200">Baseline Instance</span>
              <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 text-xs font-bold rounded">Test row 0</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Uses a real transformed holdout row from the selected model and finds the nearest reference row that produces the requested class.</p>
          </div>
          
          <div className="md:col-span-1 flex flex-col items-center justify-center gap-2">
            <button 
              onClick={handleGenerate}
              disabled={loading || !modelId}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-lg shadow-sm font-medium transition-all text-sm w-full justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} 
              {loading ? 'Generating...' : 'Generate'}
            </button>
            <ArrowRight className="w-6 h-6 text-slate-300 hidden md:block mt-2" />
          </div>

          <div className="md:col-span-2 p-5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-4 relative overflow-hidden min-h-[160px]">
            {result ? (
              <>
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full"></div>
                <div className="flex justify-between items-center border-b border-emerald-200/50 dark:border-emerald-800/50 pb-2 relative z-10">
                  <span className="font-medium text-emerald-900 dark:text-emerald-200">Counterfactual</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 text-xs font-bold rounded">{result.prediction || 'Approved'}</span>
                </div>
                <div className="space-y-2 text-sm relative z-10">
                  {Object.entries(result.features || {}).map(([key, val]: any) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">{key}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{val}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Click generate to see changes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
