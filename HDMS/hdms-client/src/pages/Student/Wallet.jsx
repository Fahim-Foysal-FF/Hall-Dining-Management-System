import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getWallet } from '../../api/ordersApi';
import { initiatePayment } from '../../api/paymentApi';
import Card from '../../components/ui/Card';

function Wallet() {
  const location = useLocation();
  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  const loadWallet = async () => {
    try {
      const data = await getWallet();
      setBalance(Number(data.balance ?? data.Balance ?? 0));
      setTxns(data.transactions ?? data.Transactions ?? []);
    } catch (err) {
      console.error(err);
      setMsg('Failed to load wallet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();

    // Check for payment status in URL
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    const amount = params.get('amount');

    if (paymentStatus === 'success') {
      setMsg(`✅ Payment successful! ৳${amount || '0.00'} added to your wallet.`);
      // Reload wallet data after successful payment
      loadWallet();
      // Clear the URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setMsg(''), 5000);
    } else if (paymentStatus === 'failed') {
      setMsg('❌ Payment failed. Please try again.');
      // Reload wallet data to show failed transaction
      loadWallet();
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setMsg(''), 5000);
    } else if (paymentStatus === 'cancelled') {
      setMsg('⚠️ Payment was cancelled.');
      // Reload wallet data to show cancelled transaction
      loadWallet();
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setMsg(''), 5000);
    }
  }, [location]);

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    
    if (!amount || amount <= 0) {
      setMsg('Please enter a valid amount');
      return;
    }

    if (amount > 10000) {
      setMsg('Maximum top-up amount is ৳10,000');
      return;
    }

    setTopupLoading(true);
    setMsg('');

    try {
      const response = await initiatePayment(amount);
      
      if (response.success && response.gatewayUrl) {
        // Redirect to SSLCOMMERZ payment gateway
        window.location.href = response.gatewayUrl;
      } else {
        setMsg(response.message || 'Failed to initiate payment');
      }
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setTopupLoading(false);
    }
  };

  if (loading) return <p>Loading wallet...</p>;

  return (
    <div>
      <h3>My Wallet</h3>
      
      {msg && (
        <div className={`alert ${msg.includes('✅') ? 'alert-success' : msg.includes('❌') ? 'alert-danger' : 'alert-warning'} mb-3`}>
          {msg}
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-6">
          <Card>
            <div className="d-flex justify-content-between align-items-center">
              <div className="muted">Current Balance</div>
              <div style={{fontSize: '1.5rem', fontWeight: 700, color: '#28a745'}}>
                ৳ {balance.toFixed(2)}
              </div>
            </div>
          </Card>
        </div>

        <div className="col-md-6">
          <Card>
            <h6 className="mb-3">Top-up Wallet via SSLCOMMERZ</h6>
            <div className="input-group mb-2">
              <span className="input-group-text">৳</span>
              <input
                type="number"
                className="form-control"
                placeholder="Enter amount (1-10000)"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                min="1"
                max="10000"
                step="1"
                disabled={topupLoading}
              />
            </div>
            <button
              className="btn btn-primary w-100"
              onClick={handleTopup}
              disabled={topupLoading || !topupAmount}
            >
              {topupLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-credit-card me-2"></i>
                  Pay with SSLCOMMERZ
                </>
              )}
            </button>
            <small className="text-muted d-block mt-2">
              <i className="bi bi-shield-check me-1"></i>
              Secure payment via SSLCOMMERZ Sandbox
            </small>
          </Card>
        </div>
      </div>

      <h5 className="mb-3">Transaction History</h5>
      <table className="table table-sm table-hover">
        <thead className="table-light">
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Ref</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {txns.length === 0 && (
            <tr>
              <td colSpan="5" className="text-muted text-center py-4">
                No transactions yet
              </td>
            </tr>
          )}
          {txns.map((t) => {
            const amt = Number(t.amount ?? t.Amount ?? 0);
            const created = t.createdAt ?? t.CreatedAt;
            const createdStr =
              created && created.substring ? created.substring(0, 16).replace('T', ' ') : '';
            return (
              <tr key={t.id ?? t.Id}>
                <td>{createdStr}</td>
                <td>
                  <span className={`badge ${t.type?.includes('TOPUP') ? 'bg-success' : t.type?.includes('FAILED') ? 'bg-danger' : t.type?.includes('CANCELLED') ? 'bg-warning' : 'bg-info'}`}>
                    {t.type ?? t.Type}
                  </span>
                </td>
                <td className={amt > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                  {amt > 0 ? '+' : ''}৳ {amt.toFixed(2)}
                </td>
                <td><small className="text-muted">{t.ref ?? t.Ref ?? '—'}</small></td>
                <td>{t.description ?? t.Description ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Wallet;