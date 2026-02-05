import { useEffect, useState } from 'react';
import { getAllUsersTokens, getMonthlyLimit, setMonthlyLimit } from '../../api/reportsApi';

function AdminReports() {
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [monthValue, setMonthValue] = useState(initialMonth); // YYYY-MM
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(45);
  const [msg, setMsg] = useState('');
  const [savingLimit, setSavingLimit] = useState(false);

  const syncYearMonth = (val) => {
    const [y, m] = val.split('-').map((x) => parseInt(x, 10));
    if (!Number.isNaN(y) && !Number.isNaN(m)) {
      setYear(y);
      setMonth(m);
    }
  };

  useEffect(() => {
    syncYearMonth(monthValue);
  }, [monthValue]);

  const load = async () => {
    const data = await getAllUsersTokens(year, month);
    setReport(data);
    try {
      const cap = await getMonthlyLimit(year, month);
      setLimit(cap.limit ?? cap.Limit ?? 45);
    } catch {
      setLimit(45);
    }
  };

  const handleSaveLimit = async () => {
    setSavingLimit(true);
    setMsg('');
    try {
      await setMonthlyLimit(year, month, Number(limit));
      setMsg('Monthly fixed meal limit saved.');
    } catch (err) {
      console.error(err);
      setMsg('Failed to save monthly limit.');
    } finally {
      setSavingLimit(false);
    }
  };

  const filteredReport = report
    ? report.filter((u) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          (u.fullName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.userCode || '').toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div>
      {/* Gradient header */}
      <div className="dashboard-header card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="h4 mb-2">All Users Monthly Token Report</h1>
              <p className="mb-0 opacity-75">Detailed monthly token stats for all users</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-pro p-4 mb-4">
        {msg && <div className="alert alert-info mb-3">{msg}</div>}
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label mb-1">Month</label>
            <input
              type="month"
              className="form-control"
              value={monthValue}
              onChange={(e) => setMonthValue(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label mb-1">Fixed meal limit (per month)</label>
            <input
              type="number"
              className="form-control"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10) || 0)}
              min="1"
            />
          </div>
          <div className="col-md-5 d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={handleSaveLimit} disabled={savingLimit}>
              {savingLimit ? 'Saving...' : 'Save Limit'}
            </button>
            <button className="btn btn-prim" onClick={load}>Load Report</button>
          </div>
        </div>
        <div className="row g-3 align-items-end mt-3">
          <div className="col-md-6">
            <label className="form-label mb-1">Search users</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, user code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {report && (
        <div className="card-pro p-4">
          <h5 className="mb-3">Report for {year}-{String(month).padStart(2, '0')} (Monthly limit: {limit})</h5>
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>User Code</th>
                  <th>Purchased Tokens</th>
                  <th>Remaining Tokens</th>
                </tr>
              </thead>
              <tbody>
                {filteredReport.map((user) => {
                  const remaining = user.remainingTokens;
                  const isLow = user.purchasedTokens < limit;
                  return (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.userCode}</td>
                    <td className={isLow ? 'text-danger fw-semibold' : ''}>{user.purchasedTokens}</td>
                    <td className={remaining > 0 ? 'text-danger fw-semibold' : ''}>{remaining}</td>
                  </tr>
                  );
                })}
                {filteredReport.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-muted">No users match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;