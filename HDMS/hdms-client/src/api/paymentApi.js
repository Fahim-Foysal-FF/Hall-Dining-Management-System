import axiosClient from './axiosClient';

export const initiatePayment = async (amount) => {
  const res = await axiosClient.post('/payment/initiate', { amount });
  return res.data;
};

export const getPaymentStatus = async (tranId) => {
  const res = await axiosClient.get(`/payment/status/${tranId}`);
  return res.data;
};
