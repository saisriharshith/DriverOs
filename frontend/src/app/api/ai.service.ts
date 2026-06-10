import axiosInstance from './axiosConfig';

export const aiService = {
  chat: async (message: string) => {
    const response = await axiosInstance.post('ai/chat/', { message });
    return response.data;
  },
};
