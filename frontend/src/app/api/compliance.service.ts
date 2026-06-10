import axiosInstance from './axiosConfig';

export const complianceService = {
  getComplianceScore: async () => {
    const response = await axiosInstance.get('compliance/');
    return response.data;
  },
};