import { useEffect, useState } from 'react';
import { getAdminTokens, getAdminListings, sendFreeTokens } from '../../api/adminTokensApi';

function AdminTokens() {
  const [tokens, setTokens] = useState([]);
  const [listings, setListings] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Free tokens form
  const [showFreeTokensForm, setShowFreeTokensForm] = useState(false);
  const [freeTokensForm, setFreeTokensForm] = useState({
    mealDate: '',
    mealType: '0',
    reason: ''
  });
  const [sendingFreeTokens, setSendingFreeTokens] = useState(false);

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const [toks, lst] = await Promise.all([
        getAdminTokens(),
        getAdminListings()
      ]);
      const sortedTokens = [...toks].sort((a, b) => (b.id || 0) - (a.id || 0));
      setTokens(sortedTokens);
      setListings(lst);
    } catch (err) {
      console.error(err);
      setMsg('Failed to load tokens data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSendFreeTokens = async (e) => {
    e.preventDefault();
    
    if (!freeTokensForm.mealDate || !freeTokensForm.reason.trim()) {
      setMsg('❌ Please fill in all fields');
      return;
    }

    setSendingFreeTokens(true);
    setMsg('');

    try {
      const result = await sendFreeTokens({
        mealDate: new Date(freeTokensForm.mealDate),
        mealType: parseInt(freeTokensForm.mealType),
        reason: freeTokensForm.reason.trim()
      });

      if (result.success) {
        setMsg(`✅ ${result.message} - Tokens: ${result.tokensCreated}`);
        setFreeTokensForm({ mealDate: '', mealType: '0', reason: '' });
        setShowFreeTokensForm(false);
        await load();
      } else {
        setMsg(`⚠️ ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      setMsg('❌ Failed to send free tokens');
    } finally {
      setSendingFreeTokens(false);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading tokens...</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Gradient header */}
      <div className="dashboard-header card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="h4 mb-2">All Tokens</h1>
              <p className="mb-0 opacity-75">Overview of all tokens and listings</p>
            </div>
            <div className="col-md-4 text-md-end">
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowFreeTokensForm(!showFreeTokensForm)}
              >
                <i className="bi bi-gift me-2"></i>
                {showFreeTokensForm ? 'Close' : 'Send Free Tokens'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.includes('✅') ? 'alert-success' : msg.includes('❌') ? 'alert-danger' : 'alert-warning'}`}>
          {msg}
        </div>
      )}

      {showFreeTokensForm && (
        <div className="card-pro p-4 mb-4 border border-primary">
          <h5 className="mb-3">
            <i className="bi bi-gift-fill text-success me-2"></i>
            Send Free Tokens to All Users
          </h5>
          <form onSubmit={handleSendFreeTokens}>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Meal Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={freeTokensForm.mealDate}
                  onChange={(e) => setFreeTokensForm({...freeTokensForm, mealDate: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Meal Type</label>
                <select
                  className="form-select"
                  value={freeTokensForm.mealType}
                  onChange={(e) => setFreeTokensForm({...freeTokensForm, mealType: e.target.value})}
                >
                  <option value="0">Breakfast</option>
                  <option value="1">Lunch</option>
                  <option value="2">Dinner</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Reason/Event</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Hall Day, March 26, Eid"
                  value={freeTokensForm.reason}
                  onChange={(e) => setFreeTokensForm({...freeTokensForm, reason: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-success"
                disabled={sendingFreeTokens}
              >
                {sendingFreeTokens ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Send to All Users
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowFreeTokensForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card-pro p-4 mb-4">
        <h5 className="mb-3">All Tokens</h5>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tokens.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-muted">No tokens.</td>
                </tr>
              ) : (
                tokens.map((t) => {
                  const dateStr = t.date || t.Date;
                  return (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>
                        {t.studentCode && (
                          <span className="badge bg-secondary me-1">{t.studentCode}</span>
                        )}
                        {t.studentName} ({t.studentEmail})
                      </td>
                      <td>{dateStr && dateStr.substring ? dateStr.substring(0, 10) : ''}</td>
                      <td>{t.mealType}</td>
                      <td>৳ {Number(t.price).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${Number(t.price) === 0 ? 'bg-success' : 'bg-info'}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-pro p-4 mb-4">
        <h5 className="mb-3">Listings</h5>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Token</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-muted">No listings.</td>
                </tr>
              ) : (
                listings.map((l) => {
                  const dateStr = l.tokenDate || l.TokenDate;
                  return (
                    <tr key={l.id}>
                      <td>{l.id}</td>
                      <td>{l.tokenId}</td>
                      <td>{dateStr && dateStr.substring ? dateStr.substring(0, 10) : ''}</td>
                      <td>{l.mealType || l.MealType}</td>
                      <td>
                        {l.sellerCode && (
                          <span className="badge bg-secondary me-1">{l.sellerCode}</span>
                        )}
                        {l.sellerName} ({l.sellerEmail})
                      </td>
                      <td>৳ {Number(l.price ?? l.Price ?? 0).toFixed(2)}</td>
                      <td>{l.status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminTokens;