import { useEffect, useState } from 'react';
import { getNoticeBoard, getNoticeDetail } from '../../api/noticesApi';
import '../../styles/design-system.css';

function StudentNoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadNotices();
  }, [page]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getNoticeBoard(page, pageSize);
      setNotices(data.notices || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error loading notices:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load notices';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleNoticeClick = async (notice) => {
    try {
      setError('');
      console.log('Fetching notice detail for ID:', notice.id);
      const detail = await getNoticeDetail(notice.id);
      console.log('Got notice detail:', detail);
      setSelectedNotice(detail);
    } catch (error) {
      console.error('Error loading notice detail:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load notice details';
      setError('Error: ' + errorMsg);
      setSelectedNotice(null);
    }
  };

  const handleCloseDetail = () => {
    setSelectedNotice(null);
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
              <h1 className="h3 mb-2">
                <i className="bi bi-megaphone me-2"></i>
                Dining Notice Board
              </h1>
              <p className="mb-0 opacity-75">
                Stay updated with dining hall announcements and notices
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          {error && (
            <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {!loading && notices.length === 0 && (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No active notices at the moment.
            </div>
          )}

          {!loading &&
            notices.length > 0 &&
            notices.map((notice) => (
              <div key={notice.id} className="card mb-3 shadow-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-9">
                      <h5 className="card-title">
                        <i className="bi bi-pin-fill me-2 text-danger"></i>
                        {notice.title}
                      </h5>
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
                        {new Date(notice.createdAt).toLocaleDateString()}
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
                    <div className="col-md-3 text-md-end">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleNoticeClick(notice)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        View Details
                      </button>
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

                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
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

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedNotice.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseDetail}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  <i className="bi bi-person me-1"></i>
                  By {selectedNotice.createdBy}
                  <span className="ms-3">
                    <i className="bi bi-calendar me-1"></i>
                    {new Date(selectedNotice.createdAt).toLocaleDateString()}
                  </span>
                </p>
                <div
                  className="notice-content"
                  style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
                >
                  {selectedNotice.content}
                </div>
                {selectedNotice.fileUrl && (
                  <div className="mt-3">
                    <i className="bi bi-paperclip me-2"></i>
                    <a href={`http://localhost:5045${selectedNotice.fileUrl}`} target="_blank" rel="noreferrer">
                      {selectedNotice.fileName || 'Download attachment'}
                    </a>
                  </div>
                )}
                {selectedNotice.expiresAt && (
                  <p className="mt-4 text-muted small">
                    <i className="bi bi-clock me-1"></i>
                    This notice expires on{' '}
                    {new Date(selectedNotice.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDetail}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentNoticeBoard;
