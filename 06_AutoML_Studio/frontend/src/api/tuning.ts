import { apiClient } from './client';

export const tuningApi = {
  runTuning: (modelId: string, config: any) => apiClient.post(`/tuning/models/${modelId}`, config),
  getResults: (tuningId: string) => apiClient.get(`/tuning/${tuningId}/results`),
};
