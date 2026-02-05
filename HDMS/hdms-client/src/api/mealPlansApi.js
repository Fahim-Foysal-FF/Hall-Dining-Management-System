import axiosClient from './axiosClient';

export const getMealPlans = async () => {
  const res = await axiosClient.get('/mealplans');
  return res.data;
};

export const updateMealPlan = async (id, payload) => {
  // payload: { itemsText, choicesText, price, note }
  const res = await axiosClient.put(`/mealplans/${id}`, payload);
  return res.data;
};