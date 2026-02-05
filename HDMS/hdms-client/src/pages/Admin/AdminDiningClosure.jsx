import { useEffect, useState } from 'react';
import { getDiningClosures, createDiningClosure, updateDiningClosure, deleteDiningClosure } from '../../api/diningClosureApi';

function AdminDiningClosure() {
  const [closures, setClosures] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    description: ''
  });

  const loadClosures = async () => {
    setLoading(true);
    try {
      const data = await getDiningClosures();
      setClosures(data);
    } catch (err) {
      console.error(err);
      setMsg('Failed to load dining closures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClosures();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setMsg('❌ Please fill in all required fields');
      return;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    
    if (start >= end) {
      setMsg('❌ End date must be after start date');
      return;
    }

    setSubmitting(true);
    setMsg('');

    try {
      let result;
      if (editingId) {
        result = await updateDiningClosure(editingId, form);
      } else {
        result = await createDiningClosure(form);
      }

      if (result.success) {
        setMsg(`✅ ${result.message}`);
        setForm({ startDate: '', endDate: '', reason: '', description: '' });
        setEditingId(null);
        setShowForm(false);
        await loadClosures();
      } else {
        setMsg(`❌ ${result.message || 'Failed to save closure'}`);
      }
    } catch (err) {
      console.error(err);
      setMsg(`❌ ${err.response?.data?.message || 'Failed to save closure'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (closure) => {
    setForm({
      startDate: closure.startDate.split('T')[0],
      endDate: closure.endDate.split('T')[0],
      reason: closure.reason,
      description: closure.description || ''
    });
    setEditingId(closure.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this closure?')) {
      return;
    }

    setMsg('');
    try {
      const result = await deleteDiningClosure(id);
      if (result.success) {
        setMsg('✅ Closure deactivated');
        await loadClosures();
      }
    } catch (err) {
      console.error(err);
      setMsg('❌ Failed to delete closure');
    }
  };

  const handleCancel = () => {
    setForm({ startDate: '', endDate: '', reason: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading closures...</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #d63031 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="h4 mb-2">Dining Closures</h1>
              <p className="mb-0 opacity-75">Manage dining closure periods</p>
            </div>
            <div className="col-md-4 text-md-end">
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowForm(!showForm)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                {showForm ? 'Close' : 'Add Closure'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
          {msg}
        </div>
      )}

      {showForm && (
        <div className="card-pro p-4 mb-4 border border-danger">
          <h5 className="mb-3">
            <i className="bi bi-calendar-x text-danger me-2"></i>
            {editingId ? 'Edit' : 'Create'} Dining Closure
          </h5>
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.startDate}
                  onChange={(e) => setForm({...form, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.endDate}
                  onChange={(e) => setForm({...form, endDate: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Reason *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Maintenance, Holidays, Staff Training"
                  value={form.reason}
                  onChange={(e) => setForm({...form, reason: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional details"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-danger"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingId ? 'Update' : 'Create'} Closure
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card-pro p-4">
        <h5 className="mb-3">Active Closures</h5>
        {closures.filter(c => c.isActive).length === 0 ? (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            No active dining closures. Dining is open!
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Description</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {closures.filter(c => c.isActive).map((closure) => {
                  const start = new Date(closure.startDate);
                  const end = new Date(closure.endDate);
                  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <tr key={closure.id}>
                      <td>
                        <span className="badge bg-danger">{closure.reason}</span>
                      </td>
                      <td>{start.toLocaleDateString()}</td>
                      <td>{end.toLocaleDateString()}</td>
                      <td>
                        <span className="badge bg-warning text-dark">{days} day{days > 1 ? 's' : ''}</span>
                      </td>
                      <td>{closure.description || '—'}</td>
                      <td>{closure.createdBy}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(closure)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(closure.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {closures.filter(c => !c.isActive).length > 0 && (
          <>
            <hr className="my-4" />
            <h6 className="mb-3 text-muted">Inactive Closures</h6>
            <div className="table-responsive">
              <table className="table table-sm align-middle opacity-75">
                <thead>
                  <tr>
                    <th>Reason</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {closures.filter(c => !c.isActive).map((closure) => {
                    const start = new Date(closure.startDate);
                    const end = new Date(closure.endDate);
                    
                    return (
                      <tr key={closure.id}>
                        <td>{closure.reason}</td>
                        <td>{start.toLocaleDateString()}</td>
                        <td>{end.toLocaleDateString()}</td>
                        <td>{closure.createdBy}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDiningClosure;
