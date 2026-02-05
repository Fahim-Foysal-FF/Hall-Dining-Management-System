import axiosClient from './axiosClient';

export const purchaseTokens = (data) =>
  axiosClient.post('/tokens/purchase', data);

export const getMyTokens = async () => {
  const res = await axiosClient.get('/tokens/my');
  return res.data;
};

export const getTokenDetails = async (tokenId, uid) => {
  const params = {};
  if (tokenId) params.tokenId = tokenId;
  if (uid) params.uid = uid;
  
  console.log('getTokenDetails API call with params:', params);
  
  try {
    const res = await axiosClient.get('/tokens/scan', { params });
    console.log('getTokenDetails API response:', res.data);
    return res.data;
  } catch (err) {
    console.error('getTokenDetails API error:', err.response?.status, err.response?.data || err.message);
    throw err;
  }
};