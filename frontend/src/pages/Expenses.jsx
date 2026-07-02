import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const Expenses = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Modal configs
  const [modalOpen, setModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null); // null for new, expense for edit
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    paymentMethod: 'Cash',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const canModify = user?.role === 'Admin' || user?.role === 'CIO' || user?.role === 'Accountant';
  const canDelete = user?.role === 'Admin' || user?.role === 'CIO';

  // Available expense categories
  const categories = [
    'Office Rent & Utilities',
    'Server & Cloud Infrastructure',
    'SaaS Licenses & Software',
    'Employee Payroll',
    'Contractor Billings',
    'Marketing & Advertising',
    'Travel & Hospitality',
    'Corporate Tax & Duties',
    'General Expenditures'
  ];

  const paymentMethods = [
    'Cash',
    'Corporate Card',
    'Bank Wire',
    'PayPal Account',
    'Direct Debit'
  ];

  // Fetch Expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await API.get('/transactions/expenses');
      if (res.data.success) {
        setExpenses(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showToast('Failed to load expense records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenModal = (expense = null) => {
    if (!canModify) {
      showToast('Insufficient permissions to log expenses', 'error');
      return;
    }
    setSelectedFile(null);
    if (expense) {
      setCurrentExpense(expense);
      setFormData({
        title: expense.title || '',
        amount: expense.amount || '',
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: expense.category || '',
        paymentMethod: expense.paymentMethod || 'Cash',
        notes: expense.notes || ''
      });
    } else {
      setCurrentExpense(null);
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: categories[0],
        paymentMethod: 'Cash',
        notes: ''
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentExpense(null);
    setSelectedFile(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category) {
      showToast('Title, Amount and Category are required fields', 'error');
      return;
    }

    // Build Multipart form data payload to support file upload
    const data = new FormData();
    data.append('title', formData.title);
    data.append('amount', parseFloat(formData.amount));
    data.append('date', formData.date);
    data.append('category', formData.category);
    data.append('paymentMethod', formData.paymentMethod);
    data.append('notes', formData.notes);
    
    if (selectedFile) {
      data.append('receipt', selectedFile);
    }

    try {
      let res;
      if (currentExpense) {
        // Edit Expense
        res = await API.put(`/transactions/expenses/${currentExpense._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          showToast('Expense record updated successfully', 'success');
          fetchExpenses();
        }
      } else {
        // Add New Expense
        res = await API.post('/transactions/expenses', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          showToast('Expense entry logged successfully!', 'success');
          fetchExpenses();
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving expense:', error);
      showToast(error.response?.data?.message || 'Failed to save expense log', 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this expense record? This action will decrease your recorded expenditures.')) return;
    try {
      const res = await API.delete(`/transactions/expenses/${id}`);
      if (res.data.success) {
        showToast('Expense record deleted', 'success');
        setExpenses(prev => prev.filter(e => e._id !== id));
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast(error.response?.data?.message || 'Failed to remove expense', 'error');
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

  // Filtered expense list
  const filteredExpenses = expenses.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || item.category === categoryFilter;
    const matchesMethod = methodFilter === '' || item.paymentMethod === methodFilter;
    return matchesSearch && matchesCategory && matchesMethod;
  });

  // Aggregated totals
  const totalExpenditure = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* HEADER PANEL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Operating Expenditures Ledger
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '2px' }}>
            Record workspace purchases, cloud invoices, payroll distributions, and utility payments.
          </p>
        </div>

        {canModify && (
          <button onClick={() => handleOpenModal(null)} className="btn btn-primary" style={{ padding: '10px 18px', backgroundColor: 'var(--error)', borderColor: 'var(--error)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>remove_circle</span>
            Record Outflow Cost
          </button>
        )}
      </div>

      {/* METRIC CARD PANEL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        
        {/* Total Cost card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Expenditures Invoiced
          </span>
          <h3 className="lining-numbers" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--error)', letterSpacing: '-0.02em' }}>
            {formatCurrency(totalExpenditure)}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Aggregated operating costs to date</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--error)' }} />
        </div>

        {/* Categories card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Cost Centers
          </span>
          <h3 className="lining-numbers" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            {Array.from(new Set(expenses.map(e => e.category))).length} Centers
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Active financial classification departments</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--secondary)' }} />
        </div>
      </div>

      {/* FILTER SEARCH GRID */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '2 1 240px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', padding: '8px 14px', backgroundColor: 'var(--surface-container-lowest)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: '20px' }}>search</span>
          <input
            type="text"
            placeholder="Search by label or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: 'var(--on-surface)' }}
          />
        </div>

        {/* Category select */}
        <div style={{ flex: '1 1 180px' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13px', width: '100%', height: '38px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Payment Method filter */}
        <div style={{ flex: '1 1 180px' }}>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13px', width: '100%', height: '38px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none' }}
          >
            <option value="">All Pay Methods</option>
            {paymentMethods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* EXPENSES GRID TABLE */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '40px', backgroundColor: 'var(--surface-variant)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline-variant)', marginBottom: '16px' }}>shopping_bag</span>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>No Cost Events Discovered</h3>
          <p style={{ fontSize: '14px', marginTop: '6px', maxWidth: '380px', margin: '6px auto 0 auto' }}>
            Click record outflow cost to log bills, receipt files, software licenses, or wages invoices.
          </p>
        </div>
      ) : (
        <div className="glass-panel custom-scrollbar" style={{ padding: 0, overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-variant)', backgroundColor: 'var(--surface-container-low)' }}>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expense Label</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Receipt</th>
                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                {canModify && <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((item) => (
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
                    <span className="badge" style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)', fontSize: '10px' }}>
                      {item.category}
                    </span>
                  </td>
                  {/* Payment Method */}
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                    {item.paymentMethod}
                  </td>
                  {/* Receipt */}
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    {item.receiptUrl ? (
                      <a 
                        href={item.receiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-secondary" 
                        style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>receipt</span>
                        Receipt
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--outline)', fontStyle: 'italic' }}>None Attached</span>
                    )}
                  </td>
                  {/* Amount */}
                  <td className="lining-numbers" style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: 'var(--error)', textAlign: 'right' }}>
                    -{formatCurrency(item.amount)}
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
                            onClick={() => handleDeleteExpense(item._id)} 
                            className="btn btn-danger" 
                            style={{ padding: '6px' }}
                            title="Delete Cost Record"
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
                  {currentExpense ? 'Modify Outflow cost' : 'Record Operating Cost'}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Expense Label / Description *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="e.g. AWS Cloud Invoice April"
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                {/* Amount & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
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
                      Billing Date *
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Department Category *
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
                      {paymentMethods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Receipt upload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Attach Expense Receipt / Document
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    style={{ fontSize: '13px', color: 'var(--on-surface-variant)', padding: '6px 0' }}
                  />
                  {currentExpense?.receiptUrl && !selectedFile && (
                    <div style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                      Active Receipt is currently stored in database cloud.
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Transaction Notes / Remarks
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    placeholder="Enter vendor details, wire transfer IDs, or metadata details..."
                    rows="2"
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px', resize: 'none' }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px', backgroundColor: 'var(--error)', borderColor: 'var(--error)' }}>
                    {currentExpense ? 'Save Changes' : 'Record Expenditure'}
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

export default Expenses;
