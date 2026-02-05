import { useEffect, useState } from 'react';
import { getAdminComplaints, updateComplaint } from '../../api/complaintsApi';
import '../../styles/design-system.css';

function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadComplaints();
  }, [filterStatus]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await getAdminComplaints(filterStatus);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setErrorMessage('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setResponseText(complaint.adminResponse || '');
  };

  const handleCloseDetail = () => {
    setSelectedComplaint(null);
    setResponseText('');
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedComplaint) return;

    try {
      setLoading(true);
      await updateComplaint(selectedComplaint.id, newStatus, responseText);
      setSuccessMessage('Complaint updated successfully');
      handleCloseDetail();
      loadComplaints();
    } catch (error) {
      console.error('Error updating complaint:', error);
      setErrorMessage('Failed to update complaint');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: 'badge bg-warning',
      'In Progress': 'badge bg-info',
      Resolved: 'badge bg-success',
      Rejected: 'badge bg-danger'
    };
    return badges[status] || 'badge bg-secondary';
  };

  return (
    <div>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div
            className="card border-0 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <div className="card-body p-4">
              <h1 className="h3 mb-2">
                <i className="bi bi-exclamation-circle me-2"></i>
                Student Complaints Management
              </h1>
              <p className="mb-0 opacity-75">
                Review and respond to student complaints
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage('')}
          ></button>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {errorMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setErrorMessage('')}
          ></button>
        </div>
      )}

      {/* Filter */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <label className="form-label">Filter by Status:</label>
              <div className="btn-group" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="status"
                  id="statusAll"
                  value=""
                  checked={filterStatus === ''}
                  onChange={(e) => setFilterStatus(e.target.value)}
                />
                <label className="btn btn-outline-primary" htmlFor="statusAll">
                  All
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="status"
                  id="statusPending"
                  value="Pending"
                  checked={filterStatus === 'Pending'}
                  onChange={(e) => setFilterStatus(e.target.value)}
                />
                <label className="btn btn-outline-primary" htmlFor="statusPending">
                  Pending
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="status"
                  id="statusInProgress"
                  value="In Progress"
                  checked={filterStatus === 'In Progress'}
                  onChange={(e) => setFilterStatus(e.target.value)}
                />
                <label
                  className="btn btn-outline-primary"
                  htmlFor="statusInProgress"
                >
                  In Progress
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="status"
                  id="statusResolved"
                  value="Resolved"
                  checked={filterStatus === 'Resolved'}
                  onChange={(e) => setFilterStatus(e.target.value)}
                />
                <label className="btn btn-outline-primary" htmlFor="statusResolved">
                  Resolved
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="status"
                  id="statusRejected"
                  value="Rejected"
                  checked={filterStatus === 'Rejected'}
                  onChange={(e) => setFilterStatus(e.target.value)}
                />
                <label className="btn btn-outline-primary" htmlFor="statusRejected">
                  Rejected
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="row">
        <div className="col-12">
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {!loading && complaints.length === 0 && (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No complaints found with the selected filter.
            </div>
          )}

          {!loading &&
            complaints.length > 0 &&
            complaints.map((complaint) => (
              <div key={complaint.id} className="card mb-3 shadow-sm">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-9">
                      <h5 className="card-title">
                        {complaint.title}
                        <span className={`ms-2 ${getStatusBadge(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </h5>
                      <p className="card-text text-muted small mb-2">
                        <strong>Track ID:</strong> {complaint.trackId}
                        <span className="ms-3">
                          <strong>Student:</strong> {complaint.studentName}
                        </span>
                      </p>
                      <p className="card-text">
                        {complaint.description.substring(0, 200)}
                        {complaint.description.length > 200 ? '...' : ''}
                      </p>
                      <small className="text-muted">
                        <i className="bi bi-calendar me-1"></i>
                        Submitted: {new Date(complaint.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="col-md-3">
                      <button
                        className="btn btn-sm btn-primary w-100"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        View & Respond
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedComplaint && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedComplaint.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseDetail}
                ></button>
              </div>
              <div className="modal-body">
                <p className="small text-muted">
                  <strong>Track ID:</strong> {selectedComplaint.trackId}
                  <span className="ms-3">
                    <strong>Status:</strong>{' '}
                    <span className={getStatusBadge(selectedComplaint.status)}>
                      {selectedComplaint.status}
                    </span>
                  </span>
                </p>

                <p className="small text-muted mb-3">
                  <strong>Student:</strong> {selectedComplaint.studentName} (
                  {selectedComplaint.studentEmail})
                </p>

                <h6 className="mt-3">Complaint Details:</h6>
                <div
                  className="bg-light p-3 rounded mb-3"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {selectedComplaint.description}
                </div>

                {selectedComplaint.fileName && (
                  <p className="small mb-3">
                    <i className="bi bi-paperclip me-1"></i>
                    <a
                      href={`http://localhost:5045${selectedComplaint.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selectedComplaint.fileName}
                    </a>
                  </p>
                )}

                <h6 className="mt-4 mb-2">Admin Response:</h6>
                <textarea
                  className="form-control"
                  rows="4"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response to the student..."
                  disabled={loading}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDetail}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => handleUpdateStatus('In Progress')}
                  disabled={loading}
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleUpdateStatus('Rejected')}
                  disabled={loading}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => handleUpdateStatus('Resolved')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Mark Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminComplaints;
