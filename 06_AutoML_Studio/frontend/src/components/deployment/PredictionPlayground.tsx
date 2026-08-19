import React, { useState } from 'react';
import { ArrowLeft, Send, Code, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../utils/apiClient';

export default function PredictionPlayground({ deploymentId, onBack }: { deploymentId: string, onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [features, setFeatures] = useState<Record<string, string>>({
    Income: '',
    Age: '',
    Credit_Score: '',
    Debt_Ratio: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFeatures(prev => ({ ...prev, [field]: value }));
  };

  const handlePredict = async () => {
    if (!deploymentId) return;
    setLoading(true);
    setError(null);
    try {
      const parsedFeatures = Object.fromEntries(
        Object.entries(features).map(([k, v]) => [k, isNaN(Number(v)) || v === '' ? v : Number(v)])
      );
      
      const response = await api.post(`/deployment/predict/${deploymentId}`, {
        features: parsedFeatures
      });
      const data = response.data || response;
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Prediction Playground</h2>
          <p className="text-sm text-slate-500">Test API Endpoint: {deploymentId}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 flex items-center gap-2 text-rose-600 bg-rose-50 dark:bg-rose-900/10 rounded-lg">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="glass-card flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-heading font-semibold">Request Payload</h3>
          </div>
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {Object.keys(features).map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{field}</label>
                <input 
                  type="text" 
                  value={features[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-brand-500" 
                  placeholder={`Enter ${field}...`} 
                />
              </div>
            ))}
            
            <button 
              onClick={handlePredict}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Running...</span> : <><Send className="w-4 h-4" /> Run Prediction</>}
            </button>
          </div>
        </div>

        <div className="glass-card flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-heading font-semibold">Response</h3>
            <button className="text-slate-400 hover:text-brand-500 transition-colors"><Code className="w-4 h-4" /></button>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            {result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-center">
                  <div className="text-sm text-emerald-800 dark:text-emerald-500 font-medium mb-1">Prediction</div>
                  <div className="text-4xl font-heading font-bold text-emerald-600 dark:text-emerald-400">{result.prediction}</div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-500 mt-2 font-mono">
                    Confidence: {result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
                </div>

                {result.shap && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">Top Drivers</h4>
                    <div className="space-y-2">
                      {result.shap.map((s: any) => (
                        <div key={s.feature} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{s.feature}</span>
                          <span className="font-mono text-emerald-600">{s.impact}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Send className="w-12 h-12 mb-4 opacity-20" />
                <p>Fill out the payload and run prediction</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
