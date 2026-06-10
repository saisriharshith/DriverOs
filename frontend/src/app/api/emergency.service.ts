import axiosInstance from './axiosConfig';

export const emergencyService = {
  sendSOS: async (location_lat: number, location_long: number, type: string = 'SOS') => {
    const response = await axiosInstance.post('emergency/sos/', {
      location_lat,
      location_long,
      type
    });
    return response.data;
  },
};