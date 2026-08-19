import React from 'react';
import { AlertTriangle, Info, Check, Wrench, AlertCircle, Sparkles, Download, ArrowRight, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export default function DataQuality() {
  const { activeDataset, autoFixIssue, autoFixAllIssues, injectTestNoise, downloadCleanedDataset, setDatasetSubTab } = useAppStore();

  if (!activeDataset) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white">No Dataset Uploaded</h3>
        <p className="text-sm text-slate-500">Please upload a dataset first to audit data quality and auto-fix issues.</p>
        <button 
          onClick={() => setDatasetSubTab('upload')}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const score = activeDataset.qualityScore;
  const strokeDashoffset = Math.round(440 - (440 * score) / 100);
  const scoreColor = score >= 85 ? 'stroke-emerald-500' : score >= 65 ? 'stroke-amber-500' : 'stroke-rose-500';
  const outlierCount = Object.values(activeDataset.outlierStats).reduce((total, item) => total + item.count, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-brand-500" />
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white block">Data Quality Audit & Preprocessing Engine</span>
            <span className="text-xs text-slate-500">
              {activeDataset.qualityIssues.length === 0 
                ? `Uploaded file "${activeDataset.name}" is 100% clean (0 missing values, 0 duplicate rows).` 
                : `Audited ${activeDataset.qualityIssues.length} issue(s) in "${activeDataset.name}".`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeDataset.qualityIssues.length > 0 ? (
            <button 
              onClick={autoFixAllIssues}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Wrench className="w-4 h-4 text-amber-300" />
              Auto-Clean All Issues
            </button>
          ) : (
            <button 
              onClick={injectTestNoise}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/30 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
              title="Inject test missing values and duplicates to demonstrate auto-cleaning on clean datasets"
            >
              <RefreshCw className="w-4 h-4 text-amber-500" />
              Simulate Test Missing Values & Duplicates
            </button>
          )}

          <button 
            onClick={downloadCleanedDataset}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Download Cleaned CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4"><span className="text-xs text-slate-500">Missing cells</span><strong className="block text-xl text-amber-500">{activeDataset.missingValuesCount}</strong></div>
        <div className="glass-card p-4"><span className="text-xs text-slate-500">Duplicate rows</span><strong className="block text-xl text-rose-500">{activeDataset.duplicateRowsCount}</strong></div>
        <div className="glass-card p-4"><span className="text-xs text-slate-500">IQR outliers</span><strong className="block text-xl text-violet-500">{outlierCount}</strong></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="glass-card p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="12" fill="none" />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  className={`${scoreColor} transition-all duration-700 ease-out`} 
                  strokeWidth="12" 
                  fill="none" 
                  strokeDasharray="440" 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-heading font-bold text-slate-900 dark:text-white">{score}</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Quality Score</span>
              </div>
            </div>
            <h3 className="font-heading font-semibold text-xl mt-6">
              {score >= 85 ? 'Excellent Quality' : score >= 65 ? 'Fair Quality' : 'Needs Preprocessing'}
            </h3>
            <p className="text-sm text-slate-500 mt-2 text-balance">
              {activeDataset.qualityIssues.length === 0 
                ? 'All dataset quality checks passed! 0 null cells & 0 duplicate records.' 
                : `${activeDataset.qualityIssues.length} quality issue(s) detected across columns.`}
            </p>

            {activeDataset.qualityIssues.length === 0 && (
              <button 
                onClick={() => setDatasetSubTab('compare')}
                className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                View Before & After Comparison <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-heading font-semibold text-lg">Detected Quality Issues & 1-Click Auto-Fix</h3>
          
          {activeDataset.qualityIssues.length === 0 ? (
            <div className="glass-card p-8 text-center space-y-4">
              <Check className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-heading font-semibold text-lg text-slate-900 dark:text-white">Dataset Clean & Verified</h4>
              <p className="text-sm text-slate-500">
                Audit complete: No missing values, constant columns, duplicate rows, or severe outliers remaining.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button 
                  onClick={injectTestNoise}
                  className="px-4 py-2 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg text-xs font-semibold border border-amber-200 dark:border-amber-800 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Simulate Test Missing Values & Duplicates
                </button>
                <button 
                  onClick={() => setDatasetSubTab('compare')}
                  className="px-4 py-2 bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300 rounded-lg text-xs font-semibold border border-brand-200 dark:border-brand-800"
                >
                  View Before vs After Preprocessing
                </button>
                <button 
                  onClick={downloadCleanedDataset}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download Cleaned CSV
                </button>
              </div>
            </div>
          ) : (
            activeDataset.qualityIssues.map((issue) => (
              <div key={issue.id} className="glass-card p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    issue.severity === 'high' ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' : 'bg-amber-50 text-amber-500 dark:bg-amber-900/20'
                  } shrink-0`}>
                    {issue.severity === 'high' ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{issue.title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{issue.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => autoFixIssue(issue.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50 text-sm font-medium rounded-lg transition-colors border border-brand-200 dark:border-brand-800 shrink-0"
                >
                  <Wrench className="w-4 h-4" />
                  Auto-Fix
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
