import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const Invoices = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals status
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Record Payment fields
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Bank Transfer',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Create Invoice fields
  const [invoiceData, setInvoiceData] = useState({
    clientId: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days net
    items: [{ description: '', quantity: 1, rate: 0 }],
    gst: 18, // default 18% GST
    discount: 0,
    notes: ''
  });

  const canModify = user?.role === 'Admin' || user?.role === 'CIO' || user?.role === 'Accountant';
  const canDelete = user?.role === 'Admin' || user?.role === 'CIO';

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/invoices?search=${searchTerm}&status=${statusFilter}`);
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showToast('Failed to load invoice records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsDropdown = async () => {
    try {
      const res = await API.get('/clients?status=Active');
      if (res.data.success) {
        setClients(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching active clients:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchClientsDropdown();
  }, []);

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

  // Create Invoice Calculations
  const calculateInvoiceTotals = () => {
    const subtotal = invoiceData.items.reduce((acc, item) => acc + (item.quantity * item.rate || 0), 0);
    const gstAmount = subtotal * (Number(invoiceData.gst || 0) / 100);
    const total = subtotal + gstAmount - Number(invoiceData.discount || 0);
    return { subtotal, total };
  };

  const handleAddItemRow = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }]
    }));
  };

  const handleRemoveItemRow = (index) => {
    if (invoiceData.items.length <= 1) return;
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemFieldChange = (index, field, value) => {
    setInvoiceData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceData.clientId || invoiceData.items.some(item => !item.description || item.rate <= 0)) {
      showToast('Please specify an active client and valid item entries', 'error');
      return;
    }

    try {
      const res = await API.post('/invoices', invoiceData);
      if (res.data.success) {
        showToast('Invoice created and registered successfully!', 'success');
        setInvoices(prev => [res.data.data, ...prev]);
        setCreateModalOpen(false);
        // reset form
        setInvoiceData({
          clientId: '',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: [{ description: '', quantity: 1, rate: 0 }],
          gst: 18,
          discount: 0,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast(error.response?.data?.message || 'Failed to issue invoice', 'error');
    }
  };

  // Settle Invoice Payment
  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: (invoice.total - invoice.amountPaid).toFixed(2),
      paymentMethod: 'Bank Transfer',
      date: new Date().toISOString().split('T')[0],
      notes: `Settled balance for ${invoice.invoiceNumber}`
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      showToast('Please enter a positive settlement amount', 'error');
      return;
    }

    try {
      const res = await API.post(`/invoices/${selectedInvoice._id}/payment`, paymentData);
      if (res.data.success) {
        showToast('Payment settled and registered in Income Ledger!', 'success');
        setInvoices(prev => prev.map(inv => inv._id === selectedInvoice._id ? { ...inv, status: res.data.data.status, amountPaid: res.data.data.amountPaid } : inv));
        setPaymentModalOpen(false);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast(error.response?.data?.message || 'Failed to record invoice payment', 'error');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you absolutely certain you want to remove this invoice?')) return;
    try {
      const res = await API.delete(`/invoices/${id}`);
      if (res.data.success) {
        showToast('Invoice deleted', 'success');
        setInvoices(prev => prev.filter(inv => inv._id !== id));
      }
    } catch (error) {
      console.error('Error removing invoice:', error);
      showToast('Failed to delete invoice', 'error');
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      showToast(`Compiling invoice PDF for ${invoice.invoiceNumber}...`, 'success');
      const res = await API.get(`/invoices/${invoice._id}/pdf`, { responseType: 'blob' });
      
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      // Trigger native browser download
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error compiling PDF:', error);
      showToast('Error generating invoice PDF document', 'error');
    }
  };

  const { subtotal, total } = calculateInvoiceTotals();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Invoice Ledgers
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '2px' }}>
            Generate high-precision billings, record payments, and export beautiful corporate PDFs.
          </p>
        </div>

        {canModify && (
          <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Issue New Invoice
          </button>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', padding: '6px 12px', backgroundColor: 'var(--surface-container-lowest)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: '20px' }}>search</span>
          <input
            type="text"
            placeholder="Search by invoice number (e.g. INV-2026)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: 'var(--on-surface)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setStatusFilter('')} className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>All</button>
          <button onClick={() => setStatusFilter('Pending')} className={`btn ${statusFilter === 'Pending' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>Pending</button>
          <button onClick={() => setStatusFilter('Paid')} className={`btn ${statusFilter === 'Paid' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>Paid</button>
          <button onClick={() => setStatusFilter('Partial')} className={`btn ${statusFilter === 'Partial' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>Partial</button>
          <button onClick={() => setStatusFilter('Overdue')} className={`btn ${statusFilter === 'Overdue' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>Overdue</button>
        </div>
      </div>

      {/* INVOICES TABLE CONTAINER */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }} className="custom-scrollbar">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-container)', borderBottom: '1px solid var(--surface-variant)' }}>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice No</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Account</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtotal</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grand Total</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid Amt</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2].map(i => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--surface-variant)' }}>
                    <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: 'var(--outline)' }}>Loading data rows...</td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--outline-variant)', marginBottom: '8px' }}>receipt_long</span>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>No invoice entries discovered.</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} style={{ borderBottom: '1px solid var(--surface-variant)', transition: 'background-color 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600' }}>
                      {inv.clientId ? inv.clientId.name : 'Unknown client'}
                      <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: '500', marginTop: '2px' }}>
                        {inv.clientId?.companyName || 'Private Business'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                      {new Date(inv.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }} className="lining-numbers">{formatCurrency(inv.subtotal)}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: 'var(--on-surface)' }} className="lining-numbers">{formatCurrency(inv.total)}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }} className="lining-numbers">{formatCurrency(inv.amountPaid)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Partial' ? 'badge-neutral' : 'badge-pending'}`} style={{ fontSize: '9px' }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button onClick={() => handleDownloadPDF(inv)} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Download Corporate PDF">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
                        </button>
                        
                        {canModify && inv.status !== 'Paid' && (
                          <button onClick={() => handleOpenPaymentModal(inv)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
                            Settle Balance
                          </button>
                        )}

                        {canDelete && (
                          <button onClick={() => handleDeleteInvoice(inv._id)} className="btn btn-danger" style={{ padding: '6px 10px' }} title="Remove Invoice">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW INVOICE MODAL OVERLAY */}
      <AnimatePresence>
        {createModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setCreateModalOpen(false)} style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#000000' }} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '780px', backgroundColor: 'var(--background)', padding: '32px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Issue Enterprise Invoice</h3>
                <button onClick={() => setCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Account *</label>
                    <select
                      required
                      value={invoiceData.clientId}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, clientId: e.target.value }))}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    >
                      <option value="">Select active client...</option>
                      {clients.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.companyName || 'Private'})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Settlement Due Date *</label>
                    <input
                      type="date"
                      required
                      value={invoiceData.dueDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* LINE ITEMS BLOCK */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Item Matrix *</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {invoiceData.items.map((item, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '6fr 2fr 2fr 1fr', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          required
                          placeholder="Item description (e.g. Cloud API Architecture Design)"
                          value={item.description}
                          onChange={(e) => handleItemFieldChange(index, 'description', e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', fontSize: '13px', outline: 'none' }}
                        />
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', fontSize: '13px', outline: 'none' }}
                        />
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => handleItemFieldChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', fontSize: '13px', outline: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Remove item"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={handleAddItemRow} className="btn btn-secondary" style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '12px', marginTop: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    Add Line Item Row
                  </button>
                </div>

                {/* TAX, DISCOUNT, TOTAL COMPUTATION SUMMARIES */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', borderTop: '1px solid var(--surface-variant)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--on-surface-variant)' }}>GST rate (%)</label>
                        <input
                          type="number"
                          value={invoiceData.gst}
                          onChange={(e) => setInvoiceData(prev => ({ ...prev, gst: parseFloat(e.target.value) || 0 }))}
                          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--on-surface-variant)' }}>Discount amount</label>
                        <input
                          type="number"
                          value={invoiceData.discount}
                          onChange={(e) => setInvoiceData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--on-surface-variant)' }}>Private Notes (visible on PDF)</label>
                      <textarea
                        value={invoiceData.notes}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                        rows="2"
                        placeholder="Thank you for your business. Settle outstanding payment by Bank Wire."
                        style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', fontSize: '13px', resize: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '16px', backgroundColor: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--on-surface-variant)' }}>Subtotal:</span>
                      <span className="lining-numbers" style={{ fontWeight: '600' }}>{formatCurrency(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--on-surface-variant)' }}>GST ({invoiceData.gst}%):</span>
                      <span className="lining-numbers" style={{ fontWeight: '600' }}>{formatCurrency(subtotal * (Number(invoiceData.gst) / 100))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--on-surface-variant)' }}>Discount:</span>
                      <span className="lining-numbers" style={{ color: 'var(--error)', fontWeight: '600' }}>-{formatCurrency(invoiceData.discount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800' }}>
                      <span style={{ color: 'var(--primary)' }}>Grand Total:</span>
                      <span className="lining-numbers" style={{ color: 'var(--primary)' }}>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Register Invoice</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD PAYMENT MODAL OVERLAY */}
      <AnimatePresence>
        {paymentModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setPaymentModalOpen(false)} style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#000000' }} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '440px', backgroundColor: 'var(--background)', padding: '32px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Record Client Settlement</h3>
                <button onClick={() => setPaymentModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--surface-container-low)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-variant)' }}>
                <span style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: '600' }}>INVOICE BEING SETTLED</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>{selectedInvoice?.invoiceNumber}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>
                    Total: {formatCurrency(selectedInvoice?.total)}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                  Unpaid Balance: {formatCurrency((selectedInvoice?.total || 0) - (selectedInvoice?.amountPaid || 0))}
                </span>
              </div>

              <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Amount ({getCurrencySymbol()}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method *</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  >
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Stripe">Stripe Terminal</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Cash">Cash Ledger</option>
                    <option value="Cheque">Physical Cheque</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settlement Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentData.date}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, date: e.target.value }))}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Private Transaction Notes</label>
                  <input
                    type="text"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setPaymentModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Settle Ledger</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style>{`
        .table-row-hover:hover {
          background-color: var(--surface-container-low);
        }
      `}</style>
    </div>
  );
};

export default Invoices;
