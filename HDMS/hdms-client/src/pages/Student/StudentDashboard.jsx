import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudentDashboard, getFirstTokenAlert } from '../../api/studentApi';
import { getActiveDiningClosures } from '../../api/diningClosureApi';

function StudentDashboard() {
  const [data, setData] = useState(null);
  const [closures, setClosures] = useState([]);
  const [firstTokenAlert, setFirstTokenAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const name = localStorage.getItem('fullName') || 'Student';
  const userCode = localStorage.getItem('userCode') || '';

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [dashboardData, closuresData, tokenAlertData] = await Promise.all([
          getStudentDashboard(),
          getActiveDiningClosures(),
          getFirstTokenAlert()
        ]);
        setData(dashboardData);
        setClosures(closuresData || []);
        setFirstTokenAlert(tokenAlertData);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentTokens = data?.recentTokens || [];
  const wallet = data?.wallet || {};
  const todayMenu = data?.todayMenu || null;

  // Ensure today's date is set (default to today if missing)
  const todayDate = new Date().toISOString().split('T')[0];

  const mapStatusBadge = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s === 'redeemed' || s === 'used') return 'badge bg-success';
    if (s === 'purchased') return 'badge bg-primary';
    if (s === 'listedforsale' || s === 'listed') return 'badge bg-warning';
    if (s === 'sold') return 'badge bg-info';
    if (s === 'cancelled') return 'badge bg-secondary';
    return 'badge bg-secondary';
  };

  return (
    <div>
      {/* Dining Closure Alert */}
      {closures.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-danger border-2 border-danger" role="alert">
              <div className="row align-items-center">
                <div className="col-auto">
                  <i className="bi bi-exclamation-circle-fill" style={{fontSize: '1.5rem'}}></i>
                </div>
                <div className="col">
                  <h5 className="mb-2 fw-bold">⚠️ Dining Temporarily Closed</h5>
                  {closures.map((closure, index) => (
                    <div key={index} className="mb-2">
                      <p className="mb-1">
                        <strong>{closure.reason}</strong>
                      </p>
                      <small className="text-muted">
                        From {new Date(closure.startDate).toLocaleDateString()} to {new Date(closure.endDate).toLocaleDateString()}
                      </small>
                      {closure.description && <p className="mb-0"><small>{closure.description}</small></p>}
                    </div>
                  ))}
                  <p className="mb-0 mt-2"><small className="text-muted">You cannot purchase tokens during this period.</small></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* First Token Gift Alert */}
      {firstTokenAlert?.hasAlert && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-success border-2 border-success" role="alert" style={{ background: 'linear-gradient(135deg, rgba(25, 135, 84, 0.1) 0%, rgba(25, 135, 84, 0.05) 100%)' }}>
              <div className="row align-items-center">
                <div className="col-auto">
                  <i className="bi bi-gift" style={{fontSize: '2rem', color: '#198754'}}></i>
                </div>
                <div className="col">
                  <h5 className="mb-2 fw-bold" style={{color: '#198754'}}>
                    {firstTokenAlert.title}
                  </h5>
                  <p className="mb-1">{firstTokenAlert.message}</p>
                  <p className="mb-1"><strong>{firstTokenAlert.description}</strong></p>
                  <small className="text-muted d-block mb-2">
                    ⏰ Expires in {firstTokenAlert.expiresIn} day{firstTokenAlert.expiresIn !== 1 ? 's' : ''}
                  </small>
                  <small className="text-muted">
                    📧 {firstTokenAlert.reason}
                  </small>
                  <div className="mt-2">
                    <Link to="/student/wallet" className="btn btn-sm btn-success">
                      <i className="bi bi-ticket-perforated me-1"></i>View Your Token
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h1 className="h3 mb-2">Welcome back, {name.split(' ')[0]}! 👋</h1>
                  <p className="mb-0 opacity-75">Here's your dining activity overview</p>
                </div>
                <div className="col-md-4 text-md-end">
                  <div className="bg-white rounded-pill px-3 py-2 d-inline-block text-center">
                    <small className="text-muted">User Code</small>
                    <div className="fw-bold text-dark">{userCode || 'Not set'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid mb-4">
        <div className="stats-card">
          <div className="icon bg-primary bg-opacity-10 text-primary">
            <i className="bi bi-ticket-perforated"></i>
          </div>
          <div className="value">{stats.totalTokens || 0}</div>
          <div className="label">Total Tokens</div>
        </div>

        <div className="stats-card">
          <div className="icon bg-success bg-opacity-10 text-success">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="value">{stats.usedTokens || 0}</div>
          <div className="label">Used Tokens</div>
        </div>

        <div className="stats-card">
          <div className="icon bg-warning bg-opacity-10 text-warning">
            <i className="bi bi-clock"></i>
          </div>
          <div className="value">{stats.activeTokens || 0}</div>
          <div className="label">Active Tokens</div>
        </div>

        <div className="stats-card">
          <div className="icon bg-info bg-opacity-10 text-info">
            <i className="bi bi-wallet2"></i>
          </div>
          <div className="value">৳{Number(wallet.balance || 0).toFixed(2)}</div>
          <div className="label">Wallet Balance</div>
        </div>

        <div className="stats-card">
          <div className="icon bg-secondary bg-opacity-10 text-secondary">
            <i className="bi bi-calendar-month"></i>
          </div>
          <div className="value">{stats.monthlyTokens || 0}</div>
          <div className="label">This Month</div>
        </div>

        <div className="stats-card">
          <div className="icon bg-danger bg-opacity-10 text-danger">
            <i className="bi bi-calendar3"></i>
          </div>
          <div className="value">{stats.yearlyTokens || 0}</div>
          <div className="label">This Year</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-2">
                  <Link to="/student/buy-token" className="btn-prim btn-polish w-100 d-flex align-items-center justify-content-center">
                    <i className="bi bi-plus-circle me-2"></i>
                    Buy Token
                  </Link>
                </div>
                <div className="col-md-2">
                  <Link to="/student/my-tokens" className="btn-ghost btn-polish w-100 d-flex align-items-center justify-content-center">
                    <i className="bi bi-ticket me-2"></i>
                    My Tokens
                  </Link>
                </div>
                <div className="col-md-2">
                  <Link to="/student/market" className="btn-ghost btn-polish w-100 d-flex align-items-center justify-content-center">
                    <i className="bi bi-shop me-2"></i>
                    Marketplace
                  </Link>
                </div>
                <div className="col-md-2">
                  <Link to="/student/wallet" className="btn-ghost btn-polish w-100 d-flex align-items-center justify-content-center">
                    <i className="bi bi-wallet me-2"></i>
                    Wallet
                  </Link>
                </div>
                <div className="col-md-2">
                  <Link to="/student/notices" className="btn-ghost btn-polish w-100 d-flex align-items-center justify-content-center">
                    <i className="bi bi-megaphone me-2"></i>
                    Notices
                  </Link>
                </div>
                <div className="col-md-2">
                  <Link to="/student/complaints" className="btn-ghost btn-polish w-100 d-flex align-items-center justify-content-center">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    Complaints
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-activity me-2"></i>
                Recent Tokens
              </h5>
              <Link to="/student/my-tokens" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="card-body">
              {recentTokens.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Meal</th>
                        <th>Status</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTokens.slice(0, 5).map((token, index) => {
                        const dateVal = token.date;
                        const dateText = dateVal
                          ? new Date(dateVal).toLocaleDateString()
                          : '';
                        const mealType = token.mealType;
                        const status = token.status;
                        return (
                          <tr key={index}>
                            <td>{dateText}</td>
                            <td>
                              <span
                                className={`badge ${
                                  mealType === 'Lunch' ? 'bg-warning' : 'bg-info'
                                }`}
                              >
                                {mealType}
                              </span>
                            </td>
                            <td>
                              <span className={mapStatusBadge(status)}>
                                {status}
                              </span>
                            </td>
                            <td className="fw-bold">
                              ৳{Number(token.price || 0).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <i className="bi bi-ticket"></i>
                  <h6>No tokens yet</h6>
                  <p>Start by purchasing your first meal token</p>
                  <Link to="/student/buy-token" className="btn-prim btn-polish">
                    <i className="bi bi-plus-circle me-1"></i>
                    Buy Your First Token
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-calendar me-2"></i>
                Today's Menu
              </h5>
            </div>
            <div className="card-body">
              {todayMenu ? (
                <>
                  <div className="mb-3">
                    <h6 className="text-warning mb-2">
                      <i className="bi bi-sun me-1"></i>
                      Lunch
                    </h6>
                    <p className="text-muted small mb-1">
                      Available: 12:00 PM - 2:00 PM
                    </p>
                    <p className="mb-0">
                      {(() => {
                        const lunchItems =
                          todayMenu.lunch &&
                          (todayMenu.lunch.items || todayMenu.lunch.Items);
                        return lunchItems && lunchItems.length
                          ? lunchItems.join(', ')
                          : 'No lunch menu available.';
                      })()}
                    </p>
                  </div>
                  <hr />
                  <div>
                    <h6 className="text-info mb-2">
                      <i className="bi bi-moon me-1"></i>
                      Dinner
                    </h6>
                    <p className="text-muted small mb-1">
                      Available: 7:00 PM - 9:00 PM
                    </p>
                    <p className="mb-0">
                      {(() => {
                        const dinnerItems =
                          todayMenu.dinner &&
                          (todayMenu.dinner.items || todayMenu.dinner.Items);
                        return dinnerItems && dinnerItems.length
                          ? dinnerItems.join(', ')
                          : 'No dinner menu available.';
                      })()}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-muted small">
                  Today's menu is not published yet.
                </div>
              )}
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Quick Info
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Monthly Limit:</span>
                <span className="fw-bold">45 tokens</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">This Month:</span>
                <span className="fw-bold text-primary">{stats.monthlyTokens || 0} purchased</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Remaining:</span>
                <span className="fw-bold text-success">{stats.remainingMonthly ?? Math.max(0, 45 - (stats.monthlyTokens || 0))} left</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hall Provost Contact Section */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-person-badge me-2"></i>
                Hall Provost Contact
              </h5>
            </div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h5 className="mb-2 fw-bold">Dr. Md. Abdur Rauf Sarkar</h5>
                  <p className="mb-2 text-primary fw-semibold">Hall Provost</p>
                  <p className="mb-2 text-muted small">
                    Bsc (Hons), MS (RU), MS (Saga University, Japan)<br />
                    PhD (Saga University, Japan)
                  </p>
                  <div className="mt-3">
                    <p className="mb-1">
                      <i className="bi bi-envelope me-2 text-primary"></i>
                      <a href="mailto:rauf.gebt@yahoo.com" className="text-decoration-none">rauf.gebt@yahoo.com</a>
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-envelope me-2 text-primary"></i>
                      <a href="mailto:mar.sarkar@just.edu.bd" className="text-decoration-none">mar.sarkar@just.edu.bd</a>
                    </p>
                    <p className="mb-1 mt-3">
                      <i className="bi bi-telephone me-2 text-primary"></i>
                      <a href="tel:01923027780" className="text-decoration-none">01923027780</a>
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-telephone me-2 text-primary"></i>
                      <a href="tel:01521410152" className="text-decoration-none">01521410152</a>
                    </p>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <img 
                    src="/images/provost.jpg" 
                    alt="Dr. Md. Abdur Rauf Sarkar" 
                    className="rounded-circle shadow"
                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;