import axiosInstance from './axiosConfig';

export const analyticsService = {
  getDashboardStats: async () => {
    const response = await axiosInstance.get('analytics/dashboard/');
    return response.data;
  },
  getFleetSummary: async (periodDays?: number) => {
    const params = periodDays ? { days: periodDays } : {};
    const response = await axiosInstance.get('analytics/fleet/', { params });
    return response.data;
  },
  getVehiclePnL: async (vehicleId: number, periodDays?: number) => {
    const params = periodDays ? { days: periodDays } : {};
    const response = await axiosInstance.get(`analytics/vehicles/${vehicleId}/pnl/`, { params });
    return response.data;
  },
  getFuelAnalytics: async (vehicleId: number, periodDays?: number) => {
    const params = periodDays ? { days: periodDays } : {};
    const response = await axiosInstance.get(`analytics/vehicles/${vehicleId}/fuel/`, { params });
    return response.data;
  },
};
