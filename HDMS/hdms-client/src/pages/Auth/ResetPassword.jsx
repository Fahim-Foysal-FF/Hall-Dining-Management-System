import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { resetPassword } from '../../api/authApi';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const userId = searchParams.get('userId') || '';

  const hasLinkParams = useMemo(() => Boolean(token && userId), [token, userId]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!hasLinkParams) {
      setError('Invalid or missing reset link. Please request a new one.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Please provide a new password (minimum 6 characters).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const data = await resetPassword({ userId, token, newPassword: password });
      setMessage(data.message || 'Password reset successful. You can now sign in.');
    } catch (err) {
      const serverMsg = err?.response?.data;
      const display =
        typeof serverMsg === 'string'
          ? serverMsg
          : serverMsg?.message || serverMsg?.title || 'Failed to reset password. The link may be invalid or expired.';
      setError(display);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-bg py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-6">
              <Card className="card-auth">
                <div className="row g-0">
                  {/* Brand side */}
                  <div className="col-md-5 bg-brand p-4 d-none d-md-flex flex-column justify-content-between">
                    <div>
                      <div className="brand-badge mb-3">
                        <i className="bi bi-key"></i>
                        <span>Reset Password</span>
                      </div>
                      <h3 className="fw-semibold mb-2">Choose a new password</h3>
                      <p className="mb-4">Your password must be secure and unique to your account.</p>
                      <ul className="small opacity-75 mb-0">
                        <li>At least 6 characters</li>
                        <li>Use a mix of letters, numbers, and symbols</li>
                      </ul>
                    </div>
                    <div className="small opacity-75">Munshi Meherullah Hall</div>
                  </div>

                  {/* Form side */}
                  <div className="col-md-7 p-4 p-lg-5">
                    <h4 className="fw-semibold mb-3">Reset password</h4>
                    {!hasLinkParams && (
                      <div className="alert alert-warning">
                        This reset link is missing required information. Please request a new link from the Forgot Password page.
                      </div>
                    )}
                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit} noValidate>
                      <div className="mb-3 input-icon">
                        <i className="bi bi-lock"></i>
                        <input
                          className="form-control"
                          type="password"
                          placeholder="New password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-3 input-icon">
                        <i className="bi bi-shield-check"></i>
                        <input
                          className="form-control"
                          type="password"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="d-grid">
                        <Button type="submit" disabled={submitting || !hasLinkParams}>
                          {submitting ? 'Updating password...' : 'Update password'}
                        </Button>
                      </div>
                    </form>
                    <div className="text-center mt-3 auth-links">
                      <Link to="/login">Return to sign in</Link>
                      <span className="mx-2">•</span>
                      <Link to="/forgot">Request a new link</Link>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPassword;
