import Navbar from '../../components/Navbar';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/authApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const data = await login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('email', data.email);
      localStorage.setItem('fullName', data.fullName);
      localStorage.setItem('userCode', data.userCode);
      localStorage.setItem('roles', JSON.stringify(data.roles));

      if (data.roles.includes('Admin')) navigate('/admin/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      console.error(err);
      if (err.response) {
        const d = err.response.data;
        
        // Check if account is suspended/blocked
        if (d.error === 'AccountSuspended') {
          setMsg(`🔒 Account Suspended\n\n${d.message}\n\nReason: ${d.reason}\n\nYour account will be automatically reactivated on ${new Date(d.suspendedUntil).toLocaleDateString()}.\n\nIf you believe this is a mistake, please contact the administration.`);
        } else {
          setMsg(typeof d === 'string' ? d : 'Invalid credentials.');
        }
      } else {
        setMsg('Login failed (network).');
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-bg py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-xl-9">
              <Card className="card-auth">
                <div className="row g-0">
                  <div className="col-md-5 bg-brand p-4 d-none d-md-flex flex-column justify-content-between">
                    <div>
                      <div className="brand-badge mb-3">
                        <i className="bi bi-shield-check"></i>
                        <span>Hall Dining</span>
                      </div>
                      <h3 className="fw-semibold mb-2">Welcome back</h3>
                      <p className="mb-4">Sign in to manage your meals and tokens.</p>
                      <ul className="mb-0 small opacity-75">
                        <li>Secure wallet payments</li>
                        <li>Token marketplace</li>
                        <li>Fast QR verification</li>
                      </ul>
                    </div>
                    <div className="small opacity-75">Munshi Meherullah Hall</div>
                  </div>

                  <div className="col-md-7 p-4 p-lg-5">
                    <h4 className="fw-semibold mb-3">Sign in</h4>
                    {msg && (
                      <div className={`alert ${msg.includes('Suspended') ? 'alert-warning' : 'alert-danger'}`} style={{ whiteSpace: 'pre-line' }}>
                        {msg}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                      <div className="mb-3 input-icon">
                        <i className="bi bi-envelope"></i>
                        <input
                          className="form-control"
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mb-2 position-relative input-icon input-icon-eye">
                        <i className="bi bi-lock"></i>
                        <input
                          className="form-control"
                          type={showPw ? 'text' : 'password'}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="eye-btn"
                          onClick={() => setShowPw((s) => !s)}
                        >
                          <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3 auth-links">
                        { <Link to="/forgot">Forgot password?</Link> }
                      </div>

                      <div className="d-grid">
                        <Button type="submit">Sign in</Button>
                      </div>
                    </form>

                    <div className="text-center mt-3 auth-links">
                      <span className="text-muted">No account?</span>
                      <Link to="/register" className="ms-1">
                        Create an account
                      </Link>
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

export default Login;