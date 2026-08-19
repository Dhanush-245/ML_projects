import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Rocket, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../utils/apiClient';
import { useAppStore } from '../../stores/appStore';

export default function ModelEvaluation({ experimentId, modelId, onBack }: { experimentId: number | null; modelId: string | null; onBack: () => void }) {
  const { addDeployment } = useAppStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    if (!experimentId || !modelId) {
      setError('Missing experiment or model ID.');
      setLoading(false);
      return;
    }

    const fetchEvaluation = async () => {
      try {
        const result = await api.get(`/training/experiments/${experimentId}/evaluation/${modelId}`);
        setMetrics(result);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load model evaluation.');
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [experimentId, modelId]);

  const handleDeploy = async () => {
    if (!modelId) return;
    setDeploying(true);
    try {
      const result = await api.post(`/deployment/deploy/${modelId}`);
      addDeployment({
        id: `dep-${result.id}`,
        backendId: result.id,
        name: result.name || `Deployment ${result.id}`,
        url: result.endpoint_url,
        status: result.status,
        modelId: Number(modelId),
      });
      alert('Model deployed successfully! Check the Deployment Center.');
    } catch (err: any) {
      alert('Deployment failed: ' + (err.message || 'Unknown error'));
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading evaluation metrics from backend...</span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl flex items-center gap-3 max-w-xl mx-auto mt-12">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span>{error || 'No metrics available.'}</span>
      </div>
    );
  }

  // Build ROC curve data from real metrics
  const rocData: { fpr: number; tpr: number }[] = [];
  if (metrics.roc_curve_fpr && metrics.roc_curve_tpr) {
    for (let i = 0; i < metrics.roc_curve_fpr.length; i++) {
      rocData.push({
        fpr: Math.round(metrics.roc_curve_fpr[i] * 1000) / 1000,
        tpr: Math.round(metrics.roc_curve_tpr[i] * 1000) / 1000,
      });
    }
  }

  // Confusion matrix
  const cm = metrics.confusion_matrix || [[0, 0], [0, 0]];
  const isClassification = metrics.accuracy !== undefined;

  // Key metrics
  const primaryMetrics = isClassification
    ? [
        { label: 'Accuracy', value: metrics.accuracy },
        { label: 'F1 Score', value: metrics.f1 },
        { label: 'Precision', value: metrics.precision },
        { label: 'Recall', value: metrics.recall },
      ]
    : [
        { label: 'R² Score', value: metrics.r2 },
        { label: 'MAE', value: metrics.mae },
        { label: 'RMSE', value: metrics.rmse },
        { label: 'MAPE', value: metrics.mape },
      ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Model #{modelId}</h2>
            <p className="text-sm text-slate-500">Evaluation Report • Experiment #{experimentId}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
            <Download className="w-4 h-4" />
            Export Artifacts
          </button>
          <button 
            onClick={handleDeploy}
            disabled={deploying}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            {deploying ? 'Deploying...' : 'Deploy Model'}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {primaryMetrics.map((m) => (
          <div key={m.label} className="glass-card p-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{m.label}</p>
            <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mt-1 font-mono">
              {typeof m.value === 'number' ? m.value.toFixed(4) : '-'}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve (Classification only) */}
        {isClassification && rocData.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-white mb-4">
              ROC Curve {metrics.roc_auc ? `(AUC: ${metrics.roc_auc.toFixed(4)})` : ''}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rocData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="fpr" label={{ value: 'False Positive Rate', position: 'bottom', fontSize: 11, fill: '#94a3b8' }} stroke="#64748b" fontSize={10} />
                  <YAxis label={{ value: 'True Positive Rate', angle: -90, position: 'left', fontSize: 11, fill: '#94a3b8' }} stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 11 }} />
                  <Line type="monotone" dataKey="tpr" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fpr" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Confusion Matrix (Classification only) */}
        {isClassification && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-white mb-4">Confusion Matrix</h3>
            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
              {cm.flat ? cm.flat().map((val: number, i: number) => {
                const labels = ['True Neg', 'False Pos', 'False Neg', 'True Pos'];
                const colors = [
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                  'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
                  'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                ];
                return (
                  <div key={i} className={`p-4 rounded-lg text-center ${colors[i]}`}>
                    <div className="text-2xl font-heading font-bold">{val}</div>
                    <div className="text-xs mt-1 opacity-70">{labels[i]}</div>
                  </div>
                );
              }) : (
                <div className="col-span-2 text-center text-slate-500 text-sm">No confusion matrix data</div>
              )}
            </div>
          </div>
        )}

        {/* Regression: Actual vs Predicted (if available) */}
        {!isClassification && metrics.actual_vs_predicted && (
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-white mb-4">Actual vs Predicted (First 100 Samples)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.actual_vs_predicted.map((p: any, i: number) => ({ idx: i, actual: p.actual, predicted: p.predicted }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="idx" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 11 }} />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={false} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2} dot={false} name="Predicted" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Cross-Validation Scores */}
        {metrics.cv_scores && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-white mb-4">Cross-Validation Scores</h3>
            <div className="space-y-2">
              {metrics.cv_scores.map((score: number, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-mono">Fold {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-brand-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(score * 100, 100)}%` }}
                      />
                    </div>
                    <span className="font-mono font-medium text-slate-900 dark:text-white w-16 text-right">
                      {score.toFixed(4)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Mean ± Std</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                  {(metrics.cv_scores.reduce((a: number, b: number) => a + b, 0) / metrics.cv_scores.length).toFixed(4)}
                  {' ± '}
                  {Math.sqrt(metrics.cv_scores.reduce((sum: number, s: number, _: number, arr: number[]) => sum + Math.pow(s - arr.reduce((a: number, b: number) => a + b, 0) / arr.length, 2), 0) / metrics.cv_scores.length).toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Additional Metrics */}
        {metrics.mcc !== undefined && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-white mb-4">Additional Metrics</h3>
            <div className="space-y-3">
              {[
                { label: 'MCC (Matthews)', value: metrics.mcc },
                { label: 'ROC AUC', value: metrics.roc_auc },
                { label: 'Training Time', value: metrics.training_time_seconds ? `${metrics.training_time_seconds.toFixed(2)}s` : '-' },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{m.label}</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {typeof m.value === 'number' ? m.value.toFixed(4) : m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
