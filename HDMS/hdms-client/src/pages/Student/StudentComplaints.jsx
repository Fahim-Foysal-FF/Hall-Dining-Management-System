import { useEffect, useState } from 'react';
import { submitComplaint, getMyComplaints } from '../../api/complaintsApi';
import '../../styles/design-system.css';

function StudentComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' or 'view'
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [trackId, setTrackId] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null
  });

  useEffect(() => {
    if (activeTab === 'view') {
      loadComplaints();
    }
  }, [activeTab]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await getMyComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setErrorMessage('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await submitComplaint(
        formData.title,
        formData.description,
        formData.file
      );

      setSuccessMessage(
        `Complaint submitted successfully! Track ID: ${response.trackId}`
      );
      setTrackId(response.trackId);

      // Reset form
      setFormData({ title: '', description: '', file: null });
      document.getElementById('complaintFile').value = '';

      // Reload complaints after a short delay
      setTimeout(() => {
        setActiveTab('view');
        loadComplaints();
      }, 2000);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setErrorMessage(
        error.response?.data?.message || 'Failed to submit complaint'
      );
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
                Dining Complaints & Support
              </h1>
              <p className="mb-0 opacity-75">
                Submit complaints and track their status
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'submit' ? 'active' : ''}`}
                onClick={() => setActiveTab('submit')}
              >
                <i className="bi bi-pencil me-2"></i>
                Submit Complaint
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'view' ? 'active' : ''}`}
                onClick={() => setActiveTab('view')}
              >
                <i className="bi bi-list-check me-2"></i>
                My Complaints
              </button>
            </li>
          </ul>
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

      {/* Submit Complaint Tab */}
      {activeTab === 'submit' && (
        <div className="row">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-pencil-square me-2"></i>
                  Submit a New Complaint
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      Complaint Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Brief title of your complaint"
                      disabled={loading}
                      required
                    />
                    <small className="text-muted">
                      E.g., Cold food, Poor hygiene, Wrong meal, etc.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      Complaint Details <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your complaint in detail"
                      rows="5"
                      disabled={loading}
                      required
                    ></textarea>
                    <small className="text-muted">
                      Please provide as much detail as possible to help us resolve
                      your issue
                    </small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="complaintFile" className="form-label">
                      Attach File (Optional)
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="complaintFile"
                      onChange={handleFileChange}
                      disabled={loading}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <small className="text-muted">
                      Accepted formats: JPG, PNG, PDF, DOC, DOCX (Max 5MB)
                    </small>
                  </div>

                  {formData.file && (
                    <div className="mb-3">
                      <small className="text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        File selected: {formData.file.name}
                      </small>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Submit Complaint
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm bg-light">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="bi bi-info-circle me-2"></i>
                  Tips
                </h5>
                <ul className="small">
                  <li className="mb-2">
                    Be specific about what went wrong
                  </li>
                  <li className="mb-2">Include the date and time of incident</li>
                  <li className="mb-2">
                    Mention meal type and dining location if possible
                  </li>
                  <li className="mb-2">Attach photos or documents as evidence</li>
                  <li>
                    You will receive a Track ID via email to follow up
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Complaints Tab */}
      {activeTab === 'view' && (
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
                You haven't submitted any complaints yet.
              </div>
            )}

            {!loading &&
              complaints.length > 0 &&
              complaints.map((complaint) => (
                <div key={complaint.id} className="card mb-3 shadow-sm">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <h5 className="card-title mb-2">{complaint.title}</h5>
                        <p className="card-text text-muted small mb-2">
                          Track ID: <strong>{complaint.trackId}</strong>
                        </p>
                        <p className="card-text">{complaint.description}</p>
                        {complaint.fileName && (
                          <p className="small">
                            <i className="bi bi-paperclip me-1"></i>
                            <a href={`http://localhost:5045${complaint.fileUrl}`} target="_blank" rel="noreferrer">
                              {complaint.fileName}
                            </a>
                          </p>
                        )}
                      </div>
                      <div className="col-md-4">
                        <div className="mb-2">
                          <span className={getStatusBadge(complaint.status)}>
                            {complaint.status}
                          </span>
                        </div>
                        <small className="text-muted d-block mb-1">
                          Submitted: {new Date(complaint.createdAt).toLocaleDateString()}
                        </small>
                        {complaint.resolvedAt && (
                          <small className="text-muted d-block">
                            Resolved: {new Date(complaint.resolvedAt).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    </div>

                    {complaint.adminResponse && (
                      <div className="mt-3 p-3 bg-light border-start border-3 border-info">
                        <strong className="small">Admin Response:</strong>
                        <p className="small mt-2 mb-0">
                          {complaint.adminResponse}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentComplaintsPage;
