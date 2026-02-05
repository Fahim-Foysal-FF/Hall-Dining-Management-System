import Navbar from '../../components/Navbar';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/authApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    studentIdNumber: '',
    department: '',
    hallName: '',
    roomNumber: ''
  });
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const navigate = useNavigate();

  // Departments data
  const departments = [
    // Faculty of Engineering and Technology
    { value: 'Computer Science and Engineering', faculty: 'Engineering and Technology' },
    { value: 'Industrial and Production Engineering', faculty: 'Engineering and Technology' },
    { value: 'Petroleum and Mining Engineering', faculty: 'Engineering and Technology' },
    { value: 'Chemical Engineering', faculty: 'Engineering and Technology' },
    { value: 'Electrical and Electronic Engineering', faculty: 'Engineering and Technology' },
    { value: 'Biomedical Engineering', faculty: 'Engineering and Technology' },
    { value: 'Textile Engineering', faculty: 'Engineering and Technology' },
    
    // Faculty of Biological Science and Technology
    { value: 'Microbiology', faculty: 'Biological Science and Technology' },
    { value: 'Fisheries and Marine Bioscience', faculty: 'Biological Science and Technology' },
    { value: 'Genetic Engineering and Biotechnology', faculty: 'Biological Science and Technology' },
    { value: 'Pharmacy', faculty: 'Biological Science and Technology' },
    { value: 'Biochemistry and Molecular Biology', faculty: 'Biological Science and Technology' },
    
    // Faculty of Science
    { value: 'Physics', faculty: 'Science' },
    { value: 'Chemistry', faculty: 'Science' },
    { value: 'Mathematics', faculty: 'Science' },
    { value: 'Applied Statistics and Data Science', faculty: 'Science' },
    
    // Faculty of Business Studies
    { value: 'Accounting and Information Systems', faculty: 'Business Studies' },
    { value: 'Management', faculty: 'Business Studies' },
    { value: 'Finance and Banking', faculty: 'Business Studies' },
    { value: 'Marketing', faculty: 'Business Studies' },
    
    // Faculty of Applied Science and Technology
    { value: 'Environmental Science and Technology', faculty: 'Applied Science and Technology' },
    { value: 'Nutrition and Food Technology', faculty: 'Applied Science and Technology' },
    { value: 'Food Engineering', faculty: 'Applied Science and Technology' },
    { value: 'Climate and Disaster Management', faculty: 'Applied Science and Technology' },
    
    // Faculty of Health Science
    { value: 'Physical Education and Sports Science', faculty: 'Health Science' },
    { value: 'Physiotherapy and Rehabilitation', faculty: 'Health Science' },
    { value: 'Nursing and Health Science', faculty: 'Health Science' },
    
    // Faculty of Arts and Social Science
    { value: 'Arts and Social Science', faculty: 'Arts and Social Science' }
  ];

  // Halls data
  const halls = [
    'Shaheed Mashiur Rahman Hall',
    'Tapashi Rabeya Hall',
    'Munshi Meherullah Hall',
    'Beerprotik Taramon Bibi Hall',
    'Kobi Golam Mostofa Hall',
    'Girls Hall Jhenaidah Campus'
  ];

  // Group departments by faculty for better organization
  const departmentsByFaculty = departments.reduce((acc, dept) => {
    if (!acc[dept.faculty]) {
      acc[dept.faculty] = [];
    }
    acc[dept.faculty].push(dept);
    return acc;
  }, {});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === 'password' && passwordErrors.length) setPasswordErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setConfirmError('');
    setPasswordErrors([]);
    if (form.password !== confirm) {
      setConfirmError('Passwords do not match.');
      return;
    }
    try {
      await register(form);
      setMsg('Account created. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      console.error(err);
      if (err.response) {
        const data = err.response.data;
        if (typeof data === 'string') {
          setMsg(data);
        } else if (Array.isArray(data)) {
          const descriptions = data
            .map((x) => (typeof x === 'string' ? x : x?.description || x?.code || ''))
            .filter(Boolean);

          const isPasswordPolicyError = (text) =>
            typeof text === 'string' &&
            (text.startsWith('Passwords must') ||
              text.startsWith('Password must') ||
              text.toLowerCase().includes('password'));

          const pw = descriptions.filter(isPasswordPolicyError);
          const other = descriptions.filter((t) => !isPasswordPolicyError(t));

          if (pw.length) setPasswordErrors(pw);
          if (other.length) setMsg(other.join(', '));
          if (!pw.length && !other.length) setMsg('Registration failed (server).');
        } else {
          setMsg('Registration failed (server).');
        }
      } else {
        setMsg('Registration failed (network).');
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
                  {/* Brand side */}
                  <div className="col-md-5 bg-brand p-4 d-none d-md-flex flex-column justify-content-between">
                    <div>
                      <div className="brand-badge mb-3">
                        <i className="bi bi-people"></i>
                        <span>Join Hall Dining</span>
                      </div>
                      <h3 className="fw-semibold mb-2">Create your account</h3>
                      <p className="mb-4">Access weekly meals, buy tokens, and share feedback.</p>
                      <ul className="mb-0 small opacity-75">
                        <li>Student registration (teachers/admin later)</li>
                        <li>Wallet-based checkout (future)</li>
                        <li>Email QR after payment (future)</li>
                      </ul>
                    </div>
                    <div className="small opacity-75">Munshi Meherullah Hall</div>
                  </div>

                  {/* Form side */}
                  <div className="col-md-7 p-4 p-lg-5">
                    <h4 className="fw-semibold mb-3">Create account</h4>
                    {msg && <div className="alert alert-warning">{msg}</div>}

                    <form onSubmit={handleSubmit} noValidate>
                      <div className="mb-3 input-icon">
                        <i className="bi bi-person"></i>
                        <input
                          className="form-control"
                          name="fullName"
                          placeholder="Full name"
                          value={form.fullName}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="mb-3 input-icon">
                        <i className="bi bi-envelope"></i>
                        <input
                          className="form-control"
                          type="email"
                          name="email"
                          placeholder="Email address"
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      {/* Student ID field */}
                      <div className="mb-3">
                        <label className="form-label">Student ID *</label>
                        <input
                          className="form-control"
                          name="studentIdNumber"
                          value={form.studentIdNumber}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      {/* Department dropdown */}
                      <div className="mb-3">
                        <label className="form-label">Department *</label>
                        <select
                          className="form-select"
                          name="department"
                          value={form.department}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select your department</option>
                          {Object.entries(departmentsByFaculty).map(([faculty, depts]) => (
                            <optgroup key={faculty} label={`Faculty of ${faculty}`}>
                              {depts.map((dept) => (
                                <option key={dept.value} value={dept.value}>
                                  {dept.value}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      
                      {/* Hall dropdown */}
                      <div className="mb-3">
                        <label className="form-label">Hall *</label>
                        <select
                          className="form-select"
                          name="hallName"
                          value={form.hallName}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select your hall</option>
                          {halls.map((hall) => (
                            <option key={hall} value={hall}>
                              {hall}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Room number field */}
                      <div className="mb-3">
                        <label className="form-label">Room Number *</label>
                        <input
                          className="form-control"
                          name="roomNumber"
                          placeholder="e.g., 101, 202, 305, etc."
                          value={form.roomNumber}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      {/* Password field */}
                      <div className="mb-2">
                        <div className="position-relative input-icon input-icon-eye">
                          <i className="bi bi-lock"></i>
                          <input
                            className="form-control"
                            type={showPw ? 'text' : 'password'}
                            name="password"
                            id="regPassword"
                            placeholder="Password (min 4 chars)"
                            value={form.password}
                            onChange={handleChange}
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

                        <div className="form-hint mt-1">Use at least 4 characters.</div>
                        {passwordErrors.length > 0 && (
                          <div className="text-danger small mt-2">
                            {passwordErrors.map((t) => (
                              <div key={t}>{t}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Confirm Password field */}
                      <div className="mb-3">
                        <div className="position-relative input-icon input-icon-eye">
                          <i className="bi bi-lock-fill"></i>
                          <input
                            className="form-control"
                            type={showPw2 ? 'text' : 'password'}
                            id="regConfirm"
                            placeholder="Confirm password"
                            value={confirm}
                            onChange={(e) => {
                              const v = e.target.value;
                              setConfirm(v);
                              if (confirmError && form.password === v) setConfirmError('');
                            }}
                            required
                          />
                          <button
                            type="button"
                            className="eye-btn"
                            onClick={() => setShowPw2((s) => !s)}
                          >
                            <i className={`bi ${showPw2 ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                          </button>
                        </div>

                        {confirmError && (
                          <div className="text-danger small mt-1">{confirmError}</div>
                        )}
                      </div>

                      <div className="d-grid">
                        <Button type="submit">Create account</Button>
                      </div>
                    </form>

                    <div className="text-center mt-3 auth-links">
                      <span className="text-muted">Already have an account?</span>
                      <Link to="/login" className="ms-1">
                        Sign in
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

export default Register;