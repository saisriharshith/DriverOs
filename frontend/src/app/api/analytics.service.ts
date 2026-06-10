import axiosInstance from './axiosConfig';

export const analyticsService = {
  getDashboardStats: async () => {
    const response = await axiosInstance.get('analytics/dashboard/');
    return response.data;
  },
};