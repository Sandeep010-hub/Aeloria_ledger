import React, { useContext, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
    { name: 'Clients', path: '/clients', icon: 'group' },
    { name: 'Projects', path: '/projects', icon: 'business_center' },
    { name: 'Invoices', path: '/invoices', icon: 'receipt_long' },
    { name: 'Quotations', path: '/quotations', icon: 'description' },
    { name: 'Income Ledger', path: '/income', icon: 'payments' },
    { name: 'Expense Ledger', path: '/expenses', icon: 'shopping_bag' },
    { name: 'Team Hub', path: '/team', icon: 'badge' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  // Breadcrumb resolver
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Financial Dashboard';
    if (path.includes('/clients')) return 'Client Accounts';
    if (path.includes('/projects')) return 'Company Projects';
    if (path.includes('/invoices')) return 'Invoice Ledger';
    if (path.includes('/quotations')) return 'Quote Center';
    if (path.includes('/income')) return 'Income Tracking';
    if (path.includes('/expenses')) return 'Expense Tracking';
    if (path.includes('/team')) return 'Team & Roles';
    if (path.includes('/settings')) return 'Enterprise Settings';
    return 'Aeloria Ledger';
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside 
        style={{
          width: isSidebarCollapsed ? '80px' : '280px',
          height: '100vh',
          backgroundColor: 'var(--inverse-surface)',
          color: 'var(--inverse-on-surface)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'relative',
          zIndex: 40,
          boxShadow: 'var(--shadow-lg)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className="desktop-sidebar"
      >
        {/* BRAND HEADER */}
        <div style={{ padding: isSidebarCollapsed ? '24px 0' : '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {isSidebarCollapsed ? (
            <button 
              onClick={() => setIsSidebarCollapsed(false)}
              style={{ background: 'none', border: 'none', color: 'var(--outline-variant)', cursor: 'pointer' }}
              title="Expand Sidebar"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', flex: 1 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--primary)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--on-primary)',
                  fontWeight: '800',
                  fontFamily: 'var(--font-heading)',
                  flexShrink: 0
                }}>A</div>
                <div style={{ whiteSpace: 'nowrap' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
                    Aeloria
                  </h1>
                  <p style={{ fontSize: '11px', color: 'var(--outline-variant)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ledger Workspace
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSidebarCollapsed(true)}
                style={{ background: 'none', border: 'none', color: 'var(--outline-variant)', cursor: 'pointer' }}
                title="Collapse Sidebar"
              >
                <span className="material-symbols-outlined">menu_open</span>
              </button>
            </>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <nav style={{ flex: 1, padding: isSidebarCollapsed ? '16px 8px' : '16px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', overflowX: 'hidden' }} className="custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isSidebarCollapsed ? item.name : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                gap: '12px',
                padding: isSidebarCollapsed ? '12px 0' : '12px 16px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--primary-container)' : 'var(--inverse-on-surface)',
                backgroundColor: isActive ? 'rgba(0, 242, 255, 0.08)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? '600' : '400',
                fontSize: '14px',
                transition: 'var(--transition-spring)',
                borderLeft: isActive ? '3px solid var(--primary-container)' : '3px solid transparent'
              })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {item.icon}
              </span>
              {!isSidebarCollapsed && (
                <span style={{ fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' }}>{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* USER PROFILE INFO PANEL */}
        <div style={{
          padding: isSidebarCollapsed ? '20px 0' : '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: isSidebarCollapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--on-primary)',
            fontWeight: '600',
            fontSize: '16px',
            flexShrink: 0
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-full)', objectFit: 'cover' }} />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          {!isSidebarCollapsed && (
            <>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ fontSize: '13px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name}
                </h4>
                <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 6px', marginTop: '2px', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)' }}>
                  {user?.role}
                </span>
              </div>
              <button 
                onClick={handleLogout} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--outline-variant)',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'var(--transition-spring)'
                }}
                title="Logout"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  logout
                </span>
              </button>
            </>
          )}
          {isSidebarCollapsed && (
            <button 
              onClick={handleLogout} 
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                transition: 'var(--transition-spring)'
              }}
              title="Logout"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                logout
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* RIGHT SIDE MAIN PAGE WRAPPER */}
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        
        {/* TOP BAR / HEADER */}
        <header style={{
          height: '70px',
          backgroundColor: 'var(--surface-container-lowest)',
          borderBottom: '1px solid var(--surface-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 30,
          boxShadow: 'var(--shadow-sm)'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Mobile Sidebar Trigger button */}
            <button 
              className="mobile-trigger" 
              onClick={() => setMobileOpen(true)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--on-surface)',
                cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                menu
              </span>
            </button>

            {/* Breadcrumb Path Title */}
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
                {getBreadcrumbs()}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            {/* Corporate Branding Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'var(--surface-container)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface-variant)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                business
              </span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--on-surface-variant)' }}>
                {user?.companyDetails?.companyName}
              </span>
            </div>
          </div>
        </header>

        {/* PAGE SCREEN CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '24px' }} className="custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* MOBILE COLLAPSED SLIDEOVER SIDEBAR */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop Mask */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: '#000000',
                zIndex: 90
              }}
            />
            {/* Sidebar drawer panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '280px',
                height: '100vh',
                backgroundColor: 'var(--inverse-surface)',
                color: 'var(--inverse-on-surface)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100,
                boxShadow: 'var(--shadow-premium)'
              }}
            >
              {/* BRAND MOBILE HEADER */}
              <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '800' }}>A</div>
                  <h1 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>Aeloria</h1>
                </div>
                <button 
                  onClick={() => setMobileOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* NAVIGATION MOBILE LINKS */}
              <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? 'var(--primary-container)' : 'var(--inverse-on-surface)',
                      backgroundColor: isActive ? 'rgba(0, 242, 255, 0.08)' : 'transparent',
                      textDecoration: 'none',
                      fontWeight: isActive ? '600' : '400',
                      fontSize: '14px',
                      borderLeft: isActive ? '3px solid var(--primary-container)' : '3px solid transparent'
                    })}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>

              {/* PROFILE CONTROL MOBILE */}
              <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '600' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>{user?.name}</h4>
                  <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 6px' }}>{user?.role}</span>
                </div>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--outline-variant)', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Media Query Injector (to handle responsiveness without inline framework styles) */}
      <style>{`
        @media (max-width: 992px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-trigger {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
