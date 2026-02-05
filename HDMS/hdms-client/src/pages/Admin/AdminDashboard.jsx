import { useEffect, useState } from 'react';
import { getAdminDashboard } from '../../api/adminApi';

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const d = await getAdminDashboard();
      console.log('Admin dashboard data:', d); // DEBUG: see exact shape in DevTools
      setData(d || {});
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      if (err.response && err.response.data) {
        setMsg(
          typeof err.response.data === 'string'
            ? err.response.data
            : 'Failed to load admin dashboard (server error).'
        );
      } else {
        setMsg('Failed to load admin dashboard (network error).');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);


  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading dashboard...</p>
      </div>
    </div>
  );

  if (msg) {
    return <div className="alert alert-danger mt-3">{msg}</div>;
  }

  if (!data) {
    return <p>No dashboard data (empty response).</p>;
  }

  // --------- Normal rendering when data is present ----------

  const stats = data.stats || data.Stats || {};
  const today = data.today || data.Today || {};
  const market = data.market || data.Market || {};
  const feedback = data.feedback || data.Feedback || {};
  const wallet = data.wallet || data.Wallet || {};
  const nextPlan = data.nextPlan || data.NextPlan || {};

  // Ensure today's date is set (default to today if missing)
  const todayDate = today.date || today.Date || new Date().toISOString().split('T')[0];

  const lunchToday = today.lunch || today.Lunch || {};
  const dinnerToday = today.dinner || today.Dinner || {};

  return (
    <div>
      {/* Gradient header */}
      <div className="dashboard-header card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="h3 mb-2">Admin Dashboard</h1>
              <p className="mb-0 opacity-75">Overview of all hall dining activity</p>
            </div>
            <div className="col-md-4 text-md-end">
              <div className="bg-white rounded-pill px-3 py-2 d-inline-block text-center">
                <small className="text-muted">Today</small>
                <div className="fw-bold text-dark">{todayDate}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top stats row */}
      <div className="dashboard-grid mb-4">
        <div className="stats-card">
          <div className="icon bg-primary bg-opacity-10 text-primary">
            <i className="bi bi-people"></i>
          </div>
          <div className="value">{stats.students ?? stats.Students ?? 0}</div>
          <div className="label">Students</div>
        </div>
        <div className="stats-card">
          <div className="icon bg-info bg-opacity-10 text-info">
            <i className="bi bi-person-badge"></i>
          </div>
          <div className="value">{stats.admins ?? stats.Admins ?? 0}</div>
          <div className="label">Admins</div>
        </div>
        <div className="stats-card">
          <div className="icon bg-warning bg-opacity-10 text-warning">
            <i className="bi bi-ticket-perforated"></i>
          </div>
          <div className="value">{stats.tokens ?? stats.Tokens ?? 0}</div>
          <div className="label">Tokens</div>
        </div>
        <div className="stats-card">
          <div className="icon bg-success bg-opacity-10 text-success">
            <i className="bi bi-cash-coin"></i>
          </div>
          <div className="value">৳ {Number(stats.revenueTotal ?? stats.RevenueTotal ?? 0).toFixed(2)}</div>
          <div className="label">Revenue (total)</div>
        </div>
        <div className="stats-card">
          <div className="icon bg-danger bg-opacity-10 text-danger">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="value">৳ {Number(stats.revenueToday ?? stats.RevenueToday ?? 0).toFixed(2)}</div>
          <div className="label">Revenue (today)</div>
        </div>
        <div className="stats-card">
          <div className="icon bg-secondary bg-opacity-10 text-secondary">
            <i className="bi bi-shop"></i>
          </div>
          <div className="value">{market.listedNow ?? market.ListedNow ?? 0}</div>
          <div className="label">Listed now</div>
        </div>
      </div>

      {/* Today's lunch / dinner snapshot */}
      <div className="row g-3 mt-2">
        <div className="col-md-6">
          <div className="card-pro p-4 h-100">
            <h5 className="mb-2">Today ({todayDate}) — Lunch</h5>
            <ul className="mb-0">
              <li>Total issued (valid): <b>{lunchToday.total ?? lunchToday.Total ?? 0}</b></li>
              <li>Used: <b>{lunchToday.used ?? lunchToday.Used ?? 0}</b></li>
              <li>Remaining: <b>{lunchToday.remaining ?? lunchToday.Remaining ?? 0}</b></li>
              <li>Listed now: <b>{lunchToday.listed ?? lunchToday.Listed ?? 0}</b></li>
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card-pro p-4 h-100">
            <h5 className="mb-2">Today ({todayDate}) — Dinner</h5>
            <ul className="mb-0">
              <li>Total issued (valid): <b>{dinnerToday.total ?? dinnerToday.Total ?? 0}</b></li>
              <li>Used: <b>{dinnerToday.used ?? dinnerToday.Used ?? 0}</b></li>
              <li>Remaining: <b>{dinnerToday.remaining ?? dinnerToday.Remaining ?? 0}</b></li>
              <li>Listed now: <b>{dinnerToday.listed ?? dinnerToday.Listed ?? 0}</b></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Marketplace + Feedback + Wallet */}
      <div className="row g-3 mt-2">
        <div className="col-md-4">
          <div className="card-pro p-4 h-100">
            <h5>Marketplace</h5>
            <ul className="mb-0">
              <li>Listed now: <b>{market.listedNow ?? market.ListedNow ?? 0}</b></li>
              <li>Sold today: <b>{market.soldToday ?? market.SoldToday ?? 0}</b></li>
              <li>Sold amount today: <b>৳ {Number(market.soldAmountToday ?? market.SoldAmountToday ?? 0).toFixed(2)}</b></li>
            </ul>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card-pro p-4 h-100">
            <h5>Feedback today</h5>
            <ul className="mb-0">
              <li>Lunch avg: <b>{Number(feedback.lunchAvg ?? feedback.LunchAvg ?? 0).toFixed(2)}</b> ({feedback.lunchCount ?? feedback.LunchCount ?? 0} ratings)</li>
              <li>Dinner avg: <b>{Number(feedback.dinnerAvg ?? feedback.DinnerAvg ?? 0).toFixed(2)}</b> ({feedback.dinnerCount ?? feedback.DinnerCount ?? 0} ratings)</li>
            </ul>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card-pro p-4 h-100">
            <h5>Wallet</h5>
            <ul className="mb-0">
              <li>Total balance: <b>৳ {Number(wallet.totalBalance ?? wallet.TotalBalance ?? 0).toFixed(2)}</b></li>
              <li>Top-ups today: <b>{wallet.topupsToday ?? wallet.TopupsToday ?? 0}</b></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tomorrow's meal plan */}
      <div className="card-pro p-4 mt-4">
        <h5>Tomorrow ({nextPlan.date ?? nextPlan.Date})</h5>
        <div className="row">
          <div className="col-md-6">
            <h6>Lunch</h6>
            {nextPlan.lunch || nextPlan.Lunch ? (
              renderPlanSlot(nextPlan.lunch || nextPlan.Lunch)
            ) : (
              <div className="text-muted">No lunch plan set.</div>
            )}
          </div>
          <div className="col-md-6">
            <h6>Dinner</h6>
            {nextPlan.dinner || nextPlan.Dinner ? (
              renderPlanSlot(nextPlan.dinner || nextPlan.Dinner)
            ) : (
              <div className="text-muted">No dinner plan set.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderPlanSlot(slot) {
  const itemsText = slot.itemsText || slot.ItemsText;
  const note = slot.note || slot.Note;
  const price = Number(slot.price ?? slot.Price ?? 0);

  return (
    <>
      <div>{itemsText}</div>
      {note && <div className="text-muted small">{note}</div>}
      <div className="fw-semibold mt-1">Price: ৳ {price.toFixed(2)}</div>
    </>
  );
}

export default AdminDashboard;