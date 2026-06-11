import axiosInstance from './axiosConfig';

export const maintenanceService = {
  getRecords: async (params?: { vehicle?: number }) => {
    const response = await axiosInstance.get('maintenance/records/', { params });
    return response.data;
  },
  addRecord: async (data: any) => {
    const response = await axiosInstance.post('maintenance/records/', data);
    return response.data;
  },
  getSchedules: async () => {
    const response = await axiosInstance.get('maintenance/schedules/');
    return response.data;
  },
  getDueMaintenance: async () => {
    const response = await axiosInstance.get('maintenance/schedules/due/');
    return response.data;
  },
};
