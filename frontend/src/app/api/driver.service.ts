import axiosInstance from './axiosConfig';

export const driverService = {
  getProfile: async () => {
    const response = await axiosInstance.get('drivers/');
    const data = response.data;
    return Array.isArray(data) ? data[0] : data;
  },
  updateProfile: async (data: any) => {
    const profile = await driverService.getProfile();
    const id = profile?.id;
    if (id) {
      const response = await axiosInstance.patch(`drivers/${id}/`, data);
      return response.data;
    }
    const response = await axiosInstance.post('drivers/', data);
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
