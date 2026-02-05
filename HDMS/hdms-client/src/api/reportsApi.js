import axiosClient from './axiosClient';

export const getStudentMonthly = async (year, month) => {
  const res = await axiosClient.get(
    `/reports/student/monthly?year=${year}&month=${month}`
  );
  return res.data;
};

export const getAdminConsumption = async (year, month) => {
  const res = await axiosClient.get(
    `/reports/admin/consumption?year=${year}&month=${month}`
  );
  return res.data;
};

export const getMyMonthlyTokens = async (year, month) => {
  const res = await axiosClient.get(
    `/reports/my-monthly-tokens?year=${year}&month=${month}`
  );
  return res.data;
};

export const getAllUsersTokens = async (year, month) => {
  const res = await axiosClient.get(
    `/reports/all-users-tokens?year=${year}&month=${month}`
  );
  return res.data;
};

export const getMonthlyLimit = async (year, month) => {
  const res = await axiosClient.get(
    `/reports/monthly-limit?year=${year}&month=${month}`
  );
  return res.data;
};

export const setMonthlyLimit = async (year, month, limit) => {
  const res = await axiosClient.post('/reports/monthly-limit', {
    year,
    month,
    limit
  });
  return res.data;
};