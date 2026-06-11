import axiosInstance from './axiosConfig';

export const tripService = {
  getTrips: async () => {
    const response = await axiosInstance.get('trips/');
    return response.data;
  },
  startTrip: async (data: any) => {
    const response = await axiosInstance.post('trips/', data);
    return response.data;
  },
  updateTrip: async (id: number, data: any) => {
    const response = await axiosInstance.patch(`trips/${id}/`, data);
    return response.data;
  },
  completeTrip: async (id: number, data: any) => {
    const response = await axiosInstance.post(`trips/${id}/complete/`, data);
    return response.data;
  },
  };