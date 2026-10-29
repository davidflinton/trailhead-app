import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MoreVertical, Mail, MessageSquare, Key, RefreshCw, 
  QrCode, UserX, UserCheck, Trash2, Search, Users, FileText, Upload, X, Save, Phone, MapPin, Briefcase, User, ChevronDown, ChevronUp
} from 'lucide-react';
import PageHeader from './PageHeader';

export default function StaffManager({ supabase, selectedPropertyName, colors, fonts }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({});
  const [userDocuments, setUserDocuments] = useState([]);
  
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!supabase) return;
    let query = supabase
      .from('trailhead_personnel')
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching trailhead personnel:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return

    let isCurrent = true
    async function loadInitialUsers() {
      setLoading(true)
      const { data, error } = await supabase
        .from('trailhead_personnel')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isCurrent) return
      if (error) {
        console.error('Error fetching trailhead personnel:', error)
      } else {
        setUsers(data || [])
      }
      setLoading(false)
    }

    void loadInitialUsers()
    return () => { isCurrent = false }
  }, [selectedPropertyName, supabase]);

  function getDisplayName(user) {
    if (user.display_name && user.display_name.trim() !== '') {
      return user.display_name;
    }
    const standardName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    if (standardName) return standardName;
    return user.name || 'Unnamed Personnel';
  }

  function handleOpenDetails(user) {
    setSelectedUser(user);
    setUserForm(user);
    setActiveMenuId(null);
    setUserDocuments([
      { id: '1', name: 'Personnel_Agreement.pdf', size: '210 KB', date: '2026-06-12' },
      { id: '2', name: 'Background_Check_Cleared.pdf', size: '95 KB', date: '2026-06-12' }
    ]);
  }

  async function handleSaveUser() {
    if (!selectedUser) return;
    const { error } = await supabase
      .from('trailhead_personnel')
      .update(userForm)
      .eq('id', selectedUser.id);

    if (error) {
      setActionMessage({ type: 'error', text: 'Failed to update user profile: ' + error.message });
    } else {
      setActionMessage({ type: 'success', text: 'User profile updated successfully.' });
      fetchUsers();
      setSelectedUser(null);
    }
  }

  async function handleAction(action, user) {
    if (!supabase) return;
    setActiveMenuId(null);
    setActionMessage(null);

    const userName = getDisplayName(user);

    switch (action) {
      case 'email':
        try {
          const res = await fetch('https://lahzovurbugnptoszlxj.supabase.co/functions/v1/send-staff-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.work_email || user.email,
              trailheadId: user.trailhead_id || user.id,
              passphrase: user.passphrase || '********',
              type: 'new_account'
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to send email');
          setActionMessage({ type: 'success', text: `Email successfully sent to ${user.work_email || user.email}` });
        } catch (err) {
          setActionMessage({ type: 'error', text: err.message });
        }
        break;

      case 'text':
        alert(`SMS text dispatch for ${userName} goes here.`);
        break;

      case 'view_passphrase':
        setModalType('passphrase');
        setModalData(user);
        break;

      case 'reset_passphrase':
        {
          const newPass = Math.random().toString(36).substring(2, 10);
          const { error: resetErr } = await supabase
            .from('trailhead_personnel')
            .update({ passphrase: newPass })
            .eq('id', user.id);

          if (resetErr) {
            setActionMessage({ type: 'error', text: 'Failed to reset passphrase' });
          } else {
            setActionMessage({ type: 'success', text: `Passphrase reset for ${userName}` });
            fetchUsers();
          }
        }
        break;

      case 'qr':
        setModalType('qr');
        setModalData(user);
        break;

      case 'toggle_disable':
        {
          const newStatus = !(user.active ?? true);
          const { error: statusErr } = await supabase
            .from('trailhead_personnel')
            .update({ active: newStatus })
            .eq('id', user.id);

          if (statusErr) {
            setActionMessage({ type: 'error', text: 'Failed to update user status' });
          } else {
            fetchUsers();
          }
        }
        break;

      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) {
          const { error: deleteErr } = await supabase
            .from('trailhead_personnel')
            .delete()
            .eq('id', user.id);

          if (deleteErr) {
            setActionMessage({ type: 'error', text: 'Failed to delete user' });
          } else {
            fetchUsers();
          }
        }
        break;

      default:
        break;
    }
  }

  const getDisplayRole = (user) => (user.system_role || user.job_title || user.access_tier || 'Staff').replaceAll('_', ' ')
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const roleOptions = [...new Set(users.map(getDisplayRole))].sort((a, b) => a.localeCompare(b))
  const activeUsers = users.filter(user => user.active !== false).length
  const filteredUsers = users
    .filter(user => {
      const fullName = getDisplayName(user)
      const displayId = user.trailhead_id || ''
      const userEmail = user.work_email || user.personal_email || user.email || ''
      const role = getDisplayRole(user)
      const matchesSearch = !normalizedSearch || [fullName, displayId, userEmail, role]
        .some(value => value.toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.active !== false : user.active === false)
      const matchesRole = roleFilter === 'all' || role === roleFilter
      return matchesSearch && matchesStatus && matchesRole
    })
    .sort((a, b) => {
      const valueFor = (user) => {
        if (sortConfig.key === 'name') return getDisplayName(user)
        if (sortConfig.key === 'role') return getDisplayRole(user)
        if (sortConfig.key === 'status') return user.active === false ? 'Disabled' : 'Active'
        return user.trailhead_id || user.id || ''
      }
      const result = valueFor(a).localeCompare(valueFor(b), undefined, { numeric: true, sensitivity: 'base' })
      return sortConfig.direction === 'asc' ? result : -result
    })

  function toggleSort(key) {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Reusable Styling Helpers for StaffManager
  const fieldContainerStyle = { display: 'flex', flexDirection: 'column', gap: '6px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontFamily: 'monospace', color: 'var(--staff-muted)', fontWeight: 'bold', letterSpacing: '0.5px' };
  const inputStyle = { width: '100%', height: '40px', boxSizing: 'border-box', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--staff-border)', backgroundColor: 'var(--staff-panel)', color: 'var(--staff-text)', fontFamily: 'sans-serif', fontSize: '14px', outline: 'none' };
  const sectionHeaderStyle = { fontSize: '16px', fontWeight: 'bold', color: 'var(--staff-primary)', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--staff-border)', paddingBottom: '8px', letterSpacing: '0.5px' };
  const filterButtonStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 13px',
    backgroundColor: active ? 'var(--staff-highlight)' : 'transparent',
    color: active ? 'var(--staff-text)' : 'var(--staff-muted)',
    border: `1px solid ${active ? 'var(--staff-primary)' : 'var(--staff-border)'}`,
    borderRadius: '6px', cursor: 'pointer', fontFamily: fonts?.utility || 'monospace',
    fontSize: '12px', fontWeight: active ? 'bold' : 'normal', whiteSpace: 'nowrap'
  });
  const sortButton = (label, key) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0, border: 'none', background: 'none', color: 'var(--staff-muted)', font: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit', cursor: 'pointer' }}
    >
      {label}
      {sortConfig.key === key && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
    </button>
  );

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1200px',
      width: '100%',
      boxSizing: 'border-box',
      margin: '0 auto',
      color: 'var(--staff-text)',
      fontFamily: fonts?.body || 'sans-serif',
      '--staff-background': colors?.background || '#171D29',
      '--staff-sidebar': colors?.sidebar || '#1D2533',
      '--staff-panel': colors?.panel || '#222C3C',
      '--staff-border': colors?.border || '#39465C',
      '--staff-highlight': colors?.highlight || '#303B50',
      '--staff-primary': colors?.primary || '#8E9BF0',
      '--staff-error': colors?.error || '#F17878',
      '--staff-text': colors?.textDark || '#E8EDF5',
      '--staff-muted': colors?.muted || '#A5B0C0'
    }}>
      <PageHeader
        title="Staff Directory"
        subtitle={`Manage staff identities${selectedPropertyName ? ` for ${selectedPropertyName}` : ' across your organization'}`}
        icon={Users}
        colors={colors}
        fonts={fonts}
        eyebrow={<>DIRECTORY <span style={{ padding: '0 7px' }}>/</span> STAFF DIRECTORY</>}
        status="Directory synced"
        padding="0"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total accounts', value: users.length, detail: 'Directory identities' },
          { label: 'Active', value: activeUsers, detail: 'Can access Trailhead' },
          { label: 'Disabled', value: users.length - activeUsers, detail: 'Access suspended' }
        ].map((stat) => (
          <div key={stat.label} style={{ padding: '16px 18px', backgroundColor: 'var(--staff-panel)', border: '1px solid var(--staff-border)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--staff-muted)', fontSize: '12px', marginBottom: '7px' }}>{stat.label}</div>
            <div style={{ fontSize: '24px', lineHeight: 1.1, fontWeight: '600', color: 'var(--staff-text)' }}>{loading ? '—' : stat.value}</div>
            <div style={{ color: 'var(--staff-muted)', fontSize: '11px', marginTop: '5px' }}>{stat.detail}</div>
          </div>
        ))}
      </div>

      {actionMessage && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: actionMessage.type === 'success' ? 'var(--staff-highlight)' : 'rgba(220, 38, 38, 0.15)', border: `1px solid ${actionMessage.type === 'success' ? 'var(--staff-primary)' : 'var(--staff-error)'}`, color: 'var(--staff-text)' }}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--staff-muted)', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
        </div>
      )}

      <div style={{ backgroundColor: 'var(--staff-panel)', border: '1px solid var(--staff-border)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.22)' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--staff-border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} role="group" aria-label="Filter by account status">
              {[
                { key: 'all', label: 'All accounts', count: users.length },
                { key: 'active', label: 'Active', count: activeUsers },
                { key: 'disabled', label: 'Disabled', count: users.length - activeUsers }
              ].map(filter => (
                <button key={filter.key} type="button" aria-pressed={statusFilter === filter.key} onClick={() => setStatusFilter(filter.key)} style={filterButtonStyle(statusFilter === filter.key)}>
                  {filter.label}<span style={{ color: statusFilter === filter.key ? 'var(--staff-highlight)' : 'var(--staff-muted)' }}>{filter.count}</span>
                </button>
              ))}
            </div>
            <span style={{ color: 'var(--staff-muted)', fontSize: '12px' }}>
              {loading ? 'Loading directory…' : `${filteredUsers.length} of ${users.length} accounts`}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--staff-muted)' }} size={17} />
              <input
                id="staff-search-input"
                name="staffSearch"
                type="search"
                placeholder="Search name, email, ID, or role"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '38px', borderRadius: '6px' }}
              />
            </div>
            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '180px', cursor: 'pointer' }}
            >
              <option value="all">All roles</option>
              {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto', minHeight: '300px' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--staff-border)', color: 'var(--staff-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: 'var(--staff-background)' }}>
                <th style={{ padding: '13px 16px' }}>{sortButton('Name', 'name')}</th>
                <th style={{ padding: '13px 16px' }}>{sortButton('Trailhead ID', 'id')}</th>
                <th style={{ padding: '13px 16px' }}>{sortButton('Role', 'role')}</th>
                <th style={{ padding: '13px 16px' }}>{sortButton('Status', 'status')}</th>
                <th style={{ padding: '13px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--staff-border)' }}>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--staff-muted)' }}>Loading accounts...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--staff-muted)' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '6px' }}>No accounts match these filters</div>
                    <div style={{ fontSize: '13px' }}>Try another search term or clear a filter.</div>
                    <button
                      type="button"
                      onClick={() => { setSearchTerm(''); setStatusFilter('all'); setRoleFilter('all'); }}
                      style={{ marginTop: '14px', padding: '8px 12px', border: '1px solid var(--staff-primary)', borderRadius: '6px', background: 'transparent', color: 'var(--staff-highlight)', cursor: 'pointer', fontFamily: fonts?.utility || 'monospace', fontSize: '12px' }}
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const displayName = getDisplayName(user);
                  const displayEmail = user.work_email || user.personal_email || user.email || 'No email provided';
                  const displayId = user.trailhead_id || user.id?.substring(0, 8) || 'N/A';
                  const displayRole = getDisplayRole(user);
                  const isActive = user.active !== false;
                  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--staff-border)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <button type="button" onClick={() => handleOpenDetails(user)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 0, border: 'none', background: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                          <span aria-hidden="true" style={{ width: '38px', height: '38px', flex: '0 0 38px', display: 'grid', placeItems: 'center', borderRadius: '50%', backgroundColor: 'var(--staff-highlight)', color: 'var(--staff-text)', fontSize: '13px', fontWeight: 'bold' }}>{initials}</span>
                          <span style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontWeight: '600', color: 'var(--staff-text)' }}>{displayName}</span>
                            <span style={{ display: 'block', fontSize: '12px', color: 'var(--staff-muted)', marginTop: '2px' }}>{displayEmail}</span>
                          </span>
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--staff-muted)', fontFamily: 'monospace', fontSize: '14px' }}>{displayId}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--staff-text)', textTransform: 'capitalize' }}>{displayRole}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 9px', fontSize: '11px', borderRadius: '9999px', fontWeight: '600', backgroundColor: isActive ? 'var(--staff-highlight)' : 'rgba(220, 38, 38, 0.15)', color: isActive ? 'var(--staff-primary)' : 'var(--staff-error)', border: `1px solid ${isActive ? 'var(--staff-primary)' : 'var(--staff-error)'}` }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? 'var(--staff-primary)' : 'var(--staff-error)' }} />
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      
                      <td style={{ padding: '12px 16px', textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)}
                          style={{ padding: '6px', background: 'none', border: 'none', borderRadius: '8px', color: 'var(--staff-muted)', cursor: 'pointer' }}
                          aria-label={`Actions for ${displayName}`}
                          aria-haspopup="menu"
                          aria-expanded={activeMenuId === user.id}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === user.id && (
                          <div 
                            ref={menuRef}
                            style={{ position: 'absolute', right: '24px', top: '48px', width: '220px', backgroundColor: 'var(--staff-sidebar)', border: '1px solid var(--staff-border)', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)', padding: '6px 0', zIndex: 50, textAlign: 'left' }}
                          >
                            <button
                              onClick={() => handleOpenDetails(user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: 'var(--staff-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}
                            >
                              <FileText size={15} style={{ color: 'var(--staff-primary)' }} /> View Details & Edit
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--staff-border)', margin: '4px 0' }}></div>
                            <button
                              onClick={() => handleAction('email', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: 'var(--staff-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <Mail size={15} style={{ color: 'var(--staff-muted)' }} /> Send Email
                            </button>
                            <button
                              onClick={() => handleAction('text', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: 'var(--staff-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <MessageSquare size={15} style={{ color: 'var(--staff-muted)' }} /> Send Text
                            </button>
                            <button
                              onClick={() => handleAction('view_passphrase', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: 'var(--staff-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <Key size={15} style={{ color: 'var(--staff-muted)' }} /> View Passphrase
                            </button>
                            <button
                              onClick={() => handleAction('reset_passphrase', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: 'var(--staff-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <RefreshCw size={15} style={{ color: 'var(--staff-muted)' }} /> Reset Passphrase
                            </button>
                            <button
                              onClick={() => handleAction('qr', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: 'var(--staff-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <QrCode size={15} style={{ color: 'var(--staff-muted)' }} /> Generate QR
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--staff-border)', margin: '4px 0' }}></div>
                            <button
                              onClick={() => handleAction('toggle_disable', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: 'var(--staff-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              {isActive ? <UserX size={15} /> : <UserCheck size={15} />} 
                              {isActive ? 'Disable User' : 'Enable User'}
                            </button>
                            <button
                              onClick={() => handleAction('delete', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: 'var(--staff-error)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <Trash2 size={15} /> Delete User
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && users.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--staff-border)', color: 'var(--staff-muted)', fontSize: '12px' }}>
            Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'account' : 'accounts'}
          </div>
        )}
      </div>

      {/* FULL USER DETAILS & SHAREPOINT-STYLE DOCUMENTS MODAL */}
      {selectedUser && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedUser(null); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div role="dialog" aria-modal="true" aria-labelledby="personnel-profile-title" style={{ backgroundColor: 'var(--staff-sidebar)', border: '1px solid var(--staff-border)', borderRadius: '12px', maxWidth: '960px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', color: 'var(--staff-text)', boxSizing: 'border-box' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--staff-border)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ color: 'var(--staff-muted)', fontSize: '11px', fontFamily: fonts?.utility || 'monospace', letterSpacing: '0.06em', marginBottom: '5px' }}>IDENTITY <span style={{ color: 'var(--staff-muted)' }}>/</span> USER PROFILE</div>
                <h3 id="personnel-profile-title" style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--staff-text)' }}>
                  Personnel details
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedUser(null)} aria-label="Close personnel profile" style={{ display: 'grid', placeItems: 'center', width: '36px', height: '36px', background: 'transparent', border: '1px solid var(--staff-border)', borderRadius: '6px', color: 'var(--staff-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', padding: '18px', marginBottom: '24px', backgroundColor: 'var(--staff-panel)', border: '1px solid var(--staff-border)', borderRadius: '8px' }}>
              <span aria-hidden="true" style={{ width: '58px', height: '58px', flex: '0 0 58px', display: 'grid', placeItems: 'center', borderRadius: '50%', backgroundColor: 'var(--staff-highlight)', color: 'var(--staff-highlight)', fontSize: '18px', fontWeight: 'bold' }}>
                {getDisplayName(selectedUser).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'}
              </span>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '5px' }}>
                  <strong style={{ fontSize: '20px', color: 'var(--staff-text)' }}>{getDisplayName(selectedUser)}</strong>
                  <span style={{ padding: '4px 8px', borderRadius: '9999px', backgroundColor: selectedUser.active === false ? 'rgba(220, 38, 38, 0.15)' : 'var(--staff-highlight)', border: `1px solid ${selectedUser.active === false ? 'var(--staff-error)' : 'var(--staff-primary)'}`, color: selectedUser.active === false ? 'var(--staff-error)' : 'var(--staff-primary)', fontSize: '11px', fontWeight: '600' }}>
                    {selectedUser.active === false ? 'Disabled' : 'Active'}
                  </span>
                </div>
                <div style={{ color: 'var(--staff-muted)', fontSize: '13px', overflowWrap: 'anywhere' }}>{selectedUser.work_email || selectedUser.personal_email || selectedUser.email || 'No email provided'}</div>
                <div style={{ color: 'var(--staff-muted)', fontSize: '12px', marginTop: '5px', textTransform: 'capitalize' }}>
                  {getDisplayRole(selectedUser)} <span style={{ padding: '0 5px' }}>·</span> ID: {selectedUser.trailhead_id || selectedUser.id?.substring(0, 8) || 'N/A'}
                </div>
              </div>
            </div>

            {/* ORGANIZED FORM SECTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* SECTION 1: IDENTITY & NAMES */}
              <div>
                <h4 style={sectionHeaderStyle}><User size={18} /> Identity & Names</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                  
                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PREFIX</label>
                    <select value={userForm.prefix || ''} onChange={(e) => setUserForm({...userForm, prefix: e.target.value})} style={inputStyle}>
                      <option value="">Select Prefix</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Rev.">Rev.</option>
                    </select>
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>FIRST NAME</label>
                    <input type="text" value={userForm.first_name || ''} onChange={(e) => setUserForm({...userForm, first_name: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>MIDDLE NAME</label>
                    <input type="text" value={userForm.middle_name || ''} onChange={(e) => setUserForm({...userForm, middle_name: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>LAST NAME</label>
                    <input type="text" value={userForm.last_name || ''} onChange={(e) => setUserForm({...userForm, last_name: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>SUFFIX</label>
                    <select value={userForm.suffix || ''} onChange={(e) => setUserForm({...userForm, suffix: e.target.value})} style={inputStyle}>
                      <option value="">Select Suffix</option>
                      <option value="Jr.">Jr.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                      <option value="Ph. D.">Ph. D.</option>
                      <option value="M.D.">M.D.</option>
                      <option value="D.D.S.">D.D.S.</option>
                      <option value="Esq.">Esq.</option>
                    </select>
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>DISPLAY NAME</label>
                    <input type="text" value={userForm.display_name || ''} onChange={(e) => setUserForm({...userForm, display_name: e.target.value})} style={inputStyle} placeholder="Auto: First Last" />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>TRAILHEAD ID</label>
                    <input type="text" value={userForm.trailhead_id || ''} onChange={(e) => setUserForm({...userForm, trailhead_id: e.target.value})} style={inputStyle} />
                  </div>

                </div>
              </div>

              {/* SECTION 2: CONTACT INFORMATION */}
              <div>
                <h4 style={sectionHeaderStyle}><Mail size={18} /> Contact Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  
                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PERSONAL PHONE</label>
                    <input type="text" value={userForm.personal_phone || ''} onChange={(e) => setUserForm({...userForm, personal_phone: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>WORK PHONE</label>
                    <input type="text" value={userForm.work_phone || ''} onChange={(e) => setUserForm({...userForm, work_phone: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PERSONAL EMAIL</label>
                    <input type="email" value={userForm.personal_email || ''} onChange={(e) => setUserForm({...userForm, personal_email: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>WORK EMAIL</label>
                    <input type="email" value={userForm.work_email || ''} onChange={(e) => setUserForm({...userForm, work_email: e.target.value})} style={inputStyle} />
                  </div>

                </div>
              </div>

              {/* SECTION 3: EMERGENCY CONTACTS */}
              <div>
                <h4 style={sectionHeaderStyle}><Phone size={18} /> Emergency Contacts</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  
                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PRIMARY CONTACT NAME</label>
                    <input type="text" value={userForm.primary_emergency_contact_name || ''} onChange={(e) => setUserForm({...userForm, primary_emergency_contact_name: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PRIMARY CONTACT PHONE</label>
                    <input type="text" value={userForm.primary_emergency_contact_phone || ''} onChange={(e) => setUserForm({...userForm, primary_emergency_contact_phone: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>SECONDARY CONTACT NAME</label>
                    <input type="text" value={userForm.secondary_emergency_contact_name || ''} onChange={(e) => setUserForm({...userForm, secondary_emergency_contact_name: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>SECONDARY CONTACT PHONE</label>
                    <input type="text" value={userForm.secondary_emergency_contact_phone || ''} onChange={(e) => setUserForm({...userForm, secondary_emergency_contact_phone: e.target.value})} style={inputStyle} />
                  </div>

                </div>
              </div>

              {/* SECTION 4: EMPLOYMENT & SYSTEM ROLES */}
              <div>
                <h4 style={sectionHeaderStyle}><Briefcase size={18} /> Employment & System Roles</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  
                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>START DATE</label>
                    <input type="date" value={userForm.start_date || ''} onChange={(e) => setUserForm({...userForm, start_date: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>EMPLOYMENT TYPE</label>
                    <select value={userForm.employment_type || ''} onChange={(e) => setUserForm({...userForm, employment_type: e.target.value})} style={inputStyle}>
                      <option value="">Select Type</option>
                      <option value="FT">FT</option>
                      <option value="PT">PT</option>
                      <option value="Contract">Contract</option>
                      <option value="Seasonal">Seasonal</option>
                      <option value="Volunteer">Volunteer</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>EMPLOYMENT STATUS</label>
                    <select value={userForm.employment_status || ''} onChange={(e) => setUserForm({...userForm, employment_status: e.target.value})} style={inputStyle}>
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Disabled">Disabled</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>SYSTEM ROLE</label>
                    <select value={userForm.system_role || ''} onChange={(e) => setUserForm({...userForm, system_role: e.target.value})} style={inputStyle}>
                      <option value="">Select Role</option>
                      <option value="Global Superadmin">Global Superadmin</option>
                      <option value="Global Admin">Global Admin</option>
                      <option value="Camp Superadmin">Camp Superadmin</option>
                      <option value="Camp Admin">Camp Admin</option>
                      <option value="Camp Staff">Camp Staff</option>
                      <option value="Camp Volunteer">Camp Volunteer</option>
                      <option value="Camper">Camper</option>
                      <option value="Youth Camper">Youth Camper</option>
                    </select>
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>POSITION TITLE</label>
                    <input type="text" value={userForm.position_title || ''} onChange={(e) => setUserForm({...userForm, position_title: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>DEPARTMENT</label>
                    <input type="text" value={userForm.department || ''} onChange={(e) => setUserForm({...userForm, department: e.target.value})} style={inputStyle} />
                  </div>

                </div>
              </div>

              {/* SECTION 5: PROPERTY & LOCATION ASSIGNMENTS */}
              <div>
                <h4 style={sectionHeaderStyle}><MapPin size={18} /> Property & Location Assignments</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  
                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PROPERTY ASSIGNMENT</label>
                    <input type="text" value={userForm.property_assignment || ''} onChange={(e) => setUserForm({...userForm, property_assignment: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>CABIN ASSIGNMENT</label>
                    <input type="text" value={userForm.cabin_assignment || ''} onChange={(e) => setUserForm({...userForm, cabin_assignment: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>LOT ASSIGNMENT</label>
                    <input type="text" value={userForm.lot_assignment || ''} onChange={(e) => setUserForm({...userForm, lot_assignment: e.target.value})} style={inputStyle} />
                  </div>

                </div>
              </div>

            </div>

            {/* SHAREPOINT-STYLE USER DOCUMENTS REPOSITORY */}
            <div style={{ borderTop: '2px solid var(--staff-border)', paddingTop: '20px', marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--staff-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={16} style={{ color: 'var(--staff-primary)' }} /> User Documents & Repository
                </h4>
                <label style={{ backgroundColor: 'var(--staff-highlight)', color: 'var(--staff-text)', padding: '8px 14px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--staff-border)' }}>
                  <Upload size={14} /> Upload Document
                  <input type="file" style={{ display: 'none' }} onChange={(e) => {
                    if (e.target.files[0]) {
                      const newDoc = { id: Date.now().toString(), name: e.target.files[0].name, size: '142 KB', date: new Date().toISOString().split('T')[0] };
                      setUserDocuments([...userDocuments, newDoc]);
                    }
                  }} />
                </label>
              </div>

              <div style={{ backgroundColor: 'var(--staff-background)', border: '1px solid var(--staff-border)', borderRadius: '8px', padding: '12px', minHeight: '100px' }}>
                {userDocuments.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--staff-muted)', fontSize: '13px', padding: '20px', fontFamily: 'monospace' }}>No documents uploaded for this personnel account yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userDocuments.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--staff-panel)', border: '1px solid var(--staff-border)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={16} style={{ color: 'var(--staff-primary)' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--staff-text)' }}>{doc.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--staff-muted)', fontFamily: 'monospace' }}>Size: {doc.size} | Uploaded: {doc.date}</div>
                          </div>
                        </div>
                        <button onClick={() => setUserDocuments(userDocuments.filter(d => d.id !== doc.id))} style={{ background: 'none', border: 'none', color: 'var(--staff-error)', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace' }}>Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px', borderTop: '1px solid var(--staff-border)', paddingTop: '20px' }}>
              <button onClick={() => setSelectedUser(null)} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: 'var(--staff-text)', border: '1px solid var(--staff-muted)', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveUser} style={{ padding: '10px 24px', backgroundColor: 'var(--staff-primary)', color: colors?.textOnPrimary || '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={16} /> Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PASSCODE / QR MODALS */}
      {modalType && modalData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--staff-sidebar)', border: '1px solid var(--staff-border)', borderRadius: '16px', maxWidth: '448px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', position: 'relative' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', color: 'var(--staff-text)' }}>
              {modalType === 'passphrase' ? `Passphrase for ${getDisplayName(modalData)}` : `QR Code for ${getDisplayName(modalData)}`}
            </h3>
            
            {modalType === 'passphrase' ? (
              <div style={{ margin: '16px 0', padding: '16px', backgroundColor: 'var(--staff-panel)', border: '1px solid var(--staff-border)', borderRadius: '12px', fontFamily: 'monospace', textAlign: 'center', fontSize: '20px', color: 'var(--staff-primary)', letterSpacing: '0.05em' }}>
                {modalData.passphrase || 'No passphrase stored'}
              </div>
            ) : (
              <div style={{ margin: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '192px', height: '192px', backgroundColor: 'white', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'black', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center' }}>[QR Code for ID: {modalData.trailhead_id || modalData.id}]</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--staff-muted)', marginTop: '12px', fontFamily: 'monospace' }}>{modalData.trailhead_id || modalData.id}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => { setModalType(null); setModalData(null); }}
                style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: 'var(--staff-highlight)', color: 'var(--staff-text)', border: '1px solid var(--staff-border)', borderRadius: '12px', fontWeight: '500', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}