import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../utils/apiClient';

export default function TrainingProgress({ experimentId, onComplete }: { experimentId: number | null; onComplete: () => void }) {
  const { addExperiment } = useAppStore();
  const [status, setStatus] = useState<'running' | 'completed' | 'failed'>('running');
  const [completedModels, setCompletedModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer to show elapsed time
  useEffect(() => {
    if (status !== 'running') return;
    const timer = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Poll backend for experiment status
  useEffect(() => {
    if (!experimentId) {
      setError('No experiment ID. Please re-launch training.');
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const result = await api.get(`/training/experiments/${experimentId}`);
        const exp = result.experiment;
        const models = result.models || [];

        // Update completed models list
        const modelNames = models.map((m: any) => m.algorithm);
        setCompletedModels(modelNames);

        if (exp.status === 'completed') {
          clearInterval(pollInterval);
          setStatus('completed');

          // Add to store
          const bestModel = models.reduce((best: any, m: any) => {
            const acc = m.metrics?.accuracy || m.metrics?.r2 || 0;
            const bestAcc = best?.metrics?.accuracy || best?.metrics?.r2 || 0;
            return acc > bestAcc ? m : best;
          }, models[0]);

          addExperiment({
            id: `exp-${experimentId}`,
            backendId: experimentId,
            name: exp.name || `AutoML Run #${experimentId}`,
            modelsTrained: models.length,
            bestModel: bestModel?.algorithm || 'Unknown',
            bestMetric: bestModel?.metrics?.accuracy || bestModel?.metrics?.r2 || 0,
            accuracy: bestModel?.metrics?.accuracy || bestModel?.metrics?.r2 || 0,
            algorithm: bestModel?.algorithm,
            timestamp: new Date().toISOString(),
          });

          setTimeout(onComplete, 1500);
        } else if (exp.status === 'failed') {
          clearInterval(pollInterval);
          setStatus('failed');
          setError('Training failed on the backend. Check server logs.');
        }
      } catch (err: any) {
        console.warn('[AutoML Studio] Poll error:', err.message);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [experimentId]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-12">
      <div className="text-center space-y-4">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
          status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' :
          status === 'failed' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600' :
          'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
        } mb-4`}>
          {status === 'completed' ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : status === 'failed' ? (
            <AlertCircle className="w-8 h-8" />
          ) : (
            <Loader2 className="w-8 h-8 animate-spin" />
          )}
        </div>
        <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
          {status === 'completed' ? 'Training Complete!' :
           status === 'failed' ? 'Training Failed' :
           'Training Models on Backend...'}
        </h2>
        <p className="text-slate-500">
          {status === 'completed' ? `Finished in ${formatTime(elapsedSeconds)}. Navigating to leaderboard...` :
           status === 'failed' ? error :
           `Running real ML training with cross-validation. Elapsed: ${formatTime(elapsedSeconds)}`}
        </p>
      </div>

      {error && status === 'failed' && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-sm border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      <div className="glass-card p-6">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-slate-700 dark:text-slate-300">Training Progress</span>
          <span className="text-brand-600 dark:text-brand-400 font-mono">
            {status === 'completed' ? '100%' : `${completedModels.length} models trained`}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ease-out ${
              status === 'completed' ? 'bg-emerald-500' :
              status === 'failed' ? 'bg-rose-500' :
              'bg-gradient-to-r from-brand-500 to-violet-500'
            }`}
            style={{ width: status === 'completed' ? '100%' : status === 'failed' ? '100%' : '60%' }} 
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-3 font-mono">
          <span>Experiment #{experimentId}</span>
          <span>Status: {status === 'running' ? 'Training & Cross-Validating' : status}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-heading font-semibold text-lg">Completed Models</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {completedModels.map((model) => (
              <motion.div 
                key={model}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 flex items-center gap-3 border-l-4 border-l-emerald-500"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="font-medium text-slate-900 dark:text-white">{model}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {status === 'running' && completedModels.length === 0 && (
            <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-l-brand-500 col-span-2">
              <Loader2 className="w-5 h-5 text-brand-500 animate-spin shrink-0" />
              <span className="text-slate-600 dark:text-slate-300 text-sm">
                Backend is preprocessing data and training models. This may take 30-120 seconds for your dataset...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
