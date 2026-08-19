import React, { useState } from 'react';
import { Rocket, AlertCircle, Sliders } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../utils/apiClient';

const classificationGroups = [
  { group: 'Linear Models', models: ['Logistic Regression'] },
  { group: 'Tree-based', models: ['Random Forest', 'Extra Trees', 'Decision Tree'] },
  { group: 'Boosting & Neighbors', models: ['XGBoost', 'LightGBM', 'CatBoost', 'Gradient Boosting', 'KNN'] },
];
const regressionGroups = [
  { group: 'Linear Models', models: ['Linear Regression', 'Ridge', 'Lasso', 'ElasticNet', 'Bayesian Ridge', 'Huber Regressor'] },
  { group: 'Tree-based', models: ['Random Forest', 'Extra Trees', 'Decision Tree'] },
  { group: 'Boosting & Neighbors', models: ['XGBoost', 'LightGBM', 'CatBoost', 'Gradient Boosting', 'KNN', 'SVR'] },
];

export default function AutoMLConfig({ onLaunch }: { onLaunch: (experimentId?: number) => void }) {
  const { activeDataset, setDatasetSubTab, setActiveView, getBackendDatasetId, setActiveExperimentId, preprocessingConfig, pipelineApplied } = useAppStore();

  const datasetColumns = activeDataset?.columns.map((c) => c.key) || [];
  const [targetCol, setTargetCol] = useState(datasetColumns[datasetColumns.length - 1] || '');
  const [problemType, setProblemType] = useState('Classification');
  const [metric, setMetric] = useState('accuracy');
  const [cvFolds, setCvFolds] = useState(5);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([
    'Random Forest', 'XGBoost', 'LightGBM', 'CatBoost', 'Logistic Regression'
  ]);
  const algorithmGroups = problemType === 'Classification' ? classificationGroups : regressionGroups;
  const allAlgorithms = algorithmGroups.flatMap((group) => group.models);

  const toggleAlgorithm = (name: string) => {
    setSelectedAlgorithms(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const handleLaunchTraining = async () => {
    if (!activeDataset) {
      setLaunchError('Please upload a dataset first.');
      return;
    }

    const backendDatasetId = getBackendDatasetId(activeDataset.id);
    if (backendDatasetId === null) {
      setLaunchError('Dataset not synced with backend. Please re-upload your dataset.');
      return;
    }

    if (!targetCol) {
      setLaunchError('Please select a target column.');
      return;
    }

    if (selectedAlgorithms.length === 0) {
      setLaunchError('Please select at least one algorithm.');
      return;
    }

    setIsLaunching(true);
    setLaunchError(null);

    try {
      const result = await api.post('/training/run', {
        dataset_id: backendDatasetId,
        target_column: targetCol,
        problem_type: problemType.toLowerCase() === 'auto-detect' ? 'classification' : problemType.toLowerCase(),
        algorithms: selectedAlgorithms,
        cv_folds: cvFolds,
        metric: metric,
        preprocessing_config: preprocessingConfig,
      });

      console.log('[AutoML Studio] Training started:', result);
      setActiveExperimentId(result.experiment_id);
      onLaunch(result.experiment_id);
    } catch (err: any) {
      console.error('[AutoML Studio] Training launch failed:', err);
      setLaunchError(err.message || 'Training launch failed. Is the backend server running?');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!activeDataset && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-sm text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
            <span>No dataset uploaded. Please upload your dataset first to train models on your real data.</span>
          </div>
          <button 
            onClick={() => {
              setActiveView('data');
              setDatasetSubTab('upload');
            }}
            className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
          >
            Upload Data
          </button>
        </div>
      )}

      {launchError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{launchError}</span>
        </div>
      )}

      <div className="glass-card p-6 border-l-4 border-l-brand-500">
        <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Rocket className="w-6 h-6 text-brand-500" />
          Configure AutoML Training {activeDataset ? `(${activeDataset.name})` : ''}
        </h2>
        <p className="text-sm text-slate-500 mt-2">Select target variable, metric goals, and training model algorithms. Training runs on the real backend with scikit-learn, XGBoost, LightGBM, and CatBoost.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-heading font-semibold text-lg border-b border-slate-200 dark:border-slate-800 pb-2">Basic Setup</h3>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Target Column</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono font-semibold"
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
            >
              {datasetColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Problem Type</label>
            <div className="flex gap-2">
              {['Classification', 'Regression'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setProblemType(type);
                    setMetric(type === 'Classification' ? 'accuracy' : 'r2');
                    setSelectedAlgorithms(type === 'Classification'
                      ? ['Logistic Regression', 'Random Forest']
                      : ['Linear Regression', 'Random Forest']);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors border ${
                    problemType === type 
                      ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-500 text-brand-700 dark:text-brand-300' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Primary Metric Goal</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            >
              {problemType === 'Classification' ? (
                <>
                  <option value="accuracy">Accuracy</option>
                  <option value="f1">F1 Score (Weighted)</option>
                  <option value="roc_auc">ROC AUC</option>
                  <option value="precision">Precision</option>
                </>
              ) : (
                <>
                  <option value="r2">R² Score</option>
                  <option value="rmse">RMSE</option>
                  <option value="mae">MAE</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cross-Validation Folds</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              value={cvFolds}
              onChange={(e) => setCvFolds(Number(e.target.value))}
            >
              <option value={3}>3-Fold CV</option>
              <option value={5}>5-Fold CV (Recommended)</option>
              <option value={10}>10-Fold CV</option>
            </select>
          </div>

          <div className="space-y-3 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/60 dark:bg-brand-900/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Sliders className="w-4 h-4 text-brand-500" /> Pipeline configuration
              </label>
              <span className={`text-xs font-semibold ${pipelineApplied ? 'text-emerald-600' : 'text-amber-600'}`}>
                {pipelineApplied ? 'Applied' : 'Using saved defaults'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {preprocessingConfig.num_imputer} imputation • {preprocessingConfig.scaler} scaling • {preprocessingConfig.encoder} encoding
            </p>
            <button type="button" onClick={() => setActiveView('pipeline')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Configure in Pipeline →
            </button>
          </div>
        </div>

        <div className="glass-card p-6 space-y-6">
          <h3 className="font-heading font-semibold text-lg border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
            Algorithms
            <span 
              onClick={() => {
                setSelectedAlgorithms(selectedAlgorithms.length === allAlgorithms.length ? [] : allAlgorithms);
              }}
              className="text-xs font-normal text-slate-500 cursor-pointer hover:text-brand-500"
            >
              {selectedAlgorithms.length > 5 ? 'Deselect All' : 'Select All'}
            </span>
          </h3>
          
          <div className="space-y-4">
            {algorithmGroups.map((g) => (
              <div key={g.group}>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{g.group}</h4>
                <div className="space-y-2">
                  {g.models.map((m) => (
                    <label key={m} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedAlgorithms.includes(m)}
                        onChange={() => toggleAlgorithm(m)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500/50 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700" 
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <strong>{selectedAlgorithms.length}</strong> algorithms selected • <strong>{cvFolds}-fold</strong> cross validation • Metric: <strong>{metric}</strong>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleLaunchTraining}
          disabled={isLaunching || !activeDataset}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl font-medium shadow-lg shadow-brand-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <Rocket className="w-5 h-5" />
          {isLaunching ? 'Launching Training on Backend...' : 'Launch AutoML Training'}
        </button>
      </div>
    </div>
  );
}
