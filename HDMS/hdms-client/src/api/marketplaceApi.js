import axiosClient from './axiosClient';

export const getListings = async () => {
  const res = await axiosClient.get('/marketplace/listings');
  return res.data;
};

export const buyListing = async (id) => {
  const res = await axiosClient.post(`/marketplace/listings/${id}/buy`);
  return res.data;
};

export const createListing = async (payload) => {
  // payload: { tokenId, listingPrice }
  const res = await axiosClient.post('/marketplace/listings', payload);
  return res.data;
};