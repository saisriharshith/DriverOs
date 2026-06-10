import axiosInstance from './axiosConfig';

export const expenseService = {
  getExpenses: async () => {
    const response = await axiosInstance.get('expenses/');
    return response.data;
  },
  addExpense: async (data: any) => {
    const response = await axiosInstance.post('expenses/', data);
    return response.data;
  },
  deleteExpense: async (id: number) => {
    await axiosInstance.delete(`expenses/${id}/`);
  },
};