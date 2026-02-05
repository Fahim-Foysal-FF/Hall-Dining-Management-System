import axiosClient from './axiosClient';

export const submitComplaint = async (title, description, file = null) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  if (file) {
    formData.append('file', file);
  }

  const res = await axiosClient.post('/complaints/submit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return res.data;
};

export const getMyComplaints = async () => {
  const res = await axiosClient.get('/complaints/my-complaints');
  return res.data || [];
};

export const trackComplaint = async (trackId) => {
  const res = await axiosClient.get(`/complaints/track/${trackId}`);
  return res.data;
};

// Admin APIs
export const getAdminComplaints = async (status = '') => {
  const res = await axiosClient.get('/complaints/admin/all', {
    params: status ? { status } : {}
  });
  return res.data || [];
};

export const updateComplaint = async (id, status, adminResponse = '') => {
  const res = await axiosClient.put(`/complaints/admin/${id}/update`, {
    status,
    adminResponse
  });
  return res.data;
};
