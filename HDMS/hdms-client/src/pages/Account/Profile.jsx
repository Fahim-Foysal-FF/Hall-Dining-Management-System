import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [changePassMode, setChangePassMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state for profile edit
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    roomNumber: ''
  });

  // Form state for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/auth/profile');
      const data = response.data;
      setProfile(data);

      // Initialize form with current values
      setFormData({
        fullName: data.fullName || data.FullName || '',
        phone: data.phone || data.Phone || '',
        roomNumber: data.roomNumber || data.RoomNumber || ''
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSuccessMsg('');

    try {
      const data = new FormData();
      data.append('fullName', formData.fullName);
      data.append('phone', formData.phone || '');
      data.append('roomNumber', formData.roomNumber);
      if (formData.photo) {
        data.append('photo', formData.photo);
      }

      await axiosClient.put('/auth/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg('Profile updated successfully!');
      setEditMode(false);
      await fetchProfile();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSuccessMsg('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSubmitError('New passwords do not match');
      setSubmitting(false);
      return;
    }

    try {
      await axiosClient.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccessMsg('Password changed successfully!');
      setChangePassMode(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!profile) return <div>No profile data</div>;

  // Handle both camelCase and PascalCase property names
  const userCode = profile.userCode || profile.UserCode || '';
  const walletBalance = profile.walletBalance || profile.WalletBalance || 0;
  const fullName = profile.fullName || profile.FullName || '';
  const email = profile.email || profile.Email || '';
  const roles = profile.roles || profile.Roles || [];
  const rawAvatarPath = profile.avatarPath || profile.AvatarPath || '';
  const apiOrigin = axiosClient.defaults.baseURL ? new URL(axiosClient.defaults.baseURL).origin : '';
  const avatarUrl = rawAvatarPath
    ? rawAvatarPath.startsWith('http')
      ? rawAvatarPath
      : `${apiOrigin}${rawAvatarPath.startsWith('/') ? '' : '/'}${rawAvatarPath}`
    : '';

  return (
    <div className="container mt-4 mb-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">My Profile</h2>

          {successMsg && <div className="alert alert-success">{successMsg}</div>}
          {submitError && <div className="alert alert-danger">{submitError}</div>}

          <div className="row">
            {/* Left sidebar - Profile card */}
            <div className="col-md-4">
              <div className="card p-4 text-center sticky-top" style={{ top: '20px' }}>
                <div className="mb-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="rounded-circle"
                      style={{ width: 120, height: 120, objectFit: 'cover', border: '3px solid #e9ecef' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center mx-auto"
                      style={{ width: 120, height: 120, fontSize: 48, fontWeight: 'bold' }}
                    >
                      {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <h5 className="fw-bold mb-1">{fullName}</h5>
                <p className="text-muted small mb-2">{email}</p>
                {userCode && (
                  <div className="mb-2">
                    <span className="badge bg-primary">{userCode}</span>
                  </div>
                )}
                <div className="small mb-3">
                  <div className="text-muted mb-1">
                    <strong>Wallet:</strong> ৳{walletBalance.toFixed(2)}
                  </div>
                  <div className="text-muted">
                    <strong>Role:</strong> {roles.join(', ') || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Profile details and edit forms */}
            <div className="col-md-8">
              {/* Profile Info - Read Mode */}
              {!editMode && !changePassMode && (
                <div className="card p-4 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5>Profile Information</h5>
                    <button className="btn btn-sm btn-primary" onClick={() => setEditMode(true)}>
                      <i className="bi bi-pencil me-1"></i> Edit
                    </button>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label text-muted small">Full Name</label>
                        <p className="form-control-plaintext fw-bold">{fullName}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label text-muted small">Email</label>
                        <p className="form-control-plaintext fw-bold">{email}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label text-muted small">Phone</label>
                        <p className="form-control-plaintext fw-bold">{profile.phone || profile.Phone || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label text-muted small">Wallet Balance</label>
                        <p className="form-control-plaintext fw-bold">৳{walletBalance.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label text-muted small">Department</label>
                        <p className="form-control-plaintext fw-bold">{profile.department || profile.Department || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label text-muted small">Hall Name</label>
                        <p className="form-control-plaintext fw-bold">{profile.hallName || profile.HallName || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label text-muted small">Room Number</label>
                        <p className="form-control-plaintext fw-bold">{profile.roomNumber || profile.RoomNumber || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Profile Form */}
              {editMode && (
                <div className="card p-4 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5>Edit Profile</h5>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setEditMode(false)}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>

                  <form onSubmit={handleUpdateProfile}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Full Name</label>
                        <input
                          className="form-control"
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input
                          className="form-control"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Room Number</label>
                        <input
                          className="form-control"
                          type="text"
                          value={formData.roomNumber}
                          onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                          placeholder="Enter room number"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Profile Photo</label>
                        <input
                          className="form-control"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })}
                        />
                        <small className="text-muted d-block mt-1">Accepted formats: JPG, PNG, GIF (Max 5MB)</small>
                      </div>
                    </div>

                    <div className="mt-4 d-flex gap-2">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setEditMode(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Change Password Form */}
              {changePassMode && (
                <div className="card p-4 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5>Change Password</h5>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setChangePassMode(false)}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>

                  <form onSubmit={handleChangePassword}>
                    <div className="mb-3">
                      <label className="form-label">Current Password</label>
                      <input
                        className="form-control"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">New Password</label>
                      <input
                        className="form-control"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirm Password</label>
                      <input
                        className="form-control"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="mt-4 d-flex gap-2">
                      <button type="submit" className="btn btn-danger" disabled={submitting}>
                        {submitting ? 'Changing...' : 'Change Password'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setChangePassMode(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Action Buttons */}
              {!editMode && !changePassMode && (
                <div className="card p-4">
                  <h5 className="mb-3">Account Actions</h5>
                  <div className="d-flex flex-column gap-2">
                    <button
                      className="btn btn-warning"
                      onClick={() => setChangePassMode(true)}
                    >
                      <i className="bi bi-lock me-2"></i> Change Password
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;