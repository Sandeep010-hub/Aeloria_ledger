import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const Team = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal configuration
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState(null); // null for new, member object for edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Viewer'
  });

  const isAdmin = user?.role === 'Admin';

  // Fetch Team members list
  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await API.get('/team');
      if (res.data.success) {
        setMembers(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      showToast('Failed to load team workspace directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleOpenModal = (member = null) => {
    if (!isAdmin) {
      showToast('Only administrator accounts can invite or edit team members', 'error');
      return;
    }
    if (member) {
      setCurrentMember(member);
      setFormData({
        name: member.name || '',
        email: member.email || '',
        password: '', // Password is not returned or edited this way
        role: member.role || 'Viewer'
      });
    } else {
      setCurrentMember(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Viewer'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentMember(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (formData.role !== 'Viewer' && !formData.role)) {
      showToast('Name, Email and Role are required fields', 'error');
      return;
    }

    try {
      let res;
      if (currentMember) {
        // Edit Role
        res = await API.put(`/team/${currentMember._id}`, { role: formData.role });
        if (res.data.success) {
          showToast('Team member role updated!', 'success');
          setMembers(prev => prev.map(m => m._id === currentMember._id ? { ...m, role: res.data.data.role } : m));
        }
      } else {
        // Invite New member
        if (!formData.password) {
          formData.password = 'AeloriaPass123!'; // Default safe password
        }
        res = await API.post('/team', formData);
        if (res.data.success) {
          showToast('Workspace member registered successfully!', 'success');
          // Re-fetch to sort and show proper metadata
          fetchTeam();
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving team member:', error);
      showToast(error.response?.data?.message || 'Failed to save team workspace details', 'error');
    }
  };

  const handleDeleteMember = async (id) => {
    if (id === user?._id) {
      showToast('You cannot remove your own administrative account', 'error');
      return;
    }
    if (!window.confirm('Are you absolutely sure you want to remove this personnel from your workspace ledger ecosystem? They will lose dashboard privileges immediately.')) return;
    try {
      const res = await API.delete(`/team/${id}`);
      if (res.data.success) {
        showToast('Personnel removed from workspace successfully', 'success');
        setMembers(prev => prev.filter(m => m._id !== id));
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      showToast(error.response?.data?.message || 'Failed to remove member from database', 'error');
    }
  };

  // Filter team members list
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    if (role === 'Admin') return 'var(--primary)';
    if (role === 'CIO') return 'var(--success)';
    if (role === 'Accountant') return 'var(--warning)';
    return 'var(--outline)';
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'Admin') return 'badge-success';
    if (role === 'CIO') return 'badge-success';
    if (role === 'Accountant') return 'badge-neutral';
    return 'badge-neutral';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* HEADER PANEL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Workspace Personnel Hub
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '2px' }}>
            Invite members, assign analytical access tags, and restrict administrative rights.
          </p>
        </div>

        {isAdmin && (
          <button onClick={() => handleOpenModal(null)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Invite Team Member
          </button>
        )}
      </div>

      {/* METRIC SUMMARIES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        
        {/* Total personnel card */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Registered Users
          </span>
          <h3 className="lining-numbers" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            {members.length} Members
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Active logins in this environment</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--primary)' }} />
        </div>

        {/* Admins card */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Administrators
          </span>
          <h3 className="lining-numbers" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--success)', letterSpacing: '-0.02em' }}>
            {members.filter(m => m.role === 'Admin' || m.role === 'CIO').length} Directors
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Full read-write database privileges</span>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--success)' }} />
        </div>
      </div>

      {/* FILTER SEARCH GRID */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', padding: '6px 12px', backgroundColor: 'var(--surface-container-lowest)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: '20px' }}>search</span>
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: 'var(--on-surface)' }}
          />
        </div>

        {/* Role filters buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setRoleFilter('')} 
            className={`btn ${roleFilter === '' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            All Personnel
          </button>
          <button 
            onClick={() => setRoleFilter('Admin')} 
            className={`btn ${roleFilter === 'Admin' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            Admin
          </button>
          <button 
            onClick={() => setRoleFilter('CIO')} 
            className={`btn ${roleFilter === 'CIO' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            CIO
          </button>
          <button 
            onClick={() => setRoleFilter('Accountant')} 
            className={`btn ${roleFilter === 'Accountant' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            Accountant
          </button>
          <button 
            onClick={() => setRoleFilter('Viewer')} 
            className={`btn ${roleFilter === 'Viewer' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            Viewer
          </button>
        </div>
      </div>

      {/* TEAM DISPLAY GRID */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel" style={{ height: '180px', padding: '24px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline-variant)', marginBottom: '16px' }}>badge</span>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>No Personnel Discovered</h3>
          <p style={{ fontSize: '14px', marginTop: '6px', maxWidth: '380px', margin: '6px auto 0 auto' }}>
            No accounts mapped under search parameters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {filteredMembers.map((member) => (
            <motion.div 
              key={member._id}
              className="glass-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
            >
              {/* Member profile Header info */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: getRoleColor(member.role),
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '18px',
                  fontFamily: 'var(--font-heading)'
                }}>
                  {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.name} {member._id === user?._id && <span style={{ fontSize: '11px', color: 'var(--primary)', fontStyle: 'italic' }}>(You)</span>}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--outline)', wordBreak: 'break-all' }}>{member.email}</p>
                </div>
                <span className={`badge ${getRoleBadgeClass(member.role)}`} style={{ alignSelf: 'flex-start' }}>
                  {member.role}
                </span>
              </div>

              {/* Roles descriptions and creation date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--surface-variant)', paddingTop: '14px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ecosystem Privileges:</span>
                  <span style={{ fontWeight: '600', color: 'var(--on-surface)' }}>
                    {member.role === 'Admin' && 'System Owner'}
                    {member.role === 'CIO' && 'Ecosystem Auditor'}
                    {member.role === 'Accountant' && 'Finances Logger'}
                    {member.role === 'Viewer' && 'Dashboard Observer'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ecosystem Joined:</span>
                  <span className="lining-numbers" style={{ color: 'var(--on-surface)' }}>
                    {new Date(member.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Permissions & Controls */}
              {isAdmin && member._id !== user?._id && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--surface-variant)', paddingTop: '14px' }}>
                  <button 
                    onClick={() => handleOpenModal(member)} 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>shield</span>
                    Change Role
                  </button>
                  <button 
                    onClick={() => handleDeleteMember(member._id)} 
                    className="btn btn-danger" 
                    style={{ padding: '6px 12px' }}
                    title="Remove Account"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_remove</span>
                  </button>
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
              style={{ position: 'relative', width: '100%', maxWidth: '480px', backgroundColor: 'var(--background)', padding: '32px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>
                  {currentMember ? `Update Role: ${currentMember.name}` : 'Invite Workspace Personnel'}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Inviting fields (Only shown when new member) */}
                {!currentMember && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Full Personnel Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="e.g. Richard Hendricks"
                        style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Corporate Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="richard@aeloria.com"
                        style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Temporary Sign-in Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder="Default: AeloriaPass123!"
                        style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                      />
                    </div>
                  </>
                )}

                {/* Role select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Access Privilege Level
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none', fontSize: '14px' }}
                  >
                    <option value="Viewer">Viewer (Dashboard Observer)</option>
                    <option value="Accountant">Accountant (Logs Operations & Inflow/Outflows)</option>
                    <option value="CIO">CIO (Audits Books & Modifies Settings)</option>
                    <option value="Admin">Admin (Full Ownership & Controls)</option>
                  </select>
                </div>

                {/* Info alert */}
                <div className="glass-panel" style={{ padding: '12px 16px', backgroundColor: 'var(--surface-container)', fontSize: '12px', color: 'var(--on-surface-variant)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>info</span>
                  <span>System permissions update instantaneously upon saving. Invitees can use their credentials to log in.</span>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                    {currentMember ? 'Apply Permissions' : 'Invite Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default Team;
