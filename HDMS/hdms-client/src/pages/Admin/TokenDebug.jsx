import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

function TokenDebug() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/tokens/debug/recent');
      setTokens(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load tokens. Make sure you are logged in as Admin.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied to clipboard: ${text}`);
  };

  const openQRGenerator = (uid) => {
    window.open(`https://www.qr-code-generator.com/?text=${encodeURIComponent(uid)}`, '_blank');
  };

    const resetToken = async (tokenId) => {
      if (!confirm(`Reset token ${tokenId} to Purchased status?\n\nThis will allow it to be scanned again.`)) {
        return;
      }
    
      try {
        const res = await axiosClient.post(`/tokens/debug/reset/${tokenId}`);
        alert(`✓ ${res.data.message}`);
        loadTokens(); // Refresh the list
      } catch (err) {
        console.error(err);
        alert('Failed to reset token. Check console for details.');
      }
    };

  return (
    <div>
      <div className="dashboard-header card border-0 shadow-sm mb-4" 
           style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <h1 className="h4 mb-2">Token Debug - Recent Tokens</h1>
          <p className="mb-0 opacity-75">View recent tokens with their TokenUIDs for QR generation and testing</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Recent 10 Tokens</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={loadTokens}>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
              </div>

              {tokens.length === 0 ? (
                <div className="alert alert-info">
                  No tokens found. Create some tokens first.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Token UID (for QR)</th>
                        <th>Date</th>
                        <th>Meal</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.map((token) => (
                        <tr key={token.id}>
                          <td>
                            <code>{token.id}</code>
                          </td>
                          <td>
                            <code className="small" style={{ fontSize: '0.8rem' }}>
                              {token.tokenUid}
                            </code>
                          </td>
                          <td>{new Date(token.date).toLocaleDateString()}</td>
                          <td>
                            <span className="badge bg-info">{token.mealType}</span>
                          </td>
                          <td>
                            <span className={`badge ${
                              token.status === 'Purchased' ? 'bg-success' : 
                              token.status === 'Redeemed' ? 'bg-secondary' : 
                              'bg-warning'
                            }`}>
                              {token.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm" role="group">
                              <button 
                                className="btn btn-outline-primary" 
                                onClick={() => copyToClipboard(token.tokenUid)}
                                title="Copy UID to clipboard"
                              >
                                <i className="bi bi-clipboard"></i> Copy
                              </button>
                              <button 
                                className="btn btn-outline-success" 
                                onClick={() => openQRGenerator(token.tokenUid)}
                                title="Generate QR code online"
                              >
                                <i className="bi bi-qr-code"></i> Generate QR
                              </button>
                                {token.status === 'Redeemed' && (
                                  <button 
                                    className="btn btn-outline-warning" 
                                    onClick={() => resetToken(token.id)}
                                    title="Reset to Purchased (for testing)"
                                  >
                                    <i className="bi bi-arrow-counterclockwise"></i> Reset
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="alert alert-info mt-4">
                <h6 className="alert-heading">
                  <i className="bi bi-info-circle me-2"></i>
                  How to Test
                </h6>
                <ol className="mb-0">
                  <li>Click <strong>"Copy"</strong> to copy a Token UID</li>
                  <li>Click <strong>"Generate QR"</strong> to open QR generator</li>
                  <li>The UID will be pre-filled in the QR generator</li>
                  <li>Download/print the QR code</li>
                  <li>Go to <strong>/admin/scan</strong> and scan it</li>
                  <li>Watch browser console (F12) for detailed debug logs</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TokenDebug;
