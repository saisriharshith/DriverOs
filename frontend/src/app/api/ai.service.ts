import axiosInstance from './axiosConfig';

export const aiService = {
  chat: async (message: string) => {
    const response = await axiosInstance.post('ai/chat/', { message });
    return response.data;
  },
  analyzeDocument: async (image: File, docType: string) => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('doc_type', docType);
    const response = await axiosInstance.post('ocr/process-document/', formData);
    return response.data;
  },
  analyzeReceipt: async (image?: File, text?: string, vehicleId?: number) => {
    const formData = new FormData();
    if (image) formData.append('image', image);
    if (text) formData.append('text', text);
    if (vehicleId) formData.append('vehicle', vehicleId.toString());
    const response = await axiosInstance.post('ocr/process-receipt/', formData);
    return response.data;
  },
};
