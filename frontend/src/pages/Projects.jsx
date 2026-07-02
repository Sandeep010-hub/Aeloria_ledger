import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const Projects = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal settings
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null); // null for new, project object for edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'In Progress'
  });

  const canModify = user?.role === 'Admin' || user?.role === 'CIO' || user?.role === 'Accountant';
  const canDelete = user?.role === 'Admin' || user?.role === 'CIO';

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/projects?search=${searchTerm}&status=${statusFilter}`);
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('Failed to load projects list', 'error');
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
      console.error('Error fetching clients for dropdown:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300); // debounce API calls
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

  const handleOpenModal = (project = null) => {
    if (!canModify) {
      showToast('Insufficient permissions to modify projects', 'error');
      return;
    }
    if (project) {
      setCurrentProject(project);
      setFormData({
        name: project.name || '',
        description: project.description || '',
        clientId: project.clientId?._id || '',
        budget: project.budget || '',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        status: project.status || 'In Progress'
      });
    } else {
      setCurrentProject(null);
      setFormData({
        name: '',
        description: '',
        clientId: '',
        budget: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'In Progress'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentProject(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.clientId) {
      showToast('Project Name and Associated Client are required fields', 'error');
      return;
    }

    const submitData = {
      ...formData,
      budget: formData.budget === '' ? 0 : Number(formData.budget),
      endDate: formData.endDate === '' ? null : formData.endDate
    };

    try {
      let res;
      if (currentProject) {
        // Edit Project
        res = await API.put(`/projects/${currentProject._id}`, submitData);
        if (res.data.success) {
          showToast('Project updated successfully!', 'success');
          setProjects(prev => prev.map(p => p._id === currentProject._id ? res.data.data : p));
        }
      } else {
        // Add New Project
        res = await API.post('/projects', submitData);
        if (res.data.success) {
          showToast('Project created successfully!', 'success');
          setProjects(prev => [res.data.data, ...prev]);
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving project:', error);
      showToast(error.response?.data?.message || 'Failed to save project details', 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this project?')) return;
    try {
      const res = await API.delete(`/projects/${id}`);
      if (res.data.success) {
        showToast('Project deleted successfully', 'success');
        setProjects(prev => prev.filter(p => p._id !== id));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast(error.response?.data?.message || 'Failed to remove project', 'error');
    }
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Planning':
        return { backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' };
      case 'In Progress':
        return { backgroundColor: 'rgba(237, 108, 2, 0.08)', color: 'var(--warning)', border: '1px solid var(--warning-container)' };
      case 'Completed':
        return { backgroundColor: 'rgba(46, 125, 50, 0.08)', color: 'var(--success)', border: '1px solid var(--success-container)' };
      case 'On Hold':
        return { backgroundColor: 'rgba(81, 95, 120, 0.08)', color: 'var(--secondary)', border: '1px solid var(--outline-variant)' };
      case 'Cancelled':
        return { backgroundColor: 'rgba(186, 26, 26, 0.08)', color: 'var(--error)', border: '1px solid var(--error-container)' };
      default:
        return { backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)' };
    }
  };

  // Metrics Calculations
  const totalProjects = projects.length;
  const activePipeline = projects.filter(p => p.status === 'Planning' || p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const cumulativeBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Company Projects
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '2px' }}>
            Map operational pipelines, manage budgets, and track project timelines associated with Client accounts.
          </p>
        </div>

        {canModify && (
          <button onClick={() => handleOpenModal(null)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>business_center</span>
            Create New Project
          </button>
        )}
      </div>

      {/* METRIC SUMMARIES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        {/* Metric 1: Total Projects */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Projects</span>
          <h3 className="lining-numbers" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--on-background)', letterSpacing: '-0.02em' }}>{totalProjects}</h3>
          <span style={{ fontSize: '12px', color: 'var(--outline)' }}>Company initiatives</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--secondary)' }} />
        </div>

        {/* Metric 2: Active Pipeline */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Pipeline</span>
          <h3 className="lining-numbers" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--warning)', letterSpacing: '-0.02em' }}>{activePipeline}</h3>
          <span style={{ fontSize: '12px', color: 'var(--outline)' }}>Planning & In Progress</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--warning)' }} />
        </div>

        {/* Metric 3: Completed Deliveries */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Deliveries</span>
          <h3 className="lining-numbers" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--success)', letterSpacing: '-0.02em' }}>{completedProjects}</h3>
          <span style={{ fontSize: '12px', color: 'var(--outline)' }}>Successfully deployed</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--success)' }} />
        </div>

        {/* Metric 4: Cumulative Budget */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cumulative Budget</span>
          <h3 className="lining-numbers" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.02em' }}>{formatCurrency(cumulativeBudget)}</h3>
          <span style={{ fontSize: '12px', color: 'var(--outline)' }}>Contract allocations</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--primary)' }} />
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', padding: '6px 12px', backgroundColor: 'var(--surface-container-lowest)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: '20px' }}>search</span>
          <input
            type="text"
            placeholder="Search by project name, description, client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: 'var(--on-surface)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setStatusFilter('')} className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '12px' }}>All</button>
          <button onClick={() => setStatusFilter('Planning')} className={`btn ${statusFilter === 'Planning' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '12px' }}>Planning</button>
          <button onClick={() => setStatusFilter('In Progress')} className={`btn ${statusFilter === 'In Progress' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '12px' }}>In Progress</button>
          <button onClick={() => setStatusFilter('Completed')} className={`btn ${statusFilter === 'Completed' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '12px' }}>Completed</button>
          <button onClick={() => setStatusFilter('On Hold')} className={`btn ${statusFilter === 'On Hold' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '12px' }}>On Hold</button>
          <button onClick={() => setStatusFilter('Cancelled')} className={`btn ${statusFilter === 'Cancelled' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '12px' }}>Cancelled</button>
        </div>
      </div>

      {/* PROJECTS DISPLAY GRID */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel" style={{ height: '240px', padding: '24px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline-variant)', marginBottom: '16px' }}>business_center</span>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>No Projects Discovered</h3>
          <p style={{ fontSize: '14px', marginTop: '6px', maxWidth: '380px', margin: '6px auto 0 auto' }}>
            Get started by creating a new company project, mapping it to a client, and specifying the budget and timelines.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {projects.map(project => {
            const badgeStyle = getStatusBadgeStyles(project.status);
            return (
              <motion.div 
                key={project._id}
                className="glass-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
              >
                {/* Project Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.name}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700', marginTop: '2px' }} className="lining-numbers">
                      Budget: {formatCurrency(project.budget)}
                    </div>
                  </div>
                  <span className="badge" style={{ fontSize: '9px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: '700', textTransform: 'uppercase', ...badgeStyle }}>
                    {project.status}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', lineHeight: '18px', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {project.description || 'No project description documented.'}
                </p>

                {/* Associated Client Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--surface-variant)', paddingTop: '14px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Associated Client</span>
                  {project.clientId ? (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--on-surface)' }}>
                        {project.clientId.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                        {project.clientId.companyName || 'Private Operator'} • {project.clientId.email}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--error)', fontWeight: '500' }}>
                      No client associated.
                    </div>
                  )}
                </div>

                {/* Timeline info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', borderTop: '1px solid var(--surface-variant)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--outline)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--on-surface-variant)' }}>
                      {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--outline)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Due Date</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--on-surface-variant)' }}>
                      {project.endDate ? new Date(project.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'No deadline'}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                {canModify && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--surface-variant)', paddingTop: '14px' }}>
                    <button 
                      onClick={() => handleOpenModal(project)} 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                      Modify Details
                    </button>
                    {canDelete && (
                      <button 
                        onClick={() => handleDeleteProject(project._id)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px' }}
                        title="Remove Project Record"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
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
                  {currentProject ? 'Modify Project Record' : 'Record New Project'}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. cloud integration platform"
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Associated Client Account *
                  </label>
                  <select
                    name="clientId"
                    required
                    value={formData.clientId}
                    onChange={handleFormChange}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  >
                    <option value="">Select active client...</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>
                        {client.name} ({client.companyName || 'Private Operator'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Operational Budget ({getCurrencySymbol()})
                    </label>
                    <input
                      type="number"
                      name="budget"
                      min="0"
                      step="0.01"
                      value={formData.budget}
                      onChange={handleFormChange}
                      placeholder="e.g. 15000"
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Lifecycle Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    >
                      <option value="Planning">Planning phase</option>
                      <option value="In Progress">In Progress (Active)</option>
                      <option value="Completed">Completed / Deployed</option>
                      <option value="On Hold">On Hold (Pending)</option>
                      <option value="Cancelled">Cancelled (Archived)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      required
                      value={formData.startDate}
                      onChange={handleFormChange}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Target Due Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleFormChange}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Project Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Describe project details, features, team allocations, or deliverable milestones..."
                    rows="3"
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                    {currentProject ? 'Save Changes' : 'Launch Project'}
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

export default Projects;
