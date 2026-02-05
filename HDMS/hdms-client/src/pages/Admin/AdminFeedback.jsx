import { useEffect, useState } from 'react';
import { getAdminFeedback } from '../../api/feedbackApi';

const mealNames = {
  Breakfast: 'Breakfast',
  Lunch: 'Lunch',
  Dinner: 'Dinner'
};

function AdminFeedback() {
  const [date, setDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [summary, setSummary] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = async (d) => {
    setLoading(true);
    setMsg('');
    try {
      const data = await getAdminFeedback(d);
      setDate(data.date || data.Date || d);
      setSummary(data.summary || data.Summary || []);
      setRows(data.rows || data.Rows || []);
    } catch (err) {
      console.error(err);
      setMsg('Failed to load feedback.');
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

  const getSlotSummary = (slotName) => {
    const item =
      summary.find((s) => (s.mealType || s.MealType) === slotName) || null;
    if (!item) return { avg: 0, count: 0 };
    return {
      avg: Number(item.avg ?? item.Avg ?? 0),
      count: Number(item.count ?? item.Count ?? 0)
    };
  };

  const lunch = getSlotSummary('Lunch');
  const dinner = getSlotSummary('Dinner');

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading feedback summary...</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Gradient header */}
      <div className="dashboard-header card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="h4 mb-2">Feedback (Admin)</h1>
              <p className="mb-0 opacity-75">View and analyze meal feedback</p>
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

      <div className="row mb-3">
        <div className="col-md-6">
          <div className="card-pro p-4 h-100">
            <h6>Lunch average</h6>
            <div>
              Average: <b>{lunch.avg.toFixed(2)}</b> ({lunch.count} ratings)
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card-pro p-4 h-100">
            <h6>Dinner average</h6>
            <div>
              Average: <b>{dinner.avg.toFixed(2)}</b> ({dinner.count} ratings)
            </div>
          </div>
        </div>
      </div>

      <div className="card-pro p-4">
        <h5 className="mb-3">Feedback Details</h5>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Slot</th>
                <th>User</th>
                <th>Rating</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-muted">No feedback on this date.</td>
                </tr>
              )}
              {rows.map((f) => {
                const dateStr = f.date || f.Date;
                const mealType = f.mealType || f.MealType;
                const userCode = f.studentCode || f.StudentCode;
                const userName = f.studentName || f.StudentName;
                const userEmail = f.studentEmail || f.StudentEmail;
                return (
                  <tr key={f.id}>
                    <td>{dateStr && dateStr.substring ? dateStr.substring(0, 10) : ''}</td>
                    <td>{mealNames[mealType] || mealType}</td>
                    <td>
                      {userCode && (
                        <span className="badge bg-secondary me-1">{userCode}</span>
                      )}
                      {userName} ({userEmail})
                    </td>
                    <td>{f.rating ?? f.Rating}</td>
                    <td>{f.comment ?? f.Comment ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminFeedback;