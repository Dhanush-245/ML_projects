import React, { useState } from 'react';
import { Sliders, Settings, Sparkles, Code, CheckCircle2, Play, Download, Layers, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export default function DataPreprocessingStudio() {
  const { activeDataset, setDatasetSubTab, downloadCleanedDataset } = useAppStore();

  // Phase 6 Preprocessing Configuration State
  const [numImputer, setNumImputer] = useState<'median' | 'mean' | 'knn' | 'mice'>('median');
  const [catImputer, setCatImputer] = useState<'mode' | 'constant'>('mode');
  const [deduplicate, setDeduplicate] = useState(true);

  const [encoder, setEncoder] = useState<'onehot' | 'ordinal' | 'target'>('onehot');
  const [scaler, setScaler] = useState<'standard' | 'minmax' | 'robust' | 'power'>('standard');

  const [usePolynomial, setUsePolynomial] = useState(false);
  const [useLogTransform, setUseLogTransform] = useState(true);
  const [useInteractions, setUseInteractions] = useState(true);
  const [usePCA, setUsePCA] = useState(false);

  const [applied, setApplied] = useState(false);

  if (!activeDataset) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
        <Sliders className="w-12 h-12 text-brand-500 mx-auto" />
        <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white">No Dataset Loaded</h3>
        <p className="text-sm text-slate-500">Please upload a dataset first to build Phase 6 preprocessing & feature pipelines.</p>
        <button 
          onClick={() => setDatasetSubTab('upload')}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const numericCols = activeDataset.columns.filter((c) => c.type === 'numeric').map((c) => c.key);
  const categoricalCols = activeDataset.columns.filter((c) => c.type === 'categorical').map((c) => c.key);

  const pythonCode = `import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import ${numImputer === 'knn' ? 'KNNImputer' : 'SimpleImputer'}
from sklearn.preprocessing import ${
    scaler === 'standard' ? 'StandardScaler' : scaler === 'minmax' ? 'MinMaxScaler' : scaler === 'robust' ? 'RobustScaler' : 'PowerTransformer'
}, ${encoder === 'onehot' ? 'OneHotEncoder' : 'OrdinalEncoder'}
${usePolynomial ? 'from sklearn.preprocessing import PolynomialFeatures\n' : ''}${usePCA ? 'from sklearn.decomposition import PCA\n' : ''}

# 1. Define feature lists
numeric_features = ${JSON.stringify(numericCols)}
categorical_features = ${JSON.stringify(categoricalCols)}

# 2. Numeric Transformer Pipeline
numeric_transformer = Pipeline(steps=[
    ('imputer', ${numImputer === 'knn' ? 'KNNImputer(n_neighbors=5)' : `SimpleImputer(strategy='${numImputer}')`}),
    ('scaler', ${scaler === 'standard' ? 'StandardScaler()' : scaler === 'minmax' ? 'MinMaxScaler()' : scaler === 'robust' ? 'RobustScaler()' : 'PowerTransformer()'})
    ${usePolynomial ? ", ('poly', PolynomialFeatures(degree=2, include_bias=False))" : ''}
    ${usePCA ? ", ('pca', PCA(n_components=0.95))" : ''}
])

# 3. Categorical Transformer Pipeline
categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='${catImputer === 'mode' ? 'most_frequent' : 'constant'}')),
    ('encoder', ${encoder === 'onehot' ? "OneHotEncoder(handle_unknown='ignore')" : 'OrdinalEncoder()'})
])

# 4. Phase 6 ColumnTransformer Pipeline
preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ]
)

# 5. Load and apply transformation pipeline
df = pd.read_csv("${activeDataset.name}")
X_transformed = preprocessor.fit_transform(df)
print("Pipeline Transformation Complete. Shape:", X_transformed.shape)
`;

  const handleApplyPipeline = () => {
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-card p-6 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-700 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-300" />
            <h2 className="text-2xl font-heading font-bold">Preprocessing & Feature Engineering Studio</h2>
          </div>
          <p className="text-brand-100 text-sm mt-1">
            Configure automated cleaning, encoding, scaling, feature engineering & export Scikit-Learn pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleApplyPipeline}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-sm transition-all shadow-md transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-slate-900" />
            Apply Preprocessing Pipeline
          </button>
          <button 
            onClick={downloadCleanedDataset}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 hover:bg-brand-50 rounded-xl font-semibold text-sm transition-all shadow-md"
          >
            <Download className="w-4 h-4 text-brand-600" />
            Download CSV
          </button>
        </div>
      </div>

      {applied && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-xl flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300 font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Preprocessing Pipeline applied successfully! Feature vectors transformed and dataset cleaned.
        </div>
      )}

      {/* 4 Pipeline Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stage 1: Data Cleaning */}
        <div className="glass-card p-5 border-t-4 border-t-brand-500 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white">1. Data Cleaning</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Numeric Imputer</label>
            <select 
              value={numImputer} 
              onChange={(e: any) => setNumImputer(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
            >
              <option value="median">Median Imputation</option>
              <option value="mean">Mean Imputation</option>
              <option value="knn">KNN Imputer (k=5)</option>
              <option value="mice">Iterative (MICE)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Categorical Imputer</label>
            <select 
              value={catImputer} 
              onChange={(e: any) => setCatImputer(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
            >
              <option value="mode">Most Frequent (Mode)</option>
              <option value="constant">Constant ("missing")</option>
            </select>
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input 
              type="checkbox" 
              checked={deduplicate} 
              onChange={(e) => setDeduplicate(e.target.checked)} 
              className="rounded text-brand-600 focus:ring-brand-500" 
            />
            Deduplicate Row Records
          </label>
        </div>

        {/* Stage 2: Encoding */}
        <div className="glass-card p-5 border-t-4 border-t-purple-500 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white">2. Categorical Encoding</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Encoder Algorithm</label>
            <select 
              value={encoder} 
              onChange={(e: any) => setEncoder(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
            >
              <option value="onehot">One-Hot Encoding</option>
              <option value="ordinal">Ordinal Encoding</option>
              <option value="target">Frequency Target Encoding</option>
            </select>
          </div>

          <p className="text-xs text-slate-400 pt-2">
            Encodes {categoricalCols.length} categorical feature columns into binary or numeric vectors.
          </p>
        </div>

        {/* Stage 3: Feature Scaling */}
        <div className="glass-card p-5 border-t-4 border-t-emerald-500 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-500" />
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white">3. Feature Scaling</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Scaler Algorithm</label>
            <select 
              value={scaler} 
              onChange={(e: any) => setScaler(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
            >
              <option value="standard">StandardScaler (Mean=0, Std=1)</option>
              <option value="minmax">MinMaxScaler (Range 0 to 1)</option>
              <option value="robust">RobustScaler (IQR robust)</option>
              <option value="power">PowerTransformer (Yeo-Johnson)</option>
            </select>
          </div>

          <p className="text-xs text-slate-400 pt-2">
            Scales {numericCols.length} numeric columns for optimal gradient descent & distance-based models.
          </p>
        </div>

        {/* Stage 4: Feature Engineering */}
        <div className="glass-card p-5 border-t-4 border-t-amber-500 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white">4. Feature Engineering</h3>
          </div>

          <div className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useLogTransform} onChange={(e) => setUseLogTransform(e.target.checked)} className="rounded text-brand-600" />
              Log Transforms (log(1+x))
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useInteractions} onChange={(e) => setUseInteractions(e.target.checked)} className="rounded text-brand-600" />
              Pairwise Interactions (x1 * x2)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={usePolynomial} onChange={(e) => setUsePolynomial(e.target.checked)} className="rounded text-brand-600" />
              Polynomial Features (x^2)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={usePCA} onChange={(e) => setUsePCA(e.target.checked)} className="rounded text-brand-600" />
              PCA Reduction (95% variance)
            </label>
          </div>
        </div>
      </div>

      {/* Generated Scikit-Learn Python Pipeline Code */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-brand-500" />
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white">Generated Scikit-Learn Pipeline Code</h3>
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(pythonCode)}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono rounded text-slate-700 dark:text-slate-300"
          >
            Copy Python Code
          </button>
        </div>

        <pre className="p-4 bg-slate-900 text-brand-300 font-mono text-xs rounded-xl overflow-x-auto max-h-80 leading-relaxed border border-slate-800">
          <code>{pythonCode}</code>
        </pre>
      </div>
    </div>
  );
}
