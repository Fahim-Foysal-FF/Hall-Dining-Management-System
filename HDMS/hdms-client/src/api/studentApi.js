import axiosClient from './axiosClient';

export const getStudentDashboard = async () => {
  const res = await axiosClient.get('/student/dashboard');
  const d = res.data || {};

  // Normalize casing from backend (Stats, RecentTokens, Wallet, TodayMenu)
  const statsRaw = d.stats || d.Stats || {};
  const walletRaw = d.wallet || d.Wallet || {};
  const recentRaw = d.recentTokens || d.RecentTokens || [];
  const todayMenuRaw = d.todayMenu || d.TodayMenu || null;

  const stats = {
    totalTokens: statsRaw.totalTokens ?? statsRaw.TotalTokens ?? 0,
    usedTokens: statsRaw.usedTokens ?? statsRaw.UsedTokens ?? 0,
    activeTokens: statsRaw.activeTokens ?? statsRaw.ActiveTokens ?? 0,
    monthlyTokens: statsRaw.monthlyTokens ?? statsRaw.MonthlyTokens ?? 0,
    yearlyTokens: statsRaw.yearlyTokens ?? statsRaw.YearlyTokens ?? 0,
    remainingMonthly:
      statsRaw.remainingMonthly ?? statsRaw.RemainingMonthly ?? 0
  };

  const wallet = {
    balance: walletRaw.balance ?? walletRaw.Balance ?? 0
  };

  const recentTokens = (recentRaw || []).map((t) => ({
    id: t.id ?? t.Id,
    date: t.date ?? t.Date,
    mealType: t.mealType ?? t.MealType,
    status: t.status ?? t.Status,
    price: t.price ?? t.Price ?? 0
  }));

  let todayMenu = null;
  if (todayMenuRaw) {
    todayMenu = {
      date: todayMenuRaw.date ?? todayMenuRaw.Date,
      lunch: todayMenuRaw.lunch ?? todayMenuRaw.Lunch ?? null,
      dinner: todayMenuRaw.dinner ?? todayMenuRaw.Dinner ?? null
    };
  }

  return { stats, wallet, recentTokens, todayMenu };
};

export const getFirstTokenAlert = async () => {
  try {
    const res = await axiosClient.get('/student/first-token-alert');
    return res.data || { hasAlert: false };
  } catch (err) {
    console.error('Error fetching first token alert:', err);
    return { hasAlert: false };
  }
};