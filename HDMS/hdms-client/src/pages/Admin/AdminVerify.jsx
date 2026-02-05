
import { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

function AdminVerify() {
  const [tokenId, setTokenId] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState(null);

  const parseTokenId = () => {
    const parsed = parseInt(tokenId, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const loadDetails = async () => {
    const parsedId = parseTokenId();
    if (!parsedId) {
      setMsg('Please enter a valid token ID.');
      setDetails(null);
      return;
    }

    setDetailsLoading(true);
    setMsg('');
    try {
      const res = await axiosClient.get('/tokens/scan', { params: { tokenId: parsedId } });
      setDetails(res.data);
      setMsg('Token details loaded.');
    } catch (err) {
      console.error(err);
      setDetails(null);
      if (err.response && err.response.data) {
        setMsg(typeof err.response.data === 'string' ? err.response.data : 'Failed to load token details.');
      } else {
        setMsg('Network error while loading token details.');
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleVerify = async () => {
    const parsedId = parseTokenId();
    if (!parsedId) {
      setMsg('Please enter a valid token ID.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      // Assume there's an API endpoint for redeeming a token by ID
      const res = await axiosClient.post('/tokens/redeem', { tokenId: parsedId });
      setMsg(res.data?.message || 'Token redeemed successfully.');
      setDetails(res.data);
      setTokenId('');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMsg(typeof err.response.data === 'string' ? err.response.data : 'Failed to redeem token.');
      } else {
        setMsg('Network error.');
      }
    } finally {
      setLoading(false);
    }
  };

  const tokenInfo = details ? details.token || details.Token : null;
  const studentInfo = details ? details.student || details.Student : null;
  const mealInfo = details ? details.meal || details.Meal : null;

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

  return (
    <div>
      {/* Gradient header */}
      <div className="dashboard-header card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="h4 mb-2">Manual Token Verification</h1>
              <p className="mb-0 opacity-75">Check token details and redeem manually</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="p-4 mb-4" title={null}>
        {msg && <div className="alert alert-info mb-3">{msg}</div>}
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <label className="form-label">Token ID</label>
            <input
              type="number"
              className="form-control"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="Enter token ID to inspect"
            />
          </div>
          <div className="col-md-6 d-flex gap-2">
            <Button onClick={loadDetails} disabled={detailsLoading || loading}>
              {detailsLoading ? 'Loading details...' : 'Load Token Details'}
            </Button>
            <Button onClick={handleVerify} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Redeem'}
            </Button>
          </div>
        </div>
      </Card>

      {tokenInfo && (
        <Card className="p-4" title="Token Details">
          <div className="row g-4">
            <div className="col-md-6">
              <h6 className="text-uppercase text-muted mb-2">Token Information</h6>
              <div className="mb-1"><strong>ID:</strong> {tokenInfo.id}</div>
              <div className="mb-1"><strong>UID:</strong> {tokenInfo.tokenUid || tokenInfo.tokenUID || '—'}</div>
              <div className="mb-1"><strong>Date:</strong> {formatDate(tokenInfo.date)}</div>
              <div className="mb-1"><strong>Slot:</strong> {tokenInfo.mealType || '—'}</div>
              <div className="mb-1"><strong>Price:</strong> ৳{tokenInfo.price ?? '—'}</div>
              <div className="mb-1"><strong>Status:</strong> {tokenInfo.status || '—'}</div>
            </div>

            <div className="col-md-6">
              <h6 className="text-uppercase text-muted mb-2">Redemption</h6>
              <div className="mb-1"><strong>Redeemed at:</strong> {formatDateTime(tokenInfo.redeemedAt)}</div>
              <div className="mb-1"><strong>Preference:</strong> {tokenInfo.mealPreference || 'Not set'}</div>
            </div>
          </div>

          <hr className="my-4" />

          <div className="row g-4">
            <div className="col-md-6">
              <h6 className="text-uppercase text-muted mb-2">Student Information</h6>
              <div className="mb-1"><strong>Name:</strong> {studentInfo ? studentInfo.fullName : '—'}</div>
              <div className="mb-1"><strong>Email:</strong> {studentInfo ? studentInfo.email : '—'}</div>
              <div className="mb-1"><strong>User Code:</strong> {studentInfo ? studentInfo.userCode : '—'}</div>
            </div>
            <div className="col-md-6">
              <h6 className="text-uppercase text-muted mb-2">Meal Details</h6>
              <div className="mb-1"><strong>Date:</strong> {mealInfo?.date || '—'}</div>
              <div className="mb-1"><strong>Slot:</strong> {mealInfo?.slot || '—'}</div>
              <div className="mb-1"><strong>Items:</strong> {mealInfo?.itemsText || 'No menu found for this slot.'}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default AdminVerify;