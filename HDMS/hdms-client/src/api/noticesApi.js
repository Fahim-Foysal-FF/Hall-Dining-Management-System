import axiosClient from './axiosClient';

export const getNoticeBoard = async (page = 1, pageSize = 10) => {
  try {
    // Create a separate axios instance for public endpoints that doesn't require auth
    const res = await axiosClient.get('/notices/board', {
      params: { page, pageSize },
      headers: {}
    });
    console.log('Notice board response:', res.data);
    return res.data;
  } catch (error) {
    console.error('getNoticeBoard error:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
};

export const getNoticeDetail = async (id) => {
  try {
    // Create a separate axios instance for public endpoints that doesn't require auth
    const res = await axiosClient.get(`/notices/board/${id}`, {
      headers: {}
    });
    console.log('Notice detail response:', res.data);
    return res.data;
  } catch (error) {
    console.error('getNoticeDetail error:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
};

// Admin APIs
export const createNotice = async (title, content, expiresAt = null, file = null) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  if (expiresAt) formData.append('expiresAt', expiresAt);
  if (file) formData.append('file', file);

  const res = await axiosClient.post('/notices/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const getAllNotices = async (page = 1, pageSize = 10) => {
  const res = await axiosClient.get('/notices/admin/all', {
    params: { page, pageSize }
  });
  return res.data;
};

export const updateNotice = async (id, title, content, expiresAt = null, file = null) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  if (expiresAt) formData.append('expiresAt', expiresAt);
  if (file) formData.append('file', file);

  const res = await axiosClient.put(`/notices/admin/${id}/update`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const toggleNoticeStatus = async (id) => {
  const res = await axiosClient.put(`/notices/admin/${id}/toggle-status`);
  return res.data;
};

export const deleteNotice = async (id) => {
  const res = await axiosClient.delete(`/notices/admin/${id}/delete`);
  return res.data;
};
