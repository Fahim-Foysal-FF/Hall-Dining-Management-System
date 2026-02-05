import axiosClient from './axiosClient';

export const getCurrentWeekMenu = async () => {
  const res = await axiosClient.get('/menu/current-week');
  return res.data;
};