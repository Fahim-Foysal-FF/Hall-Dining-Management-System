import axiosClient from './axiosClient';

export const getDiningClosures = async () => {
  const res = await axiosClient.get('/admin/dining/closures');
  return res.data;
};

export const getActiveDiningClosures = async () => {
  const res = await axiosClient.get('/admin/dining/closures/active');
  return res.data;
};

export const createDiningClosure = async (data) => {
  const res = await axiosClient.post('/admin/dining/closures', {
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
    description: data.description
  });
  return res.data;
};

export const updateDiningClosure = async (id, data) => {
  const res = await axiosClient.put(`/admin/dining/closures/${id}`, {
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
    description: data.description
  });
  return res.data;
};

export const deleteDiningClosure = async (id) => {
  const res = await axiosClient.delete(`/admin/dining/closures/${id}`);
  return res.data;
};

export const checkDiningAvailable = async (date) => {
  const res = await axiosClient.get(`/admin/dining/check/${date}`);
  return res.data;
};
