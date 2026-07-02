import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const Income = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [incomes, setIncomes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal configuration
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIncome, setCurrentIncome] = useState(null); // null for new, income object for edit
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    paymentMethod: 'Bank Transfer',
    clientId: '',
    notes: '',
    status: 'Received'
  });

  const canModify = user?.role === 'Admin' || user?.role === 'CIO' || user?.role === 'Accountant';
  const canDelete = user?.role === 'Admin' || user?.role === 'CIO';

  // Available income categories
  const categories = [
    'Consulting Services',
    'SaaS Subscription',
    'Product Licensing',
    'Professional Fees',
    'Hardware Sales',
    'Asset Divestment',
    'Interest & Dividends',
    'Other Revenue'
  ];

  // Fetch Incomes & Clients on mount/search
  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const res = await API.get('/transactions/income');
      if (res.data.success) {
        setIncomes(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching income:', error);
      showToast('Failed to load income ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await API.get('/clients');
      if (res.data.success) {
        setClients(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchIncomes();
    fetchClients();
  }, []);

  const handleOpenModal = (income = null) => {
    if (!canModify) {
      showToast('Insufficient permissions to log income', 'error');
      return;
    }
    if (income) {
      setCurrentIncome(income);
      setFormData({
        title: income.title || '',
        amount: income.amount || '',
        date: income.date ? new Date(income.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: income.category || '',
        paymentMethod: income.paymentMethod || 'Bank Transfer',
        clientId: income.clientId?._id || income.clientId || '',
        notes: income.notes || '',
        status: income.status || 'Received'
      });
    } else {
      setCurrentIncome(null);
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: categories[0],
        paymentMethod: 'Bank Transfer',
        clientId: '',
        notes: '',
        status: 'Received'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentIncome(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category) {
      showToast('Title, Amount and Category are required fields', 'error');
      return;
    }

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      clientId: formData.clientId || null
    };

    try {
      let res;
      if (currentIncome) {
        // Edit Income
        res = await API.put(`/transactions/income/${currentIncome._id}`, payload);
        if (res.data.success) {
          showToast('Income ledger entry updated!', 'success');
          // Re-fetch to populate populated Client info properly
          fetchIncomes();
        }
      } else {
        // Add New Income
        res = await API.post('/transactions/income', payload);
        if (res.data.success) {
          showToast('Income entry logged successfully!', 'success');
          fetchIncomes();
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving income:', error);
      showToast(error.response?.data?.message || 'Failed to record transaction', 'error');
    }
  };

  const handleDeleteIncome = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this income entry? This will permanently reverse it in the dashboard stats.')) return;
    try {
      const res = await API.delete(`/transactions/income/${id}`);
      if (res.data.success) {
        showToast('Income record removed', 'success');
        setIncomes(prev => prev.filter(item => item._id !== id));
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      showToast(error.response?.data?.message || 'Failed to remove income record', 'error');
    }
  };

  // Currency utility formatting
  const getCurrencySymbol = () => {
    const currency = user?.companyDetails?.currency || 'USD';
    if (currency === 'EUR') return '€';
    if (currency === 'GBP') return '£';
    if (currency === 'INR') return '₹';
    return '$';
  };

  const formatCurrency = (val) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filtered income logs
  const filteredIncomes = incomes.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.clientId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || item.status === statusFilter;
    const matchesCategory = categoryFilter === '' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate high-fidelity stats
  const totalReceived = incomes
    .filter(item => item.status === 'Received')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalPending = incomes
    .filter(item => item.status === 'Pending')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalIncome = totalReceived + totalPending;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* HEADER PANEL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Inflow Revenue Ledger
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '2px' }}>
            Track client subscriptions, consulting payouts, assets, and other operational income streams.
          </p>
        </div>

        {canModify && (
          <button onClick={() => handleOpenModal(null)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            Record Direct Income
          </button>
        )}
      </div>

      {/* METRIC SUMMARIES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        
        {/* Total Income */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Aggregated Gross Revenue
          </span>
          <h3 className="lining-numbers" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            {formatCurrency(totalIncome)}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Total recorded inflow streams</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--primary)' }} />
        </div>

        {/* Settled Income */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Settled Balance
          </span>
          <h3 className="lining-numbers" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--success)', letterSpacing: '-0.02em' }}>
            {formatCurrency(totalReceived)}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Cleared in banks/payment processors</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--success)' }} />
        </div>

        {/* Pending Income */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pending Realizations
          </span>
          <h3 className="lining-numbers" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--warning)', letterSpacing: '-0.02em' }}>
            {formatCurrency(totalPending)}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Unearned and active invoice estimates</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--warning)' }} />
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '2 1 280px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', padding: '8px 14px', backgroundColor: 'var(--surface-container-lowest)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: '20px' }}>search</span>
          <input
            type="text"
            placeholder="Search by title, notes, or client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: 'var(--on-surface)' }}
          />
        </div>

        {/* Category Select */}
        <div style={{ flex: '1 1 180px' }}>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)} 
            className="input-field" 
            style={{ padding: '8px 12px', fontSize: '13px', width: '100%', height: '38px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setStatusFilter('')} 
            className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 14px', fontSize: '13px', height: '38px' }}
          >
            All Items
          </button>
          <button 
            onClick={() => setStatusFilter('Received')} 
            className={`btn ${statusFilter === 'Received' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 14px', fontSize: '13px', height: '38px' }}
          >
            Received
          </button>
          <button 
            onClick={() => setStatusFilter('Pending')} 
            className={`btn ${statusFilter === 'Pending' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 14px', fontSize: '13px', height: '38px' }}
          >
            Pending
          </button>
        </div>
      </div>

      {/* REVENUE TABLE */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '40px', backgroundColor: 'var(--surface-variant)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filteredIncomes.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline-variant)', marginBottom: '16px' }}>payments</span>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>No Inbound Cashflows Logged</h3>
          <p style={{ fontSize: '14px', marginTop: '6px', maxWidth: '380px', margin: '6px auto 0 auto' }}>
            Record an enterprise income entry or issue invoices to client directories to build transaction lists.
          </p>
        </div>
      ) : (
        <div className="glass-panel custom-scrollbar" style={{ padding: 0, overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-variant)', backgroundColor: 'var(--surface-container-low)' }}>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inflow Title</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Account</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Method</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                {canModify && <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredIncomes.map((item) => (
                <tr 
                  key={item._id} 
                  style={{ borderBottom: '1px solid var(--surface-variant)', transition: 'background-color 0.2s' }}
                  className="table-row-hover"
                >
                  {/* Date */}
                  <td className="lining-numbers" style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--on-surface)' }}>
                    {new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  {/* Title */}
                  <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--on-surface)' }}>
                    <div>
                      {item.title}
                      {item.notes && (
                        <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: '400', marginTop: '2px' }}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Category */}
                  <td style={{ padding: '16px 24px' }}>
                    <span className="badge" style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '10px' }}>
                      {item.category}
                    </span>
                  </td>
                  {/* Client Account */}
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                    {item.clientId?.name ? (
                      <span style={{ fontWeight: '500' }}>
                        {item.clientId.name}
                        {item.clientId.companyName && (
                          <span style={{ fontSize: '11px', color: 'var(--outline)', display: 'block' }}>
                            {item.clientId.companyName}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--outline)', fontSize: '12px', fontStyle: 'italic' }}>Direct Operations</span>
                    )}
                  </td>
                  {/* Payment Method */}
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                    {item.paymentMethod}
                  </td>
                  {/* Status */}
                  <td style={{ padding: '16px 24px' }}>
                    <span className={`badge ${item.status === 'Received' ? 'badge-success' : 'badge-neutral'}`}>
                      {item.status}
                    </span>
                  </td>
                  {/* Amount */}
                  <td className="lining-numbers" style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: 'var(--primary)', textAlign: 'right' }}>
                    {formatCurrency(item.amount)}
                  </td>
                  {/* Actions */}
                  {canModify && (
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleOpenModal(item)} 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                          Edit
                        </button>
                        {canDelete && (
                          <button 
                            onClick={() => handleDeleteIncome(item._id)} 
                            className="btn btn-danger" 
                            style={{ padding: '6px' }}
                            title="Delete Transaction"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
              style={{ position: 'relative', width: '100%', maxWidth: '520px', backgroundColor: 'var(--background)', padding: '32px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.01em' }}>
                  {currentIncome ? 'Edit Income Transaction' : 'Record Inward Cashflow'}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Transaction Label / Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Q2 consulting retainers"
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                {/* Amount & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Amount ({getCurrencySymbol()}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="amount"
                      required
                      value={formData.amount}
                      onChange={handleFormChange}
                      placeholder="0.00"
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleFormChange}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* Category & Payment Method */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Income Category *
                    </label>
                    <select
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleFormChange}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Payment Method
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleFormChange}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Stripe">Stripe Gateway</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Cash">Cash Ledger</option>
                      <option value="Cheque">Corporate Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Client Reference */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Associate Client Account
                  </label>
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleFormChange}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  >
                    <option value="">-- No Association (Direct Inflow) --</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Transaction Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    placeholder="Enter secondary ledger details, reference numbers or metadata..."
                    rows="2"
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px', resize: 'none' }}
                  />
                </div>

                {/* Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Settlement Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  >
                    <option value="Received">Settled / Cleared</option>
                    <option value="Pending">Pending Realization</option>
                  </select>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                    {currentIncome ? 'Save Changes' : 'Record Transaction'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .table-row-hover:hover {
          background-color: var(--surface-container-lowest) !important;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default Income;
