import axios from 'axios';

const API_BASE_URL = 'http://localhost:5045/api/admin/usermoderation';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getFlaggedUsers = async () => {
  const response = await axios.get(`${API_BASE_URL}/flagged-users`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const analyzeUser = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/analyze/${userId}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const suspendUser = async (suspensionData) => {
  const response = await axios.post(`${API_BASE_URL}/suspend`, suspensionData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getSuspensions = async (activeOnly = false) => {
  const response = await axios.get(`${API_BASE_URL}/suspensions`, {
    params: { activeOnly },
    headers: getAuthHeader(),
  });
  return response.data;
};

export const revokeSuspension = async (suspensionId, reason) => {
  const response = await axios.post(`${API_BASE_URL}/revoke/${suspensionId}`, 
    { reason },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getAbuseLogs = async (unreviewedOnly = false) => {
  const response = await axios.get(`${API_BASE_URL}/abuse-logs`, {
    params: { unreviewedOnly },
    headers: getAuthHeader(),
  });
  return response.data;
};

export const checkUserSuspension = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/check-suspension/${userId}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const blockUser = async (blockData) => {
  const response = await axios.post(`${API_BASE_URL}/block`, blockData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const unblockUser = async (userId, reason) => {
  const response = await axios.post(`${API_BASE_URL}/unblock/${userId}`, 
    { reason },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getAllUsers = async (search = '') => {
  const response = await axios.get(`${API_BASE_URL}/all-users`, {
    params: { search },
    headers: getAuthHeader(),
  });
  return response.data;
};
