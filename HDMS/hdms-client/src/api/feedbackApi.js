import axiosClient from './axiosClient';

export const getEligibleFeedback = async () => {
  const res = await axiosClient.get('/feedback/eligible');
  return res.data;
};

export const submitFeedbackFromToken = async (payload) => {
  // { tokenId, rating, comment }
  const res = await axiosClient.post('/feedback/from-token', payload);
  return res.data;
};

export const getAdminFeedback = async (date) => {
  const res = await axiosClient.get('/feedback/admin', {
    params: { date }
  });
  return res.data;
};