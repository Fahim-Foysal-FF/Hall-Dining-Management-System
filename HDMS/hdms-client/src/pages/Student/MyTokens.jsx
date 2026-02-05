import { useEffect, useState } from 'react';
import { getMyTokens } from '../../api/tokensApi';
import { createListing } from '../../api/marketplaceApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const mealNames = ['Breakfast', 'Lunch', 'Dinner'];

function MyTokens() {
  const [tokens, setTokens] = useState([]);
  const [prices, setPrices] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, expired, redeemed

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyTokens();
      setTokens(data);
    } catch (err) {
      console.error(err);
      setMsg('Failed to load tokens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePriceChange = (id, value) => {
    setPrices((p) => ({ ...p, [id]: value }));
  };

  const handleList = async (token) => {
    const price = parseFloat(prices[token.id]);
    if (!price || price <= 0) {
      setMsg('Enter a valid price.');
      return;
    }
    setMsg('');
    try {
      await createListing({ tokenId: token.id, listingPrice: price });
      setMsg('Token listed for sale.');
      await load();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMsg(
          typeof err.response.data === 'string'
            ? err.response.data
            : 'Listing failed.'
        );
      } else {
        setMsg('Listing failed (network).');
      }
    }
  };

  const today = new Date().toISOString().substring(0, 10);

  const filteredTokens = tokens.filter((t) => {
    if (filter === 'all') return true;
    // Active tokens are usable: Purchased OR ListedForSale (until bought), and not expired
    if (filter === 'active') return (t.status === 0 || t.status === 2) && t.date?.substring(0, 10) >= today;
    if (filter === 'expired') return t.date?.substring(0, 10) < today;
    if (filter === 'redeemed') return t.status === 1;
    return true;
  });

  // Sort tokens by Token ID in descending order (newest first)
  const sortedTokens = [...filteredTokens].sort((a, b) => (b.id || 0) - (a.id || 0));

  const canList = (t) => {
    // Status is enum int: 0=Purchased,1=Redeemed,2=ListedForSale,3=Sold,4=Cancelled
    const statusPurchased = 0;
    const tokenDate = (t.date || '').substring(0, 10);
    return t.status === statusPurchased && tokenDate >= today;
  };

  const statusText = (status, tokenDate) => {
    switch (status) {
      case 0:
        return tokenDate && tokenDate >= today ? 'Active' : 'Purchased';
      case 1:
        return 'Redeemed';
      case 2:
        return 'Listed';
      case 3:
        return 'Sold';
      case 4:
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status, tokenDate) => {
    switch (status) {
      case 0: // Active or Purchased
        return tokenDate && tokenDate >= today ? 'badge bg-success' : 'badge bg-info';
      case 1: // Redeemed
        return 'badge bg-primary';
      case 2: // Listed
        return 'badge bg-warning text-dark';
      case 3: // Sold
        return 'badge bg-secondary';
      case 4: // Cancelled
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  };

  if (loading) return <p>Loading my tokens...</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">My Tokens</h3>
          <p className="text-muted mb-0">View and manage your meal tokens</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('all')}
          >
            All ({tokens.length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'active' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setFilter('active')}
          >
            Active ({tokens.filter(t => t.status === 0 && t.date?.substring(0, 10) >= today).length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'redeemed' ? 'btn-info' : 'btn-outline-info'}`}
            onClick={() => setFilter('redeemed')}
          >
            Redeemed ({tokens.filter(t => t.status === 1).length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'expired' ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('expired')}
          >
            Expired ({tokens.filter(t => t.date?.substring(0, 10) < today).length})
          </button>
        </div>
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}

      <Card>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th style={{ width: '5%' }}>ID</th>
                <th style={{ width: '18%' }}>Token UID</th>
                <th style={{ width: '10%' }}>Date</th>
                <th style={{ width: '10%' }}>Meal</th>
                <th style={{ width: '15%' }}>Meal Preference</th>
                <th style={{ width: '10%' }}>Price</th>
                <th style={{ width: '12%' }}>QR Group</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '20%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTokens.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    {tokens.length === 0 ? 'No tokens yet. Purchase tokens to see them here.' : 'No tokens match the current filter.'}
                  </td>
                </tr>
              ) : (
                sortedTokens.map((t) => (
                  <tr key={t.id} className={t.date?.substring(0, 10) < today ? 'table-secondary' : ''}>
                    <td className="fw-bold">{t.id}</td>
                    <td>
                      <small className="text-monospace" style={{ fontSize: '0.8rem' }}>
                        {t.tokenUid || <span className="text-muted">—</span>}
                      </small>
                    </td>
                    <td>{t.date?.substring(0, 10) || '—'}</td>
                    <td>
                      <span className={`badge ${t.mealType === 1 ? 'bg-warning text-dark' : 'bg-info text-white'}`}>
                        {mealNames[t.mealType] || '—'}
                      </span>
                    </td>
                    <td>
                      {t.mealPreference ? (
                        <span className="badge bg-gradient" style={{
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #16a34a 100%)',
                          color: '#0b1b2b',
                          fontSize: '0.8rem',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          boxShadow: '0 4px 10px rgba(14, 165, 233, 0.25)'
                        }}>
                          {t.mealPreference}
                        </span>
                      ) : (
                        <span className="text-muted small fst-italic">No preference</span>
                      )}
                    </td>
                    <td className="fw-bold">৳ {Number(t.price || 0).toFixed(2)}</td>
                    <td>
                      {t.qrTokenGroupId ? (
                        <div>
                          <small className="badge bg-success">QR Group #{t.qrTokenGroupId}</small>
                          {t.qrTokenGroup && (
                            <small className="d-block text-muted mt-1">
                              {t.qrTokenGroup.remainingTokens || 0}/{t.qrTokenGroup.totalTokens || 0} remaining
                            </small>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted small">Single Token</span>
                      )}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(t.status, t.date?.substring(0, 10))}>
                        {statusText(t.status, t.date?.substring(0, 10))}
                      </span>
                    </td>
                    <td>
                      {canList(t) ? (
                        <div className="d-flex gap-2 align-items-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-control form-control-sm"
                            placeholder="Price"
                            value={prices[t.id] || ''}
                            onChange={(e) => handlePriceChange(t.id, e.target.value)}
                            style={{ width: '100px' }}
                          />
                          <Button
                            type="button"
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleList(t)}
                          >
                            List for Sale
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted small">
                          {t.date?.substring(0, 10) < today ? 'Expired' : 'Not listable'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <style jsx>{`
        .table th {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 16px;
        }
        
        .table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        
        .badge {
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .text-monospace {
          font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        }
        
        .table-hover tbody tr:hover {
          background-color: rgba(0, 123, 255, 0.05);
        }
      `}</style>
    </div>
  );
}

export default MyTokens;