import { useEffect } from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

function Layout() {
  // Simple flash system using sessionStorage (optional)
  useEffect(() => {
    const bootstrap = window.bootstrap;
    if (!bootstrap) return;
    document.querySelectorAll('.toast').forEach((el) => {
      new bootstrap.Toast(el, { delay: 3500 }).show();
    });
  });

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="flex-grow-1 py-4">
        <div className="container-main">
          <Outlet />
        </div>
      </main>

      {/* Toast container */}
      <div
        className="toast-container position-fixed top-0 end-0 p-3"
        style={{ zIndex: 1080 }}
        id="toast-root"
      ></div>

      {/* Footer */}
      <footer className="bg-white border-top py-3 mt-auto">
        <div className="container-fluid px-4">
          <div className="row align-items-center">
            <div className="col-md-6">
              <small className="text-muted">
                © 2025 Munshi Meherullah Hall Dining System. All rights reserved.
              </small>
            </div>
            <div className="col-md-6 text-md-end">
              <small className="text-muted">
                Powered by HDMS v2.0
              </small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;