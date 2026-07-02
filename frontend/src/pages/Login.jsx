import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { loginUser, user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    
    // Check if redirected due to expired session
    if (searchParams.get('expired') === 'true') {
      showToast('Session expired. Please log in again.', 'error');
    }
  }, [user, navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setIsSubmitting(true);
    const result = await loginUser(email, password);
    setIsSubmitting(false);

    if (result && result.success) {
      showToast('Login successful! Welcome back.', 'success');
      navigate('/dashboard');
    } else {
      showToast(result?.message || 'Login failed. Invalid credentials.', 'error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at top right, rgba(0, 242, 255, 0.08), transparent 45%), radial-gradient(circle at bottom left, rgba(0, 105, 111, 0.1), transparent 45%)',
      backgroundColor: 'var(--background)'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="glass-panel"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            backgroundColor: 'var(--primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '18px',
            margin: '0 auto 16px auto',
            fontFamily: 'var(--font-heading)'
          }}>A</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
            Welcome to Ledger
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
            Manage your Aeloria business finance OS.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Business Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--outline-variant)',
                backgroundColor: 'var(--surface-container-lowest)',
                color: 'var(--on-surface)',
                outline: 'none',
                fontSize: '14px',
                transition: 'var(--transition-spring)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Account Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--outline-variant)',
                backgroundColor: 'var(--surface-container-lowest)',
                color: 'var(--on-surface)',
                outline: 'none',
                fontSize: '14px',
                transition: 'var(--transition-spring)'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              padding: '12px',
              fontSize: '14px',
              fontWeight: '700',
              marginTop: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>

        {/* Footer links */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '8px' }}>
          New to Ledger?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
            Create free workspace
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
