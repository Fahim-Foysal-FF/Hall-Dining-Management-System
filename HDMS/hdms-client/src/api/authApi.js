import axiosClient from './axiosClient';

export const register = (data) => axiosClient.post('/auth/register', data);

export const login = async (data) => {
  const res = await axiosClient.post('/auth/login', data);
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await axiosClient.post('/auth/forgot', { email });
  return res.data;
};

export const resetPassword = async (payload) => {
  const res = await axiosClient.post('/auth/reset', payload);
  return res.data;
};