import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../../stores/appStore';
import { AlertCircle, Activity, BarChart2, Target, CheckCircle2 } from 'lucide-react';

export default function DataProfile() {
  const { activeDataset, setDatasetSubTab } = useAppStore();
  const numericCols = activeDataset?.columns.filter((c) => c.type === 'numeric').map((c) => c.key) || [];
  const categoricalCols = activeDataset?.columns.filter((c) => c.type === 'categorical').map((c) => c.key) || [];
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [targetCol, setTargetCol] = useState<string>('');

  useEffect(() => {
    if (!activeDataset) return;
    setSelectedCol((current) => activeDataset.columns.some((column) => column.key === current)
      ? current : numericCols[0] || activeDataset.columns[0]?.key || '');
    setTargetCol((current) => activeDataset.columns.some((column) => column.key === current)
      ? current : activeDataset.columns[activeDataset.columns.length - 1]?.key || '');
  }, [activeDataset?.id]);

  if (!activeDataset) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white">No Dataset Uploaded</h3>
        <p className="text-sm text-slate-500">Please upload a dataset first to view column statistics, correlations, and target analysis.</p>
        <button 
          onClick={() => setDatasetSubTab('upload')}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const distBuckets = activeDataset.numericColStats[selectedCol]?.buckets || [];
  const selectedColumnType = activeDataset.columns.find((column) => column.key === selectedCol)?.type;

  const totalCells = activeDataset.rows * activeDataset.columns.length;
  const missingPct = totalCells > 0 ? ((activeDataset.missingValuesCount / totalCells) * 100).toFixed(1) : '0';

  // Target variable values distribution
  const targetMeta = activeDataset.columns.find((column) => column.key === targetCol);
  const targetValuesMap: Record<string, number> = {};
  if (targetCol && targetMeta?.type !== 'numeric') {
    activeDataset.data.forEach((row) => {
      const val = String(row[targetCol] ?? 'Missing');
      targetValuesMap[val] = (targetValuesMap[val] || 0) + 1;
    });
  }
  const targetDist = targetMeta?.type === 'numeric'
    ? activeDataset.numericColStats[targetCol]?.buckets || []
    : Object.entries(targetValuesMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })).slice(0, 12);

  const matrixColumns = activeDataset.columns.filter((column) => column.type === 'numeric').slice(0, 8);

  // Target correlations with all other features (Numeric AND Categorical targets supported)
  const targetCorrelations = activeDataset.columns
    .filter((col) => col.key !== targetCol && activeDataset.correlations[targetCol]?.[col.key] !== undefined)
    .map((col) => ({
      feature: col.key,
      type: col.type,
      corr: activeDataset.correlations[targetCol][col.key],
      absCorr: Math.abs(activeDataset.correlations[targetCol][col.key]),
    }))
    .sort((a, b) => b.absCorr - a.absCorr);

  return (
    <div className="space-y-8">
      {/* 4 Summary Stat Badges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Rows', val: activeDataset.rows.toLocaleString(), sub: 'Observations' },
          { label: 'Missing Values', val: `${missingPct}%`, sub: activeDataset.missingValuesCount === 0 ? 'Clean (0 nulls)' : `${activeDataset.missingValuesCount} null cells`, alert: Number(missingPct) > 5 },
          { label: 'Duplicate Rows', val: activeDataset.duplicateRowsCount.toString(), sub: activeDataset.duplicateRowsCount > 0 ? 'Requires deduplication' : 'Clean (0 duplicates)', alert: activeDataset.duplicateRowsCount > 0 },
          { label: 'Numeric / Categorical', val: `${numericCols.length} / ${categoricalCols.length}`, sub: 'Column data types' }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 border-l-4 border-l-brand-500">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <h4 className={`text-2xl font-bold mt-1 ${stat.alert ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>{stat.val}</h4>
            <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Target Variable Analysis Section */}
      <div className="glass-card p-6 border-l-4 border-l-violet-500 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-500" />
            <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white">Target Variable Analysis</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Select Target:</span>
            <select 
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-semibold text-brand-600 dark:text-brand-300 focus:outline-none"
            >
              {activeDataset.columns.map((c) => (
                <option key={c.key} value={c.key}>{c.key} ({c.type})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Target Distribution Chart */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Target Distribution ("{targetCol}")</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={targetDist}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Correlation / Association with Target */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Feature Association / Correlation with Target ("{targetCol}")
            </h4>
            {targetCorrelations.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No correlations calculated for selected target.</p>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2">
                {targetCorrelations.map((tc) => (
                  <div key={tc.feature} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{tc.feature}</span>
                      <span className="text-[10px] px-1 py-0.5 rounded font-mono bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 uppercase">
                        {tc.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-28 bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full ${tc.corr >= 0 ? 'bg-indigo-500' : 'bg-rose-500'}`} 
                          style={{ width: `${Math.min(100, Math.max(8, tc.absCorr * 100))}%` }} 
                        />
                      </div>
                      <span className={`font-mono font-bold w-12 text-right ${tc.corr >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
                        {tc.corr > 0 ? `+${tc.corr}` : tc.corr}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Correlation Matrix Heatmap & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pearson Correlation Heatmap */}
        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-500" />
            Feature Correlation Matrix
          </h3>
          <p className="text-xs text-slate-500 mb-4">Pearson correlation across numeric features using rows where both values are present.</p>

          {matrixColumns.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">At least one numeric column is required for Pearson correlation.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr>
                    <th className="p-2 text-left font-sans text-slate-400">Column</th>
                    {matrixColumns.map((c) => (
                      <th key={c.key} className="p-2 text-slate-600 dark:text-slate-300 truncate max-w-[60px]">{c.key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixColumns.map((rCol) => (
                    <tr key={rCol.key}>
                      <td className="p-2 font-sans font-medium text-left text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{rCol.key}</td>
                      {matrixColumns.map((cCol) => {
                        const val = activeDataset.correlations[rCol.key]?.[cCol.key] ?? 0;
                        const bgColor = rCol.key === cCol.key ? 'bg-slate-200 dark:bg-slate-800' :
                          val > 0.5 ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold' :
                          val < -0.5 ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold' : 'bg-slate-50 dark:bg-slate-900/50';
                        return (
                          <td key={cCol.key} className={`p-2 rounded font-semibold ${bgColor}`}>
                            {val > 0 ? `+${val}` : val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Feature Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              Column Distribution
            </h3>
            {activeDataset.columns.length > 0 && (
              <select 
                value={selectedCol}
                onChange={(e) => setSelectedCol(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
              >
                {activeDataset.columns.map((column) => (
                  <option key={column.key} value={column.key}>{column.key} ({column.type})</option>
                ))}
              </select>
            )}
          </div>

          <div className="h-60">
            <p className="text-xs text-slate-500 mb-2">{selectedColumnType === 'numeric' ? 'Histogram buckets' : 'Most frequent values'}</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distBuckets}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Outlier & Missing Values Detailed Table */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-lg mb-4">Outliers & Missing Values Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Column</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Missing Cells</th>
                <th className="px-4 py-3">Outliers Count</th>
                <th className="px-4 py-3">1.5x IQR Bounds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeDataset.columns.map((col) => {
                const o = activeDataset.outlierStats[col.key];
                return (
                  <tr key={col.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium font-mono text-slate-900 dark:text-slate-100">{col.label}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                        {col.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-mono ${col.missingCount > 0 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                      {col.missingCount} ({((col.missingCount / activeDataset.rows) * 100).toFixed(1)}%)
                    </td>
                    <td className={`px-4 py-3 font-mono ${o && o.count > 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                      {o ? `${o.count} (${o.pct}%)` : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {o ? `[${o.lowerBound}, ${o.upperBound}]` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
