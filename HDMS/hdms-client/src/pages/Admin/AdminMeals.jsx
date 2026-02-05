import { useEffect, useState } from 'react';
import { getMealsSummary } from '../../api/adminMealsApi';

const mealLabels = {
  Lunch: 'Lunch',
  Dinner: 'Dinner'
};

function AdminMeals() {
  const [date, setDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = async (d) => {
    setLoading(true);
    setMsg('');
    try {
      const data = await getMealsSummary(d);
      setDate(data.date || data.Date || d);
      setSlots(data.slots || data.Slots || []);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMsg(
          typeof err.response.data === 'string'
            ? err.response.data
            : 'Failed to load meals summary.'
        );
      } else {
        setMsg('Failed to load meals summary (network).');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (e) => {
    const d = e.target.value;
    setDate(d);
    load(d);
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading meals summary...</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Gradient header */}
      <div className="dashboard-header card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="h4 mb-2">Meals Summary</h1>
              <p className="mb-0 opacity-75">Overview of all meal slots and stats</p>
            </div>
          </div>
        </div>
      </div>

      {msg && <div className="alert alert-danger">{msg}</div>}

      <form className="mb-3">
        <label className="form-label">Date</label>
        <input
          type="date"
          className="form-control"
          value={date}
          onChange={handleDateChange}
        />
      </form>

      <div className="row">
        {slots.map((s) => {
          const mt = s.mealType || s.MealType;
          return (
            <div className="col-md-6" key={mt}>
              <div className="card-pro p-4 mb-3">
                <h5>{mealLabels[mt] || mt}</h5>
                <ul className="mb-2">
                  <li>Total tokens: <b>{s.total ?? s.Total ?? 0}</b></li>
                  <li>Purchased: <b>{s.purchased ?? s.Purchased ?? 0}</b></li>
                  <li>Redeemed: <b>{s.redeemed ?? s.Redeemed ?? 0}</b></li>
                  <li>Remaining: <b>{s.remaining ?? s.Remaining ?? 0}</b></li>
                  <li>Listed: <b>{s.listed ?? s.Listed ?? 0}</b></li>
                  <li>Sold: <b>{s.sold ?? s.Sold ?? 0}</b></li>
                  <li>Cancelled: <b>{s.cancelled ?? s.Cancelled ?? 0}</b></li>
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminMeals;