import { apiClient } from './client';

export const registryApi = {
  listModels: () => apiClient.get('/registry/models'),
  promote: (modelId: string, stage: string) => apiClient.post(`/registry/models/${modelId}/promote`, { stage }),
  archive: (modelId: string) => apiClient.post(`/registry/models/${modelId}/archive`),
};
