import axiosClient from './axiosClient';

export const getBuyOptions = async (date) => {
  const res = await axiosClient.get('/orders/options', {
    params: { date }
  });
  return res.data;
};

export const buyToken = async (payload) => {
  // payload: { date: 'YYYY-MM-DD', slot: 'LUNCH' | 'DINNER' }
  const res = await axiosClient.post('/orders/buy-token', payload);
  return res.data;
};

export const buyQRTokenGroup = async (payload) => {
  // payload: { date: 'YYYY-MM-DD', slot: 'LUNCH' | 'DINNER', quantity: 1-4, preference?: string }
  const res = await axiosClient.post('/orders/buy-qr-tokens', payload);
  return res.data;
};

export const getWallet = async () => {
  const res = await axiosClient.get('/orders/wallet');
  return res.data;
};