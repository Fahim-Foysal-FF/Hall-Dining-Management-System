import React, { useState, useEffect } from 'react';
import { 
  getFlaggedUsers, 
  analyzeUser, 
  suspendUser, 
  getSuspensions, 
  revokeSuspension,
  blockUser,
  unblockUser,
  getAllUsers,
  getAbuseLogs 
} from '../../api/userModerationApi';

function UserModeration() {
  const [activeTab, setActiveTab] = useState('flagged');
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [suspensions, setSuspensions] = useState([]);
  const [abuseLogs, setAbuseLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Suspension form
  const [suspensionForm, setSuspensionForm] = useState({
    userId: '',
    durationWeeks: 1,
    reason: '',
    details: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  // Block form
  const [blockForm, setBlockForm] = useState({
    userId: '',
    reason: '',
    details: '',
    isPermanent: false,
    durationWeeks: 1
  });
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'flagged') {
        const data = await getFlaggedUsers();
        setFlaggedUsers(data);
      } else if (activeTab === 'suspensions') {
        const data = await getSuspensions(false);
        setSuspensions(data);
      } else if (activeTab === 'block') {
        const data = await getAllUsers(searchTerm);
        setAllUsers(data);
      } else if (activeTab === 'logs') {
        const data = await getAbuseLogs(false);
        setAbuseLogs(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeUser = async (userId) => {
    try {
      const analysis = await analyzeUser(userId);
      alert(`Analysis for user:\n\nAbuse Score: ${analysis.abuseScore}\nRisk Level: ${analysis.riskLevel}\nSuggested Duration: ${analysis.suggestedSuspensionWeeks} weeks\n\nReasons:\n${analysis.reasons.join('\n')}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze user');
    }
  };

  const handleOpenSuspendModal = (user) => {
    setSelectedUser(user);
    setSuspensionForm({
      userId: user.userId,
      durationWeeks: user.suggestedSuspensionWeeks || 1,
      reason: user.primaryReason || '',
      details: `AI-detected abuse. Score: ${user.abuseScore}`
    });
    setShowSuspendModal(true);
  };

  const handleSuspendUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await suspendUser(suspensionForm);
      setSuccess(`User suspended for ${suspensionForm.durationWeeks} week(s)`);
      setShowSuspendModal(false);
      loadData();
      setSuspensionForm({ userId: '', durationWeeks: 1, reason: '', details: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to suspend user');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSuspension = async (suspensionId) => {
    if (!confirm('Are you sure you want to revoke this suspension?')) return;
    
    const reason = prompt('Enter reason for revoking suspension:');
    if (!reason) return;

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await revokeSuspension(suspensionId, reason);
      setSuccess('Suspension revoked successfully');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke suspension');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBlockModal = (user) => {
    setSelectedUser(user);
    setBlockForm({
      userId: user.userId || user.id,
      reason: '',
      details: '',
      isPermanent: false,
      durationWeeks: 2
    });
    setShowBlockModal(true);
  };

  const handleBlockUser = async (e) => {
    e.preventDefault();
    if (!blockForm.reason.trim()) {
      setError('Reason is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await blockUser(blockForm);
      setSuccess(`User blocked ${blockForm.isPermanent ? 'permanently' : `for ${blockForm.durationWeeks} week(s)`}`);
      setShowBlockModal(false);
      loadData();
      setBlockForm({ userId: '', reason: '', details: '', isPermanent: false, durationWeeks: 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to block user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (userId, suspensionId) => {
    const reason = prompt('Enter reason for unblocking:');
    if (!reason) return;

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await unblockUser(userId, reason);
      setSuccess('User unblocked successfully');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unblock user');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (activeTab === 'block') {
      loadData();
    }
  };

  const handleBlockUserFromList = (user) => {
    setSelectedUser(user);
    setBlockForm({
      userId: user.id,
      reason: '',
      details: '',
      isPermanent: false,
      durationWeeks: 2
    });
    setShowBlockModal(true);
  };

  const getRiskColor = (score) => {
    if (score >= 75) return 'danger';
    if (score >= 50) return 'warning';
    if (score >= 25) return 'info';
    return 'secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col">
          <h2 className="h3">🤖 AI User Moderation - Complaint & Support Abuse Detection</h2>
          <p className="text-muted">AI-powered detection and suspension for complaint/support spam and abuse</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'flagged' ? 'active' : ''}`}
            onClick={() => setActiveTab('flagged')}
          >
            🚩 Flagged Users
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'suspensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suspensions')}
          >
            🔒 Suspensions
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'block' ? 'active' : ''}`}
            onClick={() => setActiveTab('block')}
          >
            ⛔ Manual Block
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📊 Abuse Logs
          </button>
        </li>
      </ul>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Flagged Users Tab */}
      {!loading && activeTab === 'flagged' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">🔍 AI-Detected Abusive Users</h5>
            </div>
            <div className="card-body">
              {flaggedUsers.length === 0 ? (
                <p className="text-muted">No flagged users at this time. The system is clean! ✅</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Abuse Score</th>
                        <th>Risk Level</th>
                        <th>Suggested Duration</th>
                        <th>Primary Reason</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flaggedUsers.map((user) => (
                        <tr key={user.userId}>
                          <td>
                            <strong>{user.fullName || 'N/A'}</strong>
                            <br />
                            <small className="text-muted">{user.userId}</small>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge bg-${getRiskColor(user.abuseScore)}`}>
                              {user.abuseScore.toFixed(1)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${getRiskColor(user.abuseScore)}`}>
                              {user.riskLevel}
                            </span>
                          </td>
                          <td>
                            <strong>{user.suggestedSuspensionWeeks}</strong> week(s)
                          </td>
                          <td>
                            <small>{user.primaryReason}</small>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info me-2"
                              onClick={() => handleAnalyzeUser(user.userId)}
                              title="View detailed analysis"
                            >
                              🔍 Analyze
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleOpenSuspendModal(user)}
                              title="Suspend this user"
                            >
                              🔒 Suspend
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="card mt-3">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">ℹ️ About AI Detection</h6>
              <p className="small mb-2">The AI system monitors <strong>complaint and support abuse</strong>:</p>
              <ul className="small">
                <li><strong>24-hour complaints:</strong> {'>'}5 complaints = 30 pts, {'>'}3 = 15 pts</li>
                <li><strong>Weekly complaints:</strong> {'>'}15 complaints = 25 pts, {'>'}10 = 12 pts</li>
                <li><strong>Duplicate complaints:</strong> Similar content detected = 20 pts</li>
                <li><strong>Historical abuse:</strong> Past complaint violations (last 30 days)</li>
                <li><strong>Prior suspensions:</strong> Previous complaint-related suspensions = 15 pts each</li>
              </ul>
              <p className="small mb-0">
                <strong>Score Threshold:</strong> Users with abuse score ≥25 are automatically flagged for complaint/support spam.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Suspensions Tab */}
      {!loading && activeTab === 'suspensions' && (
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">🔒 Active & Past Suspensions</h5>
          </div>
          <div className="card-body">
            {suspensions.length === 0 ? (
              <p className="text-muted">No suspensions found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Suspended At</th>
                      <th>Suspended Until</th>
                      <th>Status</th>
                      <th>AI Detected</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspensions.map((suspension) => (
                      <tr key={suspension.id} className={suspension.isActive ? 'table-danger' : ''}>
                        <td>
                          <strong>{suspension.user?.fullName || 'N/A'}</strong>
                          <br />
                          <small className="text-muted">{suspension.user?.email}</small>
                        </td>
                        <td>
                          <strong>{suspension.durationWeeks}</strong> week(s)
                        </td>
                        <td>
                          <strong>{suspension.reason}</strong>
                          {suspension.details && (
                            <>
                              <br />
                              <small className="text-muted">{suspension.details}</small>
                            </>
                          )}
                        </td>
                        <td>{formatDate(suspension.suspendedAt)}</td>
                        <td>{formatDate(suspension.suspendedUntil)}</td>
                        <td>
                          {suspension.isActive ? (
                            <span className="badge bg-danger">Active</span>
                          ) : suspension.revokedAt ? (
                            <span className="badge bg-warning">Revoked</span>
                          ) : (
                            <span className="badge bg-success">Expired</span>
                          )}
                        </td>
                        <td>
                          {suspension.isAIDetected ? (
                            <span className="badge bg-info">🤖 AI</span>
                          ) : (
                            <span className="badge bg-secondary">Manual</span>
                          )}
                        </td>
                        <td>
                          {suspension.isActive && (
                            <>
                              <button
                                className="btn btn-sm btn-warning me-2"
                                onClick={() => handleRevokeSuspension(suspension.id)}
                                title="Revoke suspension early"
                              >
                                ✅ Revoke
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleUnblockUser(suspension.userId, suspension.id)}
                                title="Unblock user"
                              >
                                ⛔ Unblock
                              </button>
                            </>
                          )}
                          {suspension.revokedAt && (
                            <small className="text-muted">
                              Revoked: {suspension.revocationReason}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Block Tab */}
      {!loading && activeTab === 'block' && (
        <div>
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="card-title mb-0">⛔ Manual User Block</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-8">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, email, user code, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={handleSearchUsers}
                    >
                      🔍 Search
                    </button>
                  </div>
                </div>
                <div className="col-md-4">
                  <button 
                    className="btn btn-success w-100"
                    onClick={() => {
                      setBlockForm({ userId: '', reason: '', details: '', isPermanent: false, durationWeeks: 1 });
                      setShowBlockModal(true);
                    }}
                  >
                    ➕ Block User Manually
                  </button>
                </div>
              </div>

              {allUsers.length === 0 ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Use the search box above to find users, or click "Block User Manually" to enter a user ID directly.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>User Code</th>
                        <th>Department</th>
                        <th>Hall/Room</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user) => (
                        <tr key={user.id} className={user.isSuspended ? 'table-danger' : ''}>
                          <td>
                            <strong>{user.fullName}</strong>
                            <br />
                            <small className="text-muted">{user.id}</small>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className="badge bg-secondary">{user.userCode}</span>
                          </td>
                          <td>
                            <small>{user.department || 'N/A'}</small>
                          </td>
                          <td>
                            <small>
                              {user.hallName ? `${user.hallName} - ${user.roomNumber || 'N/A'}` : 'N/A'}
                            </small>
                          </td>
                          <td>
                            {user.isSuspended ? (
                              <span className="badge bg-danger">🔒 Blocked</span>
                            ) : (
                              <span className="badge bg-success">✓ Active</span>
                            )}
                          </td>
                          <td>
                            {!user.isSuspended ? (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleBlockUserFromList(user)}
                                title="Block this user"
                              >
                                ⛔ Block
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleUnblockUser(user.id)}
                                title="Unblock this user"
                              >
                                ✅ Unblock
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allUsers.length === 100 && (
                    <div className="alert alert-warning mt-2">
                      <small>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Showing first 100 users. Use search to find specific users.
                      </small>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h6>📋 How to Block Users</h6>
              <ul className="small mb-0">
                <li><strong>Temporary Block:</strong> User is blocked for selected weeks (1-10) and can use platform again after expiry</li>
                <li><strong>Permanent Block:</strong> User is blocked indefinitely and can only be unblocked by admin manual intervention</li>
                <li><strong>Reason:</strong> Required field describing why the user is being blocked</li>
                <li><strong>Details:</strong> Optional field for additional notes</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Abuse Logs Tab */}
      {!loading && activeTab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">📊 Abuse Detection Logs</h5>
          </div>
          <div className="card-body">
            {abuseLogs.length === 0 ? (
              <p className="text-muted">No abuse logs found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Detected At</th>
                      <th>User</th>
                      <th>Action Type</th>
                      <th>Description</th>
                      <th>Severity</th>
                      <th>Score</th>
                      <th>Reviewed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abuseLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{formatDate(log.detectedAt)}</td>
                        <td>
                          <small>{log.user?.fullName || 'N/A'}</small>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{log.actionType}</span>
                        </td>
                        <td>
                          <small>{log.description}</small>
                        </td>
                        <td>
                          <span className={`badge bg-${log.severity >= 7 ? 'danger' : log.severity >= 4 ? 'warning' : 'info'}`}>
                            {log.severity}/10
                          </span>
                        </td>
                        <td>
                          <strong>{log.abuseScore.toFixed(1)}</strong>
                        </td>
                        <td>
                          {log.isReviewed ? (
                            <span className="badge bg-success">✓</span>
                          ) : (
                            <span className="badge bg-warning">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">🔒 Suspend User</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowSuspendModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSuspendUser}>
                <div className="modal-body">
                  {selectedUser && (
                    <div className="alert alert-info">
                      <strong>User:</strong> {selectedUser.fullName || selectedUser.email}
                      <br />
                      <strong>Abuse Score:</strong> {selectedUser.abuseScore}
                      <br />
                      <strong>AI Suggestion:</strong> {selectedUser.suggestedSuspensionWeeks} week(s)
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Duration (weeks) *</label>
                    <select 
                      className="form-select"
                      value={suspensionForm.durationWeeks}
                      onChange={(e) => setSuspensionForm({ ...suspensionForm, durationWeeks: parseInt(e.target.value) })}
                      required
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(week => (
                        <option key={week} value={week}>
                          {week} week{week > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Reason *</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={suspensionForm.reason}
                      onChange={(e) => setSuspensionForm({ ...suspensionForm, reason: e.target.value })}
                      placeholder="e.g., Excessive marketplace spam"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Additional Details</label>
                    <textarea 
                      className="form-control"
                      rows="3"
                      value={suspensionForm.details}
                      onChange={(e) => setSuspensionForm({ ...suspensionForm, details: e.target.value })}
                      placeholder="Optional additional information..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowSuspendModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    {loading ? 'Suspending...' : '🔒 Suspend User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">⛔ Block User</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowBlockModal(false)}
                ></button>
              </div>
              <form onSubmit={handleBlockUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">User ID or Email *</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={blockForm.userId}
                      onChange={(e) => setBlockForm({ ...blockForm, userId: e.target.value })}
                      placeholder="Enter user ID or email"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Reason *</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={blockForm.reason}
                      onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                      placeholder="e.g., Abusive behavior, spam, harassment"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Additional Details</label>
                    <textarea 
                      className="form-control"
                      rows="3"
                      value={blockForm.details}
                      onChange={(e) => setBlockForm({ ...blockForm, details: e.target.value })}
                      placeholder="Optional notes about the block..."
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input 
                        className="form-check-input"
                        type="checkbox"
                        id="isPermanent"
                        checked={blockForm.isPermanent}
                        onChange={(e) => setBlockForm({ ...blockForm, isPermanent: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="isPermanent">
                        <strong>Permanent Block</strong> (indefinite)
                      </label>
                    </div>
                    <small className="text-muted d-block mt-2">
                      If unchecked, select duration below
                    </small>
                  </div>

                  {!blockForm.isPermanent && (
                    <div className="mb-3">
                      <label className="form-label">Block Duration (weeks)</label>
                      <select 
                        className="form-select"
                        value={blockForm.durationWeeks}
                        onChange={(e) => setBlockForm({ ...blockForm, durationWeeks: parseInt(e.target.value) })}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(week => (
                          <option key={week} value={week}>
                            {week} week{week > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowBlockModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    {loading ? 'Blocking...' : '⛔ Block User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserModeration;
