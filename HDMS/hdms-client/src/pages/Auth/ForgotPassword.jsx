import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { forgotPassword } from '../../api/authApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const data = await forgotPassword(email);
      if (typeof data === 'string') setMsg(data);
      else setMsg(data.message || 'If this email exists, a reset link has been sent.');
      console.log('Forgot password response:', data); // for dev, shows resetToken/userId
    } catch (err) {
      console.error(err);
      setMsg('Failed to send reset link.');
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
                        <i className="bi bi-shield-lock"></i>
                        <span>Password Reset</span>
                      </div>
                      <h3 className="fw-semibold mb-2">Forgot your password?</h3>
                      <p className="mb-4">
                        Enter your email address and we’ll send you a reset link.
                      </p>
                      <ul className="small opacity-75 mb-0">
                        <li>Link is valid for a limited time</li>
                        <li>Works on desktop and mobile</li>
                      </ul>
                    </div>
                    <div className="small opacity-75">Munshi Meherullah Hall</div>
                  </div>

                  {/* Form side */}
                  <div className="col-md-7 p-4 p-lg-5">
                    <h4 className="fw-semibold mb-3">Forgot password</h4>
                    {msg && <div className="alert alert-info">{msg}</div>}
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
                      <div className="d-grid">
                        <Button type="submit">Send reset link</Button>
                      </div>
                    </form>
                    <div className="text-center mt-3 auth-links">
                      <Link to="/login">Back to sign in</Link>
                    </div>
                  </div>
                </div> {/* row */}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;