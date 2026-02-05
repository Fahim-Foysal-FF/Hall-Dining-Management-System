import axiosClient from './axiosClient';

export const getAdminDashboard = async () => {
  const res = await axiosClient.get('/admin/dashboard'); // -> http://localhost:5230/api/admin/dashboard
  return res.data; // should be an object with { stats, today, market, feedback, wallet, nextPlan }
};