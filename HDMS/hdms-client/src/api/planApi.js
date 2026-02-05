import axiosClient from './axiosClient';

export const getWeekPlan = async () => {
  const res = await axiosClient.get('/plan/week');
  return res.data;
};