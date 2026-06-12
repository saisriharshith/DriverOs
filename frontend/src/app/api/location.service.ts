import axiosInstance from './axiosConfig';

export const locationService = {
  updateLocation: async (latitude: number, longitude: number) => {
    try {
      await axiosInstance.post('locations/', { latitude, longitude });
    } catch {
    }
  },
  getAddress: async (lat: number, lng: number) => {
    try {
      // Using BigDataCloud's free client-side reverse geocoding API
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await response.json();
      return `${data.locality || data.city || ''}, ${data.principalSubdivision || data.administrativeLevel2 || ''}`;
    } catch (err) {
      console.error("Reverse geocoding failed", err);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
};
