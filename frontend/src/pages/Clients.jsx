import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const Clients = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal configurations
  const [modalOpen, setModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null); // null for new, client object for edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    gstNumber: '',
    status: 'Active'
  });

  const canModify = user?.role === 'Admin' || user?.role === 'CIO' || user?.role === 'Accountant';
  const canDelete = user?.role === 'Admin' || user?.role === 'CIO';

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/clients?search=${searchTerm}&status=${statusFilter}`);
      if (res.data.success) {
        setClients(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      showToast('Failed to load clients list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 300); // debounce API calls
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const handleOpenModal = (client = null) => {
    if (!canModify) {
      showToast('Insufficient permissions to modify clients', 'error');
      return;
    }
    if (client) {
      setCurrentClient(client);
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        companyName: client.companyName || '',
        address: client.address || '',
        gstNumber: client.gstNumber || '',
        status: client.status || 'Active'
      });
    } else {
      setCurrentClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        address: '',
        gstNumber: '',
        status: 'Active'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentClient(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Name and Email are required fields', 'error');
      return;
    }

    try {
      let res;
      if (currentClient) {
        // Edit Client
        res = await API.put(`/clients/${currentClient._id}`, formData);
        if (res.data.success) {
          showToast('Client updated successfully!', 'success');
          setClients(prev => prev.map(c => c._id === currentClient._id ? res.data.data : c));
        }
      } else {
        // Add New Client
        res = await API.post('/clients', formData);
        if (res.data.success) {
          showToast('Client created successfully!', 'success');
          setClients(prev => [res.data.data, ...prev]);
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving client:', error);
      showToast(error.response?.data?.message || 'Failed to save client details', 'error');
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this client?')) return;
    try {
      const res = await API.delete(`/clients/${id}`);
      if (res.data.success) {
        showToast('Client deleted successfully', 'success');
        setClients(prev => prev.filter(c => c._id !== id));
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      showToast(error.response?.data?.message || 'Failed to remove client', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Client Directories
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '2px' }}>
            Store enterprise credentials, addresses, and localization tokens.
          </p>
        </div>

        {canModify && (
          <button onClick={() => handleOpenModal(null)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Add New Client
          </button>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', padding: '6px 12px', backgroundColor: 'var(--surface-container-lowest)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: '20px' }}>search</span>
          <input
            type="text"
            placeholder="Search by name, email, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: 'var(--on-surface)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setStatusFilter('')} 
            className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            All Clients
          </button>
          <button 
            onClick={() => setStatusFilter('Active')} 
            className={`btn ${statusFilter === 'Active' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Active
          </button>
          <button 
            onClick={() => setStatusFilter('Inactive')} 
            className={`btn ${statusFilter === 'Inactive' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* CLIENTS DISPLAY LIST */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel" style={{ height: '180px', padding: '24px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline-variant)', marginBottom: '16px' }}>group</span>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>No Clients Discovered</h3>
          <p style={{ fontSize: '14px', marginTop: '6px', maxWidth: '380px', margin: '6px auto 0 auto' }}>
            Get started by initializing a client account to log financial ledgers and issue bills.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {clients.map(client => (
            <motion.div 
              key={client._id}
              className="glass-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
            >
              {/* Client Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {client.name}
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--outline)', fontWeight: '600' }}>
                    {client.companyName || 'Private Operator'}
                  </span>
                </div>
                <span className={`badge ${client.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                  {client.status}
                </span>
              </div>

              {/* Client Contact Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--surface-variant)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--outline)' }}>mail</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
                </div>
                {client.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--outline)' }}>call</span>
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.gstNumber && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                    <span className="badge" style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)', fontSize: '9px', padding: '1px 6px' }}>TAX IN</span>
                    <span className="lining-numbers">{client.gstNumber}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              {canModify && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--surface-variant)', paddingTop: '14px' }}>
                  <button 
                    onClick={() => handleOpenModal(client)} 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    Modify
                  </button>
                  {canDelete && (
                    <button 
                      onClick={() => handleDeleteClient(client._id)} 
                      className="btn btn-danger" 
                      style={{ padding: '6px 12px' }}
                      title="Remove Account"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* OVERLAY MODAL FORM */}
      <AnimatePresence>
        {modalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#000000' }}
            />
            
            {/* Form Sheet Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel"
              style={{ position: 'relative', width: '100%', maxWidth: '500px', backgroundColor: 'var(--background)', padding: '32px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>
                  {currentClient ? 'Update Client Record' : 'Record New Client'}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Full Contact Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Samuel Carter"
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="samuel@company.com"
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Telephone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="+1 (555) 019-2834"
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleFormChange}
                      placeholder="e.g. Star Enterprises"
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      GSTIN / TAX Number
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleFormChange}
                      placeholder="e.g. 29AABBCC1122D1Z"
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Billing Address Description
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="128 Tech Corridor, Suite 500, San Francisco, CA"
                    rows="3"
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Corporate Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  >
                    <option value="Active">Active Operational Status</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                    {currentClient ? 'Save Changes' : 'Register Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
