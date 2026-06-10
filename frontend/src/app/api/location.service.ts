import axiosInstance from './axiosConfig';

export const locationService = {
  updateLocation: async (latitude: number, longitude: number) => {
    const response = await axiosInstance.post('locations/', {
      latitude,
      longitude,
    });
    return response.data;
  },
  getLocationHistory: async () => {
    const response = await axiosInstance.get('locations/');
    return response.data;
  },
};
