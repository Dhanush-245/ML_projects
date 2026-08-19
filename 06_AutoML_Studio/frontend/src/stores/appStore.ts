import { create } from 'zustand';
import { ParsedDataset, downloadDatasetAsCSV, parseRecordData, QualityIssue } from '../utils/csvParser';
import { api } from '../utils/apiClient';

export interface UserProfile {
  id: number | string;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export interface PreprocessingConfig {
  num_imputer: 'median' | 'mean' | 'knn';
  cat_imputer: 'most_frequent' | 'constant';
  scaler: 'standard' | 'minmax' | 'robust' | 'power';
  encoder: 'onehot' | 'ordinal';
}

interface AppState {
  activeView: string;
  datasetSubTab: 'list' | 'upload' | 'preview' | 'profile' | 'quality' | 'compare' | 'preprocessing';
  theme: 'light' | 'dark';
  commandPaletteOpen: boolean;
  
  // Auth state
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  authToken: string | null;

  datasets: ParsedDataset[];
  originalDataset: ParsedDataset | null;
  activeDataset: ParsedDataset | null;
  experiments: any[];
  deployments: any[];
  notifications: any[];
  currentDatasetId: string | null;
  currentExperimentId: string | null;

  // Backend integration state
  backendDatasetMap: Record<string, number>; // client dataset ID -> backend dataset ID
  trainedModels: any[]; // real trained models from backend
  activeExperimentId: number | null; // current backend experiment ID
  backendSynced: boolean; // whether initial hydration from backend is complete
  preprocessingConfig: PreprocessingConfig;
  pipelineApplied: boolean;
  
  setActiveView: (view: string) => void;
  setDatasetSubTab: (tab: 'list' | 'upload' | 'preview' | 'profile' | 'quality' | 'compare' | 'preprocessing') => void;
  toggleTheme: () => void;
  toggleCommandPalette: () => void;
  
  // Auth actions
  loginUser: (user: UserProfile, token: string) => void;
  logoutUser: () => void;
  bypassAuth: () => void;

  setDatasets: (datasets: ParsedDataset[]) => void;
  setActiveDataset: (dataset: ParsedDataset | null) => void;
  deleteDataset: (id: string) => void;
  autoFixIssue: (issueId: string) => void;
  autoFixAllIssues: () => void;
  injectTestNoise: () => void;
  downloadCleanedDataset: () => void;
  setExperiments: (experiments: any[]) => void;
  addExperiment: (experiment: any) => void;
  setDeployments: (deployments: any[]) => void;
  addDeployment: (deployment: any) => void;
  setCurrentDatasetId: (id: string | null) => void;
  setCurrentExperimentId: (id: string | null) => void;

  // Backend sync actions
  registerBackendDatasetId: (clientId: string, backendId: number) => void;
  getBackendDatasetId: (clientId: string) => number | null;
  setActiveExperimentId: (id: number | null) => void;
  setTrainedModels: (models: any[]) => void;
  hydrateFromBackend: () => Promise<void>;
  setPreprocessingConfig: (config: Partial<PreprocessingConfig>) => void;
  setPipelineApplied: (applied: boolean) => void;
}

const savedUser = localStorage.getItem('user');
const savedToken = localStorage.getItem('token');

export const useAppStore = create<AppState>((set, get) => ({
  activeView: localStorage.getItem('activeView') || 'dashboard',
  datasetSubTab: (localStorage.getItem('datasetSubTab') as AppState['datasetSubTab']) || 'upload',
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  commandPaletteOpen: false,

  isAuthenticated: !!savedToken,
  currentUser: savedUser ? JSON.parse(savedUser) : null,
  authToken: savedToken || null,

  datasets: [],
  originalDataset: null,
  activeDataset: null,
  experiments: [],
  deployments: [],
  notifications: [],
  currentDatasetId: null,
  currentExperimentId: null,

  // Backend integration initial state
  backendDatasetMap: JSON.parse(localStorage.getItem('backendDatasetMap') || '{}'),
  trainedModels: [],
  activeExperimentId: null,
  backendSynced: false,
  preprocessingConfig: JSON.parse(localStorage.getItem('preprocessingConfig') || '{"num_imputer":"median","cat_imputer":"most_frequent","scaler":"standard","encoder":"onehot"}'),
  pipelineApplied: localStorage.getItem('pipelineApplied') === 'true',
  
  setActiveView: (view) => { localStorage.setItem('activeView', view); set({ activeView: view }); },
  setDatasetSubTab: (tab) => { localStorage.setItem('datasetSubTab', tab); set({ datasetSubTab: tab }); },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  loginUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({
      isAuthenticated: true,
      currentUser: user,
      authToken: token,
    });
  },

  logoutUser: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({
      isAuthenticated: false,
      currentUser: null,
      authToken: null,
      activeView: 'dashboard',
    });
  },

  bypassAuth: () => {
    const demoUser = {
      id: 1,
      username: 'dhanush',
      email: 'dhanush@automlstudio.ai',
      full_name: 'Lingareddy Dhanushkumar',
      role: 'Admin',
    };
    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('token', 'demo_token_123');
    set({
      isAuthenticated: true,
      currentUser: demoUser,
      authToken: 'demo_token_123',
    });
  },

  setDatasets: (datasets) => set({ datasets }),
  setActiveDataset: (dataset) => set((state) => {
    if (!dataset) {
      localStorage.setItem('datasetSubTab', 'upload');
      return {
        activeDataset: null,
        originalDataset: null,
        currentDatasetId: null,
        datasetSubTab: 'upload',
      };
    }
    const exists = state.datasets.some((d) => d.id === dataset.id);
    const updatedDatasets = exists ? state.datasets : [dataset, ...state.datasets];
    const backendId = dataset.backendId ?? state.backendDatasetMap[dataset.id];
    if (backendId) localStorage.setItem('activeBackendDatasetId', String(backendId));
    localStorage.setItem('datasetSubTab', 'preview');
    return {
      datasets: updatedDatasets,
      originalDataset: JSON.parse(JSON.stringify(dataset)),
      activeDataset: dataset,
      currentDatasetId: dataset.id,
      datasetSubTab: 'preview',
    };
  }),
  deleteDataset: (id: string) => set((state) => {
    const remaining = state.datasets.filter((d) => d.id !== id);
    const isDeletingActive = state.activeDataset?.id === id;
    const nextActive = isDeletingActive ? (remaining.length > 0 ? remaining[0] : null) : state.activeDataset;

    return {
      datasets: remaining,
      activeDataset: nextActive,
      originalDataset: nextActive ? JSON.parse(JSON.stringify(nextActive)) : null,
      currentDatasetId: nextActive ? nextActive.id : null,
      datasetSubTab: remaining.length === 0 ? 'upload' : state.datasetSubTab,
    };
  }),
  autoFixIssue: (issueId) => set((state) => {
    if (!state.activeDataset) return state;

    const issue = state.activeDataset.qualityIssues.find((i) => i.id === issueId);
    if (!issue) return state;

    let newData = [...state.activeDataset.data];
    let newColumns = [...state.activeDataset.columns];

    if (issue.type === 'duplicate') {
      const seen = new Set<string>();
      newData = newData.filter((row) => {
        const str = JSON.stringify(row);
        if (seen.has(str)) return false;
        seen.add(str);
        return true;
      });
    } else if (issue.type === 'missing') {
      const col = issue.column;
      const colMeta = newColumns.find((c) => c.key === col);
      const isNumeric = colMeta?.type === 'numeric';

      let meanVal = 0;
      if (isNumeric) {
        const validVals = newData.map((r) => r[col]).filter((v) => typeof v === 'number' && !isNaN(v));
        if (validVals.length > 0) {
          meanVal = Math.round((validVals.reduce((a, b) => a + b, 0) / validVals.length) * 100) / 100;
        }
      }

      newData = newData.map((row) => {
        const copy = { ...row };
        if (copy[col] === null || copy[col] === undefined) {
          copy[col] = isNumeric ? meanVal : 'Filled_Value';
        }
        return copy;
      });
      if (colMeta) colMeta.missingCount = 0;
    } else if (issue.type === 'outlier') {
      const col = issue.column;
      const stats = state.activeDataset.summaryStats.find((s) => s.column === col);
      if (stats && typeof stats.mean === 'number' && typeof stats.std === 'number') {
        const upper = stats.mean + 2 * stats.std;
        const lower = Math.max(0, stats.mean - 2 * stats.std);
        newData = newData.map((row) => {
          const copy = { ...row };
          if (typeof copy[col] === 'number') {
            if (copy[col] > upper) copy[col] = Math.round(upper * 100) / 100;
            if (copy[col] < lower) copy[col] = Math.round(lower * 100) / 100;
          }
          return copy;
        });
      }
    } else if (issue.type === 'constant') {
      const col = issue.column;
      newData = newData.map((row) => {
        const copy = { ...row };
        delete copy[col];
        return copy;
      });
      newColumns = newColumns.filter((c) => c.key !== col);
    }

    const remainingIssues = state.activeDataset.qualityIssues.filter((i) => i.id !== issueId);
    const updatedScore = remainingIssues.length === 0 ? 100 : Math.min(98, state.activeDataset.qualityScore + 20);

    const updatedDataset: ParsedDataset = {
      ...state.activeDataset,
      rows: newData.length,
      columns: newColumns,
      data: newData,
      qualityIssues: remainingIssues,
      qualityScore: updatedScore,
      missingValuesCount: remainingIssues.filter((i) => i.type === 'missing').length * 5,
      duplicateRowsCount: remainingIssues.some((i) => i.type === 'duplicate') ? state.activeDataset.duplicateRowsCount : 0,
    };

    return {
      activeDataset: updatedDataset,
      datasets: state.datasets.map((d) => (d.id === updatedDataset.id ? updatedDataset : d)),
    };
  }),
  autoFixAllIssues: () => set((state) => {
    if (!state.activeDataset) return state;

    let newData = [...state.activeDataset.data];
    let newColumns = [...state.activeDataset.columns];

    const seen = new Set<string>();
    newData = newData.filter((row) => {
      const str = JSON.stringify(row);
      if (seen.has(str)) return false;
      seen.add(str);
      return true;
    });

    newColumns.forEach((colMeta) => {
      const col = colMeta.key;
      const isNumeric = colMeta.type === 'numeric';
      let meanVal = 0;
      if (isNumeric) {
        const validVals = newData.map((r) => r[col]).filter((v) => typeof v === 'number' && !isNaN(v));
        if (validVals.length > 0) {
          meanVal = Math.round((validVals.reduce((a, b) => a + b, 0) / validVals.length) * 100) / 100;
        }
      }
      newData = newData.map((row) => {
        const copy = { ...row };
        if (copy[col] === null || copy[col] === undefined) {
          copy[col] = isNumeric ? meanVal : 'Filled_Value';
        }
        return copy;
      });
      colMeta.missingCount = 0;
    });

    const cleanedDataset: ParsedDataset = {
      ...state.activeDataset,
      rows: newData.length,
      columns: newColumns,
      data: newData,
      qualityIssues: [],
      qualityScore: 100,
      missingValuesCount: 0,
      duplicateRowsCount: 0,
    };

    return {
      activeDataset: cleanedDataset,
      datasetSubTab: 'compare',
    };
  }),
  injectTestNoise: () => set((state) => {
    if (!state.activeDataset) return state;

    const targetColMeta = state.activeDataset.columns.find((c) => c.type === 'numeric') || state.activeDataset.columns[0];
    const targetCol = targetColMeta.key;

    let missingInjected = 0;
    const noisyData = state.activeDataset.data.map((row, idx) => {
      const copy = { ...row };
      if (idx % 12 === 0) {
        copy[targetCol] = null;
        missingInjected++;
      }
      return copy;
    });

    const duplicatesToAppend = noisyData.slice(0, 45).map((r) => ({ ...r }));
    const finalNoisyData = [...noisyData, ...duplicatesToAppend];

    const injectedIssues: QualityIssue[] = [
      {
        id: `missing-${targetCol}`,
        column: targetCol,
        type: 'missing',
        title: `Missing Values in "${targetCol}"`,
        desc: `${missingInjected} rows (${((missingInjected / finalNoisyData.length) * 100).toFixed(1)}%) have missing values.`,
        severity: 'high',
      },
      {
        id: 'duplicate-rows',
        column: 'Dataset',
        type: 'duplicate',
        title: `Duplicate Rows Detected`,
        desc: `Found ${duplicatesToAppend.length} duplicate rows (${((duplicatesToAppend.length / finalNoisyData.length) * 100).toFixed(1)}%).`,
        severity: 'medium',
      },
    ];

    const noisyDataset: ParsedDataset = {
      ...state.activeDataset,
      rows: finalNoisyData.length,
      data: finalNoisyData,
      missingValuesCount: missingInjected,
      duplicateRowsCount: duplicatesToAppend.length,
      qualityScore: 76,
      qualityIssues: injectedIssues,
    };

    return {
      originalDataset: JSON.parse(JSON.stringify(noisyDataset)),
      activeDataset: noisyDataset,
      datasetSubTab: 'quality',
    };
  }),
  downloadCleanedDataset: () => {
    const { activeDataset } = get();
    if (activeDataset) {
      downloadDatasetAsCSV(activeDataset, '_cleaned.csv');
    }
  },
  setExperiments: (experiments) => set({ experiments }),
  addExperiment: (exp) => set((state) => ({ experiments: [exp, ...state.experiments] })),
  setDeployments: (deployments) => set({ deployments }),
  addDeployment: (dep) => set((state) => ({ deployments: [dep, ...state.deployments] })),
  setCurrentDatasetId: (id) => set({ currentDatasetId: id }),
  setCurrentExperimentId: (id) => set({ currentExperimentId: id }),

  // Backend sync actions
  registerBackendDatasetId: (clientId, backendId) => {
    const updated = { ...get().backendDatasetMap, [clientId]: backendId };
    localStorage.setItem('backendDatasetMap', JSON.stringify(updated));
    set({ backendDatasetMap: updated });
  },

  getBackendDatasetId: (clientId) => {
    return get().backendDatasetMap[clientId] ?? null;
  },

  setActiveExperimentId: (id) => set({ activeExperimentId: id }),
  setTrainedModels: (models) => set({ trainedModels: models }),
  setPreprocessingConfig: (config) => set((state) => {
    const next = { ...state.preprocessingConfig, ...config };
    localStorage.setItem('preprocessingConfig', JSON.stringify(next));
    localStorage.setItem('pipelineApplied', 'false');
    return { preprocessingConfig: next, pipelineApplied: false };
  }),
  setPipelineApplied: (applied) => {
    localStorage.setItem('pipelineApplied', String(applied));
    set({ pipelineApplied: applied });
  },

  hydrateFromBackend: async () => {
    try {
      const [experiments, deployments, backendDatasets] = await Promise.all([
        api.get('/training/experiments').catch(() => []),
        api.get('/deployment/').catch(() => []),
        api.get('/datasets/').catch(() => []),
      ]);

      const formattedDatasets = (await Promise.all((Array.isArray(backendDatasets) ? backendDatasets : []).map(async (record: any) => {
        try {
          const rows = await api.get(`/datasets/${record.id}/preview?page_size=${Math.min(record.rows || 10000, 100000)}`);
          const parsed = parseRecordData(rows, record.name || record.filename || `Dataset ${record.id}`);
          return { ...parsed, id: `backend-${record.id}`, backendId: record.id, createdAt: record.created_at };
        } catch (error) {
          console.warn(`[AutoML Studio] Dataset ${record.id} could not be restored:`, error);
          return null;
        }
      }))).filter(Boolean).sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) as ParsedDataset[];

      const restoredMap = Object.fromEntries(formattedDatasets.map((dataset) => [dataset.id, dataset.backendId as number]));
      localStorage.setItem('backendDatasetMap', JSON.stringify(restoredMap));
      const preferredBackendId = Number(localStorage.getItem('activeBackendDatasetId'));
      const restoredActive = formattedDatasets.find((dataset) => dataset.backendId === preferredBackendId) || formattedDatasets[0] || null;

      const leaderboards = await Promise.all((Array.isArray(experiments) ? experiments : []).map((exp: any) =>
        exp.status === 'completed' ? api.get(`/training/experiments/${exp.id}/leaderboard`).catch(() => []) : Promise.resolve([])
      ));

      const formattedExperiments = (Array.isArray(experiments) ? experiments : []).map((exp: any, index: number) => {
        const bestModel = Array.isArray(leaderboards[index]) ? leaderboards[index][0] : null;
        return {
        id: `exp-${exp.id}`,
        backendId: exp.id,
        name: exp.name || `Experiment ${exp.id}`,
        algorithm: bestModel?.algorithm || 'AutoML',
        accuracy: Number(bestModel?.metrics?.accuracy ?? bestModel?.metrics?.r2 ?? 0),
        status: exp.status,
        timestamp: exp.created_at,
      }; }).sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

      const formattedDeployments = (Array.isArray(deployments) ? deployments : []).map((dep: any) => ({
        id: `dep-${dep.id}`,
        backendId: dep.id,
        name: dep.name || `Deployment ${dep.id}`,
        url: dep.endpoint_url,
        status: dep.status,
        modelId: dep.model_id,
        timestamp: dep.created_at,
      })).sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

      set({
        datasets: formattedDatasets,
        activeDataset: restoredActive,
        originalDataset: restoredActive ? JSON.parse(JSON.stringify(restoredActive)) : null,
        currentDatasetId: restoredActive?.id || null,
        backendDatasetMap: restoredMap,
        experiments: formattedExperiments,
        deployments: formattedDeployments,
        backendSynced: true,
      });

      console.log('[AutoML Studio] Backend hydration complete:', {
        experiments: formattedExperiments.length,
        deployments: formattedDeployments.length,
        datasets: formattedDatasets.length,
      });
    } catch (err) {
      console.warn('[AutoML Studio] Backend hydration failed (backend may be offline):', err);
      set({ backendSynced: true }); // Mark synced even if backend is offline
    }
  },
}));
