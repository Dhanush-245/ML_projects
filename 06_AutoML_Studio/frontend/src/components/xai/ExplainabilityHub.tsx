import React, { useState, useEffect } from 'react';
import ShapView from './ShapView';
import LimeView from './LimeView';
import CounterfactualView from './CounterfactualView';
import { Layers, Zap, Shuffle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../utils/apiClient';

export default function ExplainabilityHub() {
  const [activeTab, setActiveTab] = useState<'shap' | 'lime' | 'counterfactual'>('shap');
  const [models, setModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await api.get('/xai/models');
        const modelsData = response.data || response;
        setModels(modelsData);
        if (modelsData && modelsData.length > 0) {
          setSelectedModelId(String(modelsData[0].id || modelsData[0].model_id));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load models');
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, []);

  const selectedModel = models.find((model) => String(model.id || model.model_id) === selectedModelId);
  const selectedModelLabel = selectedModel
    ? `${selectedModel.algorithm || selectedModel.name} · Experiment #${selectedModel.experiment_id}`
    : 'Selected model';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Explainability Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Understand how your models make predictions.</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
          {[
            { id: 'shap', icon: Layers, label: 'SHAP (Global)' },
            { id: 'lime', icon: Zap, label: 'LIME (Local)' },
            { id: 'counterfactual', icon: Shuffle, label: 'Counterfactuals' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl">
        <label className="text-sm font-medium text-amber-800 dark:text-amber-500">Selected Model:</label>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        ) : error ? (
          <div className="flex items-center gap-2 text-rose-600 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>
        ) : (
          <select 
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg text-sm focus:outline-none focus:border-amber-400"
          >
            {models.map(m => (
              <option key={m.id || m.model_id} value={m.id || m.model_id}>
                {m.algorithm || m.name || `Model ${m.id || m.model_id}`} · Experiment #{m.experiment_id}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        {activeTab === 'shap' && <ShapView key={`shap-${selectedModelId}`} modelId={selectedModelId} modelLabel={selectedModelLabel} />}
        {activeTab === 'lime' && <LimeView key={`lime-${selectedModelId}`} modelId={selectedModelId} modelLabel={selectedModelLabel} />}
        {activeTab === 'counterfactual' && <CounterfactualView key={`counterfactual-${selectedModelId}`} modelId={selectedModelId} modelLabel={selectedModelLabel} />}
      </div>
    </div>
  );
}
