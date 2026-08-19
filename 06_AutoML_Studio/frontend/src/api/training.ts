import { apiClient } from './client';

export const trainingApi = {
  runAutoML: (config: any) => apiClient.post('/training/automl', config),
  getExperiments: () => apiClient.get('/training/experiments'),
  getLeaderboard: (experimentId: string) => apiClient.get(`/training/experiments/${experimentId}/leaderboard`),
  getEvaluation: (modelId: string) => apiClient.get(`/training/models/${modelId}/evaluation`),
};
