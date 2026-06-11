import axiosInstance from './axiosConfig';

export const emergencyService = {
  sendSOS: async (lat: number, lng: number, type: string = "SOS") => {
    const response = await axiosInstance.post('emergency/sos/', {
      location_lat: lat,
      location_long: lng,
      type: type,
    });
    return response.data;
  },
  getSOSHistory: async () => {
    const response = await axiosInstance.get('emergency/sos/');
    return response.data;
  },
  resolveSOS: async (id: number) => {
    const response = await axiosInstance.patch(`emergency/sos/${id}/`, {
      status: 'RESOLVED',
    });
    return response.data;
  },
};
