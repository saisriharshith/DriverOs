import axiosInstance from './axiosConfig';

export const authService = {
  sendOTP: async (phone: string) => {
    const response = await axiosInstance.post('auth/send-otp/', { phone });
    return response.data;
  },
  verifyOTP: async (phone: string, otp: string, role?: string, language?: string) => {
    const response = await axiosInstance.post('auth/verify/', { phone, otp, role, language });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  getProfile: async () => {
    const response = await axiosInstance.get('auth/profile/');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await axiosInstance.patch('auth/profile/', data);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};