import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  const fullName = localStorage.getItem('fullName') || '';

  const isAdmin = roles.includes('Admin');
  const isStudent = roles.includes('Student');

  // Helper to check if current path is active
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center" to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}>
          <div className="brand-icon me-2">
            <i className="bi bi-egg-fried"></i>
          </div>
          <div>
            <div className="fw-bold text-primary mb-0" style={{fontSize: '1.1rem', lineHeight: '1.2'}}>HDMS</div>
            <small className="text-muted d-block" style={{fontSize: '0.7rem', marginTop: '-2px'}}>Hall Dining</small>
          </div>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto">
            {token && isAdmin && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`} to="/admin/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i>Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/admin/tokens') ? 'active' : ''}`} to="/admin/tokens">
                    <i className="bi bi-ticket me-1"></i>Tokens
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/admin/meal-plan') ? 'active' : ''}`} to="/admin/meal-plan">
                    <i className="bi bi-calendar me-1"></i>Meal Plan
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/admin/wallets') ? 'active' : ''}`} to="/admin/wallets">
                    <i className="bi bi-wallet me-1"></i>Wallets
                  </Link>
                </li>
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i className="bi bi-gear me-1"></i>Management
                  </a>
                  <ul className="dropdown-menu">
                    <li><Link className="dropdown-item" to="/admin/feedback">Feedback Review</Link></li>
                    <li><Link className="dropdown-item" to="/admin/notices">Notices</Link></li>
                    <li><Link className="dropdown-item" to="/admin/complaints">Complaints</Link></li>
                    <li><Link className="dropdown-item" to="/admin/dining-closure">Dining Closure</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><Link className="dropdown-item" to="/admin/moderation">User Moderation</Link></li>
                    <li><Link className="dropdown-item" to="/admin/scan">Verify Token</Link></li>
                    <li><Link className="dropdown-item" to="/admin/meals">Meals Summary</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><Link className="dropdown-item" to="/admin/reports">Reports</Link></li>
                  </ul>
                </li>
              </>
            )}

            {token && !isAdmin && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/student/dashboard') ? 'active' : ''}`} to="/student/dashboard">
                    <i className="bi bi-house me-1"></i>Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/student/schedule') ? 'active' : ''}`} to="/student/schedule">
                    <i className="bi bi-calendar me-1"></i>Schedule
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/student/buy-token') ? 'active' : ''}`} to="/student/buy-token">
                    <i className="bi bi-plus-circle me-1"></i>Buy Token
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/student/my-tokens') ? 'active' : ''}`} to="/student/my-tokens">
                    <i className="bi bi-ticket me-1"></i>My Tokens
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/student/market') ? 'active' : ''}`} to="/student/market">
                    <i className="bi bi-shop me-1"></i>Marketplace
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/student/wallet') ? 'active' : ''}`} to="/student/wallet">
                    <i className="bi bi-wallet me-1"></i>Wallet
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/student/feedback') ? 'active' : ''}`} to="/student/feedback">
                    <i className="bi bi-chat-dots me-1"></i>Feedback
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/student/notices') ? 'active' : ''}`} to="/student/notices">
                    <i className="bi bi-megaphone me-1"></i>Notices
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/student/complaints') ? 'active' : ''}`} to="/student/complaints">
                    <i className="bi bi-exclamation-circle me-1"></i>Support
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/student/reports') ? 'active' : ''}`} to="/student/reports">
                    <i className="bi bi-bar-chart me-1"></i>Reports
                  </Link>
                </li>
              </>
            )}
          </ul>

          <ul className="navbar-nav">
            {token && (
              <>
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
                    <div className="brand-icon-sm bg-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                      <i className="bi bi-person-fill text-white" style={{fontSize: '14px'}}></i>
                    </div>
                    <span className="d-none d-md-inline">{fullName.split(' ')[0]}</span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><Link className="dropdown-item" to="/account/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
                  </ul>
                </li>
              </>
            )}

            {!token && (
              <>
                <li className="nav-item">
                  <Link className="ms-2" to="/login">
                    <div className="btn-prim btn-polish d-inline-flex align-items-center">
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      <span>Sign In</span>
                    </div>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;