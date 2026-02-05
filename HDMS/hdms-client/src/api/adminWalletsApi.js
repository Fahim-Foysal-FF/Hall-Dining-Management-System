import axiosClient from './axiosClient';

export const searchWallets = async (q) => {
  const res = await axiosClient.get('/admin/wallets', {
    params: { q }
  });
  return res.data;
};

export const getPendingTransactions = async () => {
  const res = await axiosClient.get('/admin/wallets/pending-transactions');
  return res.data;
};

export const topupWallet = async (payload) => {
  // payload: { userId, amount, description? }
  const res = await axiosClient.post('/admin/wallets/topup', payload);
  return res.data;
};

export const revalidatePendingTransaction = async (transactionId) => {
  const res = await axiosClient.post('/admin/wallets/revalidate-pending', {
    transactionId
  });
  return res.data;
};