import axiosClient from './axiosClient';

export const getAdminTokens = async () => {
  const res = await axiosClient.get('/admin/tokens');
  return res.data;
};

export const getAdminListings = async () => {
  const res = await axiosClient.get('/admin/tokens/listings');
  return res.data;
};

export const sendFreeTokens = async (data) => {
  const res = await axiosClient.post('/admin/tokens/send-free', {
    mealDate: data.mealDate,
    mealType: data.mealType,
    reason: data.reason
  });
  return res.data;
};