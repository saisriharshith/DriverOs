import axiosInstance from './axiosConfig';

export const driverService = {
  getProfile: async () => {
    const response = await axiosInstance.get('drivers/me/');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await axiosInstance.patch('drivers/me/', data);
    return response.data;
  },
  getEmergencyContacts: async () => {
    const response = await axiosInstance.get('emergency-contacts/');
    return response.data;
  },
  addEmergencyContact: async (data: any) => {
    const response = await axiosInstance.post('emergency-contacts/', data);
    return response.data;
  },
};
