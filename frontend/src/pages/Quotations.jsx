import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const Quotations = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal configs
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState({
    clientId: '',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days valid
    items: [{ description: '', quantity: 1, rate: 0 }],
    gst: 18,
    discount: 0,
    status: 'Draft',
    notes: ''
  });

  const canModify = user?.role === 'Admin' || user?.role === 'CIO' || user?.role === 'Accountant';
  const canDelete = user?.role === 'Admin' || user?.role === 'CIO';

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/quotations?search=${searchTerm}&status=${statusFilter}`);
      if (res.data.success) {
        setQuotations(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      showToast('Failed to load quotation records', 'error');
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
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuotations();
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

  const calculateTotals = () => {
    const subtotal = quoteData.items.reduce((acc, item) => acc + (item.quantity * item.rate || 0), 0);
    const gstAmount = subtotal * (Number(quoteData.gst || 0) / 100);
    const total = subtotal + gstAmount - Number(quoteData.discount || 0);
    return { subtotal, total };
  };

  const handleAddItemRow = () => {
    setQuoteData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }]
    }));
  };

  const handleRemoveItemRow = (index) => {
    if (quoteData.items.length <= 1) return;
    setQuoteData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemFieldChange = (index, field, value) => {
    setQuoteData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!quoteData.clientId || quoteData.items.some(item => !item.description || item.rate <= 0)) {
      showToast('Please specify an active client and valid item entries', 'error');
      return;
    }

    try {
      const res = await API.post('/quotations', quoteData);
      if (res.data.success) {
        showToast('Quotation created successfully!', 'success');
        setQuotations(prev => [res.data.data, ...prev]);
        setCreateModalOpen(false);
        setQuoteData({
          clientId: '',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: [{ description: '', quantity: 1, rate: 0 }],
          gst: 18,
          discount: 0,
          status: 'Draft',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      showToast(error.response?.data?.message || 'Failed to register quotation', 'error');
    }
  };

  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Are you absolutely certain you want to remove this quotation?')) return;
    try {
      const res = await API.delete(`/quotations/${id}`);
      if (res.data.success) {
        showToast('Quotation deleted successfully', 'success');
        setQuotations(prev => prev.filter(q => q._id !== id));
      }
    } catch (error) {
      console.error('Error removing quotation:', error);
      showToast('Failed to delete quotation', 'error');
    }
  };

  const handleUpdateStatus = async (quote, newStatus) => {
    try {
      const res = await API.put(`/quotations/${quote._id}`, { status: newStatus });
      if (res.data.success) {
        showToast(`Quotation status updated to ${newStatus}`, 'success');
        setQuotations(prev => prev.map(q => q._id === quote._id ? { ...q, status: newStatus } : q));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDownloadPDF = async (quote) => {
    try {
      showToast(`Compiling quotation PDF for ${quote.quotationNumber}...`, 'success');
      const res = await API.get(`/quotations/${quote._id}/pdf`, { responseType: 'blob' });
      
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `quotation-${quote.quotationNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showToast('Error generating PDF document', 'error');
    }
  };

  const { subtotal, total } = calculateTotals();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Quote Center
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '2px' }}>
            Draft estimates, manage collection statuses, and stream professional PDFs to clients.
          </p>
        </div>

        {canModify && (
          <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Draft New Quotation
          </button>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', padding: '6px 12px', backgroundColor: 'var(--surface-container-lowest)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: '20px' }}>search</span>
          <input
            type="text"
            placeholder="Search by quote number (e.g. QT-2026)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: 'var(--on-surface)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setStatusFilter('')} className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>All</button>
          <button onClick={() => setStatusFilter('Draft')} className={`btn ${statusFilter === 'Draft' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>Draft</button>
          <button onClick={() => setStatusFilter('Sent')} className={`btn ${statusFilter === 'Sent' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>Sent</button>
          <button onClick={() => setStatusFilter('Accepted')} className={`btn ${statusFilter === 'Accepted' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>Accepted</button>
          <button onClick={() => setStatusFilter('Rejected')} className={`btn ${statusFilter === 'Rejected' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>Rejected</button>
        </div>
      </div>

      {/* QUOTATIONS TABLE CONTAINER */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }} className="custom-scrollbar">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-container)', borderBottom: '1px solid var(--surface-variant)' }}>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quotation No</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Account</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Validity Date</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtotal</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grand Total</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr style={{ borderBottom: '1px solid var(--surface-variant)' }}>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--outline)' }}>Loading data streams...</td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--outline-variant)', marginBottom: '8px' }}>description</span>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>No quotation records found.</p>
                  </td>
                </tr>
              ) : (
                quotations.map((quote) => (
                  <tr key={quote._id} style={{ borderBottom: '1px solid var(--surface-variant)', transition: 'background-color 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>{quote.quotationNumber}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600' }}>
                      {quote.clientId ? quote.clientId.name : 'Unknown client'}
                      <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: '500', marginTop: '2px' }}>
                        {quote.clientId?.companyName || 'Private Business'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                      {quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'No Expiry'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }} className="lining-numbers">{formatCurrency(quote.subtotal)}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: 'var(--on-surface)' }} className="lining-numbers">{formatCurrency(quote.total)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge ${quote.status === 'Accepted' ? 'badge-success' : quote.status === 'Rejected' ? 'badge-danger' : quote.status === 'Sent' ? 'badge-neutral' : 'badge-pending'}`} style={{ fontSize: '9px' }}>
                        {quote.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button onClick={() => handleDownloadPDF(quote)} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Download PDF">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
                        </button>
                        
                        {canModify && (
                          <select
                            value={quote.status}
                            onChange={(e) => handleUpdateStatus(quote, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontSize: '12px', outline: 'none' }}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        )}

                        {canDelete && (
                          <button onClick={() => handleDeleteQuotation(quote._id)} className="btn btn-danger" style={{ padding: '6px 10px' }} title="Remove Quotation">
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

      {/* CREATE NEW QUOTATION MODAL OVERLAY */}
      <AnimatePresence>
        {createModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setCreateModalOpen(false)} style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#000000' }} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '780px', backgroundColor: 'var(--background)', padding: '32px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Draft Technical Quotation</h3>
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
                      value={quoteData.clientId}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, clientId: e.target.value }))}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    >
                      <option value="">Select active client...</option>
                      {clients.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.companyName || 'Private'})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quote Validity Expiry *</label>
                    <input
                      type="date"
                      required
                      value={quoteData.expiryDate}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* LINE ITEMS BLOCK */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Specifications *</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {quoteData.items.map((item, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '6fr 2fr 2fr 1fr', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          required
                          placeholder="Specification details (e.g. Backend API Route Implementation)"
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
                          title="Remove row"
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

                {/* TAX, DISCOUNT AND TOTAL SUMMARIES */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', borderTop: '1px solid var(--surface-variant)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--on-surface-variant)' }}>GST rate (%)</label>
                        <input
                          type="number"
                          value={quoteData.gst}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, gst: parseFloat(e.target.value) || 0 }))}
                          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--on-surface-variant)' }}>Discount amount</label>
                        <input
                          type="number"
                          value={quoteData.discount}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--on-surface-variant)' }}>Terms & Scope Notes (printed on PDF)</label>
                      <textarea
                        value={quoteData.notes}
                        onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
                        rows="2"
                        placeholder="Estimates are valid for 30 days. Delivery scheduled 4 weeks post accepting."
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
                      <span style={{ color: 'var(--on-surface-variant)' }}>GST ({quoteData.gst}%):</span>
                      <span className="lining-numbers" style={{ fontWeight: '600' }}>{formatCurrency(subtotal * (Number(quoteData.gst) / 100))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--on-surface-variant)' }}>Discount:</span>
                      <span className="lining-numbers" style={{ color: 'var(--error)', fontWeight: '600' }}>-{formatCurrency(quoteData.discount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800' }}>
                      <span style={{ color: 'var(--primary)' }}>Grand Total:</span>
                      <span className="lining-numbers" style={{ color: 'var(--primary)' }}>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Draft Estimate</button>
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

export default Quotations;
