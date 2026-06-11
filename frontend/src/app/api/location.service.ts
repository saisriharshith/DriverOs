import axiosInstance from './axiosConfig';

export const locationService = {
  updateLocation: async (latitude: number, longitude: number) => {
    try {
      await axiosInstance.post('locations/', { latitude, longitude });
    } catch {
    }
  },
};
