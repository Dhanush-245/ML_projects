import { apiClient } from './client';

export const deploymentApi = {
  deploy: (modelId: string, config: any) => apiClient.post(`/deployments`, { modelId, ...config }),
  predict: (deploymentId: string, data: any) => apiClient.post(`/deployments/${deploymentId}/predict`, data),
  listDeployments: () => apiClient.get('/deployments'),
};
