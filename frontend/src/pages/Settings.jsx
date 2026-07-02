import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user, updateLocalState } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    address: '',
    phone: '',
    gstNumber: '',
    currency: 'USD'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const isPrivileged = user?.role === 'Admin' || user?.role === 'CIO';

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await API.get('/settings');
        if (res.data.success) {
          const data = res.data.data;
          setFormData({
            name: data.name || '',
            email: data.email || '',
            companyName: data.companyDetails?.companyName || 'Aeloria Corp',
            address: data.companyDetails?.address || '',
            phone: data.companyDetails?.phone || '',
            gstNumber: data.companyDetails?.gstNumber || '',
            currency: data.companyDetails?.currency || 'USD'
          });
          setLogoPreview(data.companyDetails?.logo || '');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        showToast('Failed to load settings from server', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Local preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.companyName) {
      showToast('Name, Email and Company Name are required fields', 'error');
      return;
    }

    try {
      setSaving(true);
      
      // Build form-data because of logo file upload
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('companyName', formData.companyName);
      data.append('address', formData.address);
      data.append('phone', formData.phone);
      data.append('gstNumber', formData.gstNumber);
      data.append('currency', formData.currency);
      
      if (selectedFile) {
        data.append('logo', selectedFile);
      }

      const res = await API.put('/settings', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showToast('Settings saved and synchronized!', 'success');
        
        // Propagate updates to AuthContext immediately
        updateLocalState(res.data.data);
        
        if (res.data.data.companyDetails?.logo) {
          setLogoPreview(res.data.data.companyDetails.logo);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(error.response?.data?.message || 'Failed to persist settings changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'pulse 1.5s infinite' }}>
        <div style={{ height: '32px', backgroundColor: 'var(--surface-variant)', borderRadius: '4px', width: '250px' }} />
        <div style={{ height: '180px', backgroundColor: 'var(--surface-variant)', borderRadius: '8px' }} />
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 0.3; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* HEADER PANEL */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
          Enterprise Configuration
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '2px' }}>
          Configure company localization variables, local currencies, GST invoice schemas, and personal accounts.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '28px',
        alignItems: 'start'
      }} className="settings-layout-split">
        
        {/* SETTINGS FORM PANEL */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* User profile Section */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', borderBottom: '1px solid var(--surface-variant)', paddingBottom: '10px', marginBottom: '16px' }}>
              Personal Identity Configurations
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Account Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Your full name"
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Sign-in Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="corporate@company.com"
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>
          </div>

          {/* Company details Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', borderBottom: '1px solid var(--surface-variant)', paddingBottom: '10px' }}>
              Company Ledger Environment
            </h3>
            
            {!isPrivileged && (
              <div className="glass-panel" style={{ padding: '12px 16px', backgroundColor: 'var(--warning-container)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '20px' }}>lock</span>
                <span style={{ fontSize: '12px', color: 'var(--on-warning-container)', fontWeight: '600' }}>
                  Enterprise parameters are locked. Contact your workspace Admin or CIO to configure billing settings.
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Registered Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  disabled={!isPrivileged}
                  value={formData.companyName}
                  onChange={handleFormChange}
                  placeholder="e.g. Aeloria Technologies"
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: isPrivileged ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Default Workspace Currency
                </label>
                <select
                  name="currency"
                  disabled={!isPrivileged}
                  value={formData.currency}
                  onChange={handleFormChange}
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: isPrivileged ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px', height: '40px' }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Corporate Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  disabled={!isPrivileged}
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="+1 (555) 019-3388"
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: isPrivileged ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  GSTIN / Corporate Tax ID
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  disabled={!isPrivileged}
                  value={formData.gstNumber}
                  onChange={handleFormChange}
                  placeholder="GST identification number"
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: isPrivileged ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Registered Business Address
              </label>
              <textarea
                name="address"
                disabled={!isPrivileged}
                value={formData.address}
                onChange={handleFormChange}
                placeholder="HQ building location address..."
                rows="3"
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: isPrivileged ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px', resize: 'none' }}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-variant)', paddingTop: '20px' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
              style={{ padding: '12px 32px', minWidth: '150px' }}
            >
              {saving ? 'Synchronizing...' : 'Save Settings'}
            </button>
          </div>

        </form>

        {/* SIDE LOGO BRAND CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Logo Card */}
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'flex-start' }}>
              Corporate Branding Logo
            </span>

            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--outline-variant)',
              backgroundColor: 'var(--surface-container-lowest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'var(--shadow-md)'
            }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline-variant)' }}>image</span>
              )}
            </div>

            {isPrivileged && (
              <div style={{ width: '100%' }}>
                <label 
                  className="btn btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '10px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
                  Upload Custom Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
                <p style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '8px' }}>
                  Supports PNG, JPG (Max 2MB). Auto-applied to issued billing invoice PDF exports.
                </p>
              </div>
            )}
          </div>

          {/* User Account Role Info card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Active Privileges
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800'
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '800' }}>{user?.name}</h4>
                <span className="badge badge-success" style={{ marginTop: '2px', display: 'inline-block' }}>{user?.role}</span>
              </div>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', borderTop: '1px solid var(--surface-variant)', paddingTop: '12px', marginTop: '4px' }}>
              {user?.role === 'Admin' && 'You possess full administrative command over this ledger dashboard workspace, teammate permissions, and settings configurations.'}
              {user?.role === 'CIO' && 'You are permitted to execute audits, write/modify ledger transactions, issue bills, and update settings profiles.'}
              {user?.role === 'Accountant' && 'You are permitted to execute audits, register clients, write/modify income and expenses logs, and generate invoice documents.'}
              {user?.role === 'Viewer' && 'You possess read-only observer permissions. You cannot add clients, modify transactions, or invite teammates.'}
            </p>
          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 992px) {
          .settings-layout-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
