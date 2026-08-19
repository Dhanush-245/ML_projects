import { apiClient } from './client';

export const datasetApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: () => apiClient.get('/datasets'),
  getById: (id: string) => apiClient.get(`/datasets/${id}`),
  preview: (id: string) => apiClient.get(`/datasets/${id}/preview`),
  profile: (id: string) => apiClient.get(`/datasets/${id}/profile`),
  quality: (id: string) => apiClient.get(`/datasets/${id}/quality`),
  clean: (id: string, config: any) => apiClient.post(`/datasets/${id}/clean`, config),
};
