import { apiClient } from './client';

export const explainabilityApi = {
  shap: (modelId: string, datasetId: string) => apiClient.post(`/explain/shap`, { modelId, datasetId }),
  lime: (modelId: string, instanceId: string) => apiClient.post(`/explain/lime`, { modelId, instanceId }),
  pdp: (modelId: string, feature: string) => apiClient.post(`/explain/pdp`, { modelId, feature }),
  counterfactual: (modelId: string, instanceId: string, target: any) => apiClient.post(`/explain/counterfactual`, { modelId, instanceId, target }),
};
