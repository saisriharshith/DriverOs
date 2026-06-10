import axiosInstance from './axiosConfig';

export const vehicleService = {
  getVehicles: async () => {
    const response = await axiosInstance.get('vehicles/');
    return response.data;
  },
  addVehicle: async (data: any) => {
    const response = await axiosInstance.post('vehicles/', data);
    return response.data;
  },
  updateVehicle: async (id: number, data: any) => {
    const response = await axiosInstance.patch(`vehicles/${id}/`, data);
    return response.data;
  },
  deleteVehicle: async (id: number) => {
    await axiosInstance.delete(`vehicles/${id}/`);
  },
};