import { useEffect, useState } from 'react';
import {
  createNotice,
  getAllNotices,
  updateNotice,
  toggleNoticeStatus,
  deleteNotice
} from '../../api/noticesApi';
import '../../styles/design-system.css';

function AdminNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expiresAt: '',
    file: null,
    existingFileName: '',
    existingFileUrl: ''
  });

  useEffect(() => {
    loadNotices();
  }, [page]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const data = await getAllNotices(page, pageSize);
      setNotices(data.notices || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error loading notices:', error);
      setErrorMessage('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.title.trim() || !formData.content.trim()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const expiresIso = formData.expiresAt
        ? new Date(formData.expiresAt).toISOString()
        : null;

      if (editingId) {
        await updateNotice(
          editingId,
          formData.title,
          formData.content,
          expiresIso,
          formData.file
        );
        setSuccessMessage('Notice updated successfully');
      } else {
        await createNotice(
          formData.title,
          formData.content,
          expiresIso,
          formData.file
        );
        setSuccessMessage('Notice created successfully');
      }

      // Reset form
      setFormData({
        title: '',
        content: '',
        expiresAt: '',
        file: null,
        existingFileName: '',
        existingFileUrl: ''
      });
      setEditingId(null);
      setShowForm(false);

      // Reload notices
      setTimeout(() => {
        loadNotices();
      }, 1000);
    } catch (error) {
      console.error('Error saving notice:', error);
      setErrorMessage(
        error.response?.data?.message || 'Failed to save notice'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (notice) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      expiresAt: notice.expiresAt ? notice.expiresAt.split('T')[0] : '',
      file: null,
      existingFileName: notice.fileName || '',
      existingFileUrl: notice.fileUrl || ''
    });
    setEditingId(notice.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      content: '',
      expiresAt: '',
      file: null,
      existingFileName: '',
      existingFileUrl: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleNoticeStatus(id);
      setSuccessMessage('Notice status updated');
      loadNotices();
    } catch (error) {
      console.error('Error toggling notice status:', error);
      setErrorMessage('Failed to update notice status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await deleteNotice(id);
        setSuccessMessage('Notice deleted successfully');
        loadNotices();
      } catch (error) {
        console.error('Error deleting notice:', error);
        setErrorMessage('Failed to delete notice');
      }
    }
  };

  const totalPages = Math.ceil(total / pageSize);

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
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h1 className="h3 mb-2">
                    <i className="bi bi-megaphone me-2"></i>
                    Manage Dining Notices
                  </h1>
                  <p className="mb-0 opacity-75">
                    Create and manage dining hall announcements
                  </p>
                </div>
                <div className="col-md-4 text-md-end">
                  <button
                    className="btn btn-light"
                    onClick={() => {
                      setShowForm(!showForm);
                      if (showForm) handleCancel();
                    }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    {showForm ? 'Cancel' : 'New Notice'}
                  </button>
                </div>
              </div>
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

      {/* Form */}
      {showForm && (
        <div className="row mb-4">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-header">
                <h5 className="mb-0">
                  {editingId ? 'Edit Notice' : 'Create New Notice'}
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      Notice Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="E.g., Dining Hall Closure, Menu Update, etc."
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      Notice Content <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Write the detailed notice content..."
                      rows="6"
                      disabled={loading}
                      required
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="file" className="form-label">
                      Attachment (optional)
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="file"
                      name="file"
                      onChange={handleFileChange}
                      disabled={loading}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
                    />
                    {formData.file ? (
                      <small className="text-muted">Selected: {formData.file.name}</small>
                    ) : (
                      formData.existingFileName && (
                        <small className="d-block mt-1">
                          Current: <a href={`http://localhost:5045${formData.existingFileUrl}`} target="_blank" rel="noreferrer">{formData.existingFileName}</a>
                        </small>
                      )
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="expiresAt" className="form-label">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="expiresAt"
                      name="expiresAt"
                      value={formData.expiresAt}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    <small className="text-muted">
                      Leave empty for notices that don't expire
                    </small>
                  </div>

                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          {editingId ? 'Update Notice' : 'Create Notice'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notices List */}
      <div className="row">
        <div className="col-12">
          {loading && !showForm && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {!loading && notices.length === 0 && (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No notices created yet. Click "New Notice" to create one.
            </div>
          )}

          {!loading &&
            notices.length > 0 &&
            notices.map((notice) => (
              <div key={notice.id} className="card mb-3 shadow-sm">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-9">
                      <h5 className="card-title">{notice.title}</h5>
                      <p className="card-text text-muted">
                        {notice.content.substring(0, 150)}
                        {notice.content.length > 150 ? '...' : ''}
                      </p>
                      {notice.fileUrl && (
                        <div className="mb-2">
                          <i className="bi bi-paperclip me-1"></i>
                          <a href={`http://localhost:5045${notice.fileUrl}`} target="_blank" rel="noreferrer">
                            {notice.fileName || 'View attachment'}
                          </a>
                        </div>
                      )}
                      <small className="text-muted">
                        <i className="bi bi-calendar me-1"></i>
                        Created: {new Date(notice.createdAt).toLocaleDateString()}
                        {notice.expiresAt && (
                          <>
                            <span className="ms-3">
                              <i className="bi bi-clock me-1"></i>
                              Expires: {new Date(notice.expiresAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </small>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-2">
                        <span
                          className={`badge ${notice.isActive ? 'bg-success' : 'bg-secondary'}`}
                        >
                          {notice.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleEdit(notice)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className={`btn ${
                            notice.isActive
                              ? 'btn-outline-warning'
                              : 'btn-outline-success'
                          }`}
                          onClick={() => handleToggleStatus(notice.id)}
                          title={notice.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <i
                            className={`bi ${
                              notice.isActive ? 'bi-eye-slash' : 'bi-eye'
                            }`}
                          ></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(notice.id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                </li>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <li
                    key={p}
                    className={`page-item ${p === page ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </li>
                ))}

                <li
                  className={`page-item ${page === totalPages ? 'disabled' : ''}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminNotices;
