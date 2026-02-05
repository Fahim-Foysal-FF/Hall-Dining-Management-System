import axiosClient from './axiosClient';

export const getMealsSummary = async (date) => {
  const res = await axiosClient.get('/admin/meals-summary', {
    params: { date }
  });
  return res.data;
};