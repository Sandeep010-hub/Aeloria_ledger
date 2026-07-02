import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ToastContext } from '../context/ToastContext.jsx';
import API from '../services/api.js';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { showToast } = useContext(ToastContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await API.post('/auth/forgot-password-flow', { email });
      setIsSubmitting(false);
      
      if (res.data.success) {
        setSuccess(true);
        showToast('Password reset instructions sent!', 'success');
      } else {
        showToast(res.data.message || 'Something went wrong. Please try again.', 'error');
      }
    } catch (error) {
      setIsSubmitting(false);
      showToast(error.response?.data?.message || 'Email not found or connection error.', 'error');
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
            Reset Password
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
            We'll send you recovery steps.
          </p>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-container)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>mark_email_read</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: '22px' }}>
              We've dispatched a simulated recovery package to **{email}**. Please review your secure folders.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ padding: '12px' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Account Email Address
              </label>
              <input
                type="email"
                placeholder="alex@aeloria.com"
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
              {isSubmitting ? 'Processing Request...' : 'Transmit Recovery Code'}
            </button>
            
            <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '8px' }}>
              Remember password?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                Sign in
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
