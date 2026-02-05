
import { useEffect, useState } from 'react';
import { searchWallets, topupWallet, revalidatePendingTransaction, getPendingTransactions } from '../../api/adminWalletsApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

function AdminWallets() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [revalidating, setRevalidating] = useState(null);

  const load = async (q) => {
    setLoading(true);
    setMsg('');
    try {
      const data = await searchWallets(q);
      setUsers(data);
    } catch (err) {
      console.error(err);
      setMsg('Failed to load wallets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
    loadPendingTransactions();
  }, []);

  const loadPendingTransactions = async () => {
    try {
      const data = await getPendingTransactions();
      setPendingTransactions(data);
    } catch (err) {
      console.error('Failed to load pending transactions:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    load(query);
  };

  const handleClear = () => {
    setQuery('');
    load('');
  };

  const handleAmountChange = (userId, value) => {
    setAmounts((prev) => ({
      ...prev,
      [userId]: value
    }));
  };

  const handleTopup = async (user) => {
    const a = parseFloat(amounts[user.id]);
    if (isNaN(a) || a <= 0) {
    setMsg('Enter a positive amount.');
    return;
    }
    setMsg('');
    try {
      await topupWallet({
        userId: user.id,
        amount: a,
        description: 'Admin top-up'
      });
      setMsg('Wallet updated.');
      setAmounts((prev) => ({ ...prev, [user.id]: '' }));
      await load(query);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMsg(
          typeof err.response.data === 'string'
            ? err.response.data
            : 'Failed to top up wallet.'
        );
      } else {
        setMsg('Failed to top up wallet (network).');
      }
    }
  };

  const handleRevalidate = async (transactionId) => {
    setRevalidating(transactionId);
    try {
      const response = await revalidatePendingTransaction(transactionId);
      setMsg(`✓ Transaction revalidated: ${response.amount} BDT added to wallet`);
      // Remove from pending list
      setPendingTransactions((prev) =>
        prev.filter((t) => t.transactionId !== transactionId)
      );
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMsg(
          typeof err.response.data === 'string'
            ? err.response.data
            : 'Failed to revalidate transaction.'
        );
      } else {
        setMsg('Failed to revalidate transaction (network).');
      }
    } finally {
      setRevalidating(null);
    }
  };

  return (
    <div>
      {/* Gradient header */}
      <div className="dashboard-header card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="h4 mb-2">Wallets (Admin)</h1>
              <p className="mb-0 opacity-75">Search, view, and top-up user wallets</p>
            </div>
            <div className="col-md-4 text-end">
              <Button
                type="button"
                className={`btn-sm ${showPending ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setShowPending(!showPending)}
              >
                {showPending ? 'Hide' : 'Show'} Pending Transactions
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showPending && (
        <Card className="p-4 mb-4 border-warning">
          <h5 className="mb-3">
            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
            Pending TOPUP Transactions
          </h5>
          {pendingTransactions.length === 0 ? (
            <p className="text-muted mb-0">No pending transactions found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th className="text-end">Amount</th>
                    <th>Created At</th>
                    <th>Status</th>
                    <th style={{ width: 120 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTransactions.map((txn) => (
                    <tr key={txn.transactionId} className="border-warning">
                      <td>
                        <code className="text-warning">{txn.transactionId}</code>
                      </td>
                      <td className="text-end fw-bold">৳ {txn.amount.toFixed(2)}</td>
                      <td>
                        <small>{new Date(txn.createdAt).toLocaleString()}</small>
                      </td>
                      <td>
                        <span className="badge bg-warning text-dark">PENDING</span>
                      </td>
                      <td>
                        <Button
                          type="button"
                          className="btn-sm btn-success"
                          onClick={() => handleRevalidate(txn.transactionId)}
                          disabled={revalidating === txn.transactionId}
                        >
                          {revalidating === txn.transactionId ? 'Processing...' : 'Revalidate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card className="p-4 mb-4">
        {msg && <div className="alert alert-info mb-3">{msg}</div>}
        <form className="row g-2 align-items-center mb-3" onSubmit={handleSearch}>
          <div className="col-sm-6">
            <input
              type="text"
              className="form-control"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID (MMH...), name, email, phone, hall"
              autoFocus
            />
          </div>
          <div className="col-auto">
            <Button type="submit">Search</Button>
          </div>
          <div className="col-auto">
            <Button type="button" className="btn-polish btn-outline" onClick={handleClear}>Clear</Button>
          </div>
          <div className="col-auto text-muted">
            {users.length > 0 && `Showing ${users.length} user${users.length === 1 ? '' : 's'}`}
          </div>
        </form>
        {loading ? (
          <div className="text-center text-muted py-4">Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Hall</th>
                  <th className="text-end">Balance</th>
                  <th style={{ width: 300 }}>Top-up</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-muted">
                      No users found.
                    </td>
                  </tr>
                )}
                {users.map((u) => {
                  const balance = Number(u.walletBalance ?? u.WalletBalance ?? 0);
                  return (
                    <tr key={u.id}>
                      <td>
                        <span className="badge bg-secondary">
                          {u.userCode ?? u.UserCode ?? ''}
                        </span>
                      </td>
                      <td>{u.fullName ?? u.FullName}</td>
                      <td>{u.email ?? u.Email}</td>
                      <td>{(u.phone ?? u.Phone) || '—'}</td>
                      <td>{(u.hall ?? u.Hall) || '—'}</td>
                      <td className="text-end">
                        <span className="fw-bold">৳ {balance.toFixed(2)}</span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-control form-control-sm"
                            placeholder="Amount"
                            value={amounts[u.id] ?? ''}
                            onChange={(e) => handleAmountChange(u.id, e.target.value)}
                          />
                          <Button type="button" className="btn-sm" onClick={() => handleTopup(u)}>
                            Top-up
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default AdminWallets;