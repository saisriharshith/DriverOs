import axiosInstance from './axiosConfig';

export const documentService = {
  getDocuments: async () => {
    const response = await axiosInstance.get('documents/');
    return response.data;
  },
  uploadDocument: async (formData: FormData) => {
    const response = await axiosInstance.post('documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deleteDocument: async (id: number) => {
    await axiosInstance.delete(`documents/${id}/`);
  },
};