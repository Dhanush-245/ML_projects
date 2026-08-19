import React, { useState, useEffect } from 'react';
import { Play, Copy, ExternalLink, Activity, Server, Shield, Loader2, AlertCircle } from 'lucide-react';
import PredictionPlayground from './PredictionPlayground';
import { api } from '../../utils/apiClient';
import { API_BASE_URL } from '../../api/client';
import { useAppStore } from '../../stores/appStore';

export default function DeploymentCenter() {
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { setActiveView } = useAppStore();

  useEffect(() => {
    async function fetchDeployments() {
      try {
        const res = await api.get('/deployment/');
        setDeployments(res.data || res);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch deployments');
      } finally {
        setLoading(false);
      }
    }
    fetchDeployments();
  }, []);

  if (selectedDeployment) {
    return <PredictionPlayground deploymentId={selectedDeployment} onBack={() => setSelectedDeployment(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Deployment Center</h2>
          <p className="text-sm text-slate-500 mt-1">Manage API endpoints and monitor model performance in production.</p>
        </div>
        <button onClick={() => setActiveView('registry')} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm transition-colors">
          <Play className="w-4 h-4" />
          Deploy New Model
        </button>
      </div>

      {error && (
        <div className="p-4 flex items-center gap-2 text-rose-600 bg-rose-50 dark:bg-rose-900/10 rounded-lg">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : deployments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 glass-card">
            No deployments found.
          </div>
        ) : deployments.map(dep => (
          <div key={dep.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-emerald-500">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${dep.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                <Server className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white">{dep.name}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                    dep.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                  }`}>
                    {dep.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> {dep.model}</span>
                  <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> {dep.requests || 0} reqs</span>
                  <span className="flex items-center gap-1.5 text-slate-400">Avg {dep.latency || '0ms'}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 max-w-sm">
                  <code className="text-xs text-brand-600 dark:text-brand-400 truncate flex-1">{API_BASE_URL}/deployment/predict/{dep.id}</code>
                  <button onClick={async () => { await navigator.clipboard.writeText(`${API_BASE_URL}/deployment/predict/${dep.id}`); setCopiedId(dep.id); window.setTimeout(() => setCopiedId(null), 1500); }} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300" title="Copy URL"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
            {copiedId === dep.id && <span className="text-xs font-medium text-emerald-600">Endpoint copied</span>}
            
            <div className="flex sm:flex-col gap-2">
              <button 
                onClick={() => setSelectedDeployment(dep.id)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Test Endpoint
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
