import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreVertical, Mail, MessageSquare, Key, RefreshCw, 
  QrCode, UserX, UserCheck, Trash2, Search, Shield, FileText, Upload, X, Save
} from 'lucide-react';

export default function StaffManager({ supabase, selectedPropertyName, colors, fonts, isDarkMode }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    if (supabase) {
      fetchUsers();
    }
  }, [selectedPropertyName, supabase]);

  async function fetchUsers() {
    if (!supabase) return;
    setLoading(true);
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
  }

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
        break;

      case 'qr':
        setModalType('qr');
        setModalData(user);
        break;

      case 'toggle_disable':
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

  const filteredUsers = users.filter(u => {
    const fullName = getDisplayName(u);
    const tId = u.trailhead_id || '';
    const userEmail = u.work_email || u.personal_email || u.email || '';
    const term = searchTerm.toLowerCase();
    return fullName.toLowerCase().includes(term) || tId.toLowerCase().includes(term) || userEmail.toLowerCase().includes(term);
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#F1E8D0', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', mdFlexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0', color: '#F1E8D0' }}>
            <Shield style={{ color: '#C1531B' }} /> Trailhead Personnel Management
          </h1>
          <p style={{ color: '#8A9A8F', fontSize: '14px', margin: 0 }}>
            Managing administrative and staff personnel accounts with uniform directory fields
          </p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '288px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '10px', color: '#8A9A8F' }} size={18} />
          <input
            id="staff-search-input"
            name="staffSearch"
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: '#0F1D14', border: '1px solid #2A4731', borderRadius: '12px', padding: '8px 16px 8px 36px', fontSize: '14px', color: '#F1E8D0', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {actionMessage && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: actionMessage.type === 'success' ? 'rgba(20, 83, 45, 0.4)' : 'rgba(220, 38, 38, 0.4)', border: `1px solid ${actionMessage.type === 'success' ? '#14532d' : '#dc2626'}`, color: '#F1E8D0' }}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', color: '#8A9A8F', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
        </div>
      )}

      <div style={{ backgroundColor: '#0F1D14', border: '1px solid #2A4731', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ overflowX: 'auto', minHeight: '300px' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2A4731', color: '#8A9A8F', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#070C08' }}>
                <th style={{ padding: '14px 16px' }}>User / Identity</th>
                <th style={{ padding: '14px 16px' }}>Trailhead ID</th>
                <th style={{ padding: '14px 16px' }}>Role / Tier</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid #2A4731' }}>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#8A9A8F' }}>Loading accounts...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#8A9A8F' }}>No personnel records found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const displayName = getDisplayName(user);
                  const displayEmail = user.work_email || user.personal_email || user.email || 'No email provided';
                  const displayId = user.trailhead_id || user.id?.substring(0, 8) || 'N/A';
                  const displayRole = user.system_role || user.job_title || user.access_tier || 'Staff';
                  const isActive = user.active !== false;

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(42, 71, 49, 0.4)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '500', color: '#F1E8D0' }}>{displayName}</div>
                        <div style={{ fontSize: '12px', color: '#8A9A8F', marginTop: '2px' }}>{displayEmail}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#8A9A8F', fontFamily: 'monospace', fontSize: '14px' }}>{displayId}</td>
                      <td style={{ padding: '12px 16px', color: '#F1E8D0', textTransform: 'capitalize' }}>{displayRole.replace('_', ' ')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px', fontWeight: '500', backgroundColor: isActive ? 'rgba(20, 83, 45, 0.4)' : 'rgba(220, 38, 38, 0.4)', color: isActive ? '#86efac' : '#fca5a5', border: `1px solid ${isActive ? '#14532d' : '#dc2626'}` }}>
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      
                      <td style={{ padding: '12px 16px', textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)}
                          style={{ padding: '6px', background: 'none', border: 'none', borderRadius: '8px', color: '#8A9A8F', cursor: 'pointer' }}
                          aria-label="Account Actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === user.id && (
                          <div 
                            ref={menuRef}
                            style={{ position: 'absolute', right: '24px', top: '48px', width: '220px', backgroundColor: '#070C08', border: '1px solid #2A4731', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)', padding: '6px 0', zIndex: 50, textAlign: 'left' }}
                          >
                            <button
                              onClick={() => handleOpenDetails(user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: '#86efac', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}
                            >
                              <FileText size={15} style={{ color: '#86efac' }} /> View Details & Edit
                            </button>
                            <div style={{ height: '1px', backgroundColor: '#2A4731', margin: '4px 0' }}></div>
                            <button
                              onClick={() => handleAction('email', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: '#F1E8D0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <Mail size={15} style={{ color: '#8A9A8F' }} /> Send Email
                            </button>
                            <button
                              onClick={() => handleAction('text', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: '#F1E8D0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <MessageSquare size={15} style={{ color: '#8A9A8F' }} /> Send Text
                            </button>
                            <button
                              onClick={() => handleAction('view_passphrase', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: '#F1E8D0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <Key size={15} style={{ color: '#8A9A8F' }} /> View Passphrase
                            </button>
                            <button
                              onClick={() => handleAction('reset_passphrase', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: '#F1E8D0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <RefreshCw size={15} style={{ color: '#8A9A8F' }} /> Reset Passphrase
                            </button>
                            <button
                              onClick={() => handleAction('qr', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: '#F1E8D0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <QrCode size={15} style={{ color: '#8A9A8F' }} /> Generate QR
                            </button>
                            <div style={{ height: '1px', backgroundColor: '#2A4731', margin: '4px 0' }}></div>
                            <button
                              onClick={() => handleAction('toggle_disable', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: '#facc15', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              {isActive ? <UserX size={15} /> : <UserCheck size={15} />} 
                              {isActive ? 'Disable User' : 'Enable User'}
                            </button>
                            <button
                              onClick={() => handleAction('delete', user)}
                              style={{ width: '100%', padding: '8px 16px', fontSize: '14px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
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
      </div>

      {/* FULL USER DETAILS & SHAREPOINT-STYLE DOCUMENTS MODAL */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#070C08', border: '1px solid #2A4731', borderRadius: '16px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', color: '#F1E8D0', boxSizing: 'border-box' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2A4731', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#F1E8D0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText style={{ color: '#C1531B' }} /> Personnel Profile & Directory Details
              </h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#8A9A8F', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* UNIFORM FORM FIELDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>PREFIX</label>
                <select value={userForm.prefix || ''} onChange={(e) => setUserForm({...userForm, prefix: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }}>
                  <option value="">Select Prefix</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                  <option value="Rev.">Rev.</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>FIRST NAME</label>
                <input type="text" value={userForm.first_name || ''} onChange={(e) => setUserForm({...userForm, first_name: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>MIDDLE NAME</label>
                <input type="text" value={userForm.middle_name || ''} onChange={(e) => setUserForm({...userForm, middle_name: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>LAST NAME</label>
                <input type="text" value={userForm.last_name || ''} onChange={(e) => setUserForm({...userForm, last_name: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>SUFFIX</label>
                <select value={userForm.suffix || ''} onChange={(e) => setUserForm({...userForm, suffix: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }}>
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>DISPLAY NAME</label>
                <input type="text" value={userForm.display_name || ''} onChange={(e) => setUserForm({...userForm, display_name: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>TRAILHEAD ID</label>
                <input type="text" value={userForm.trailhead_id || ''} onChange={(e) => setUserForm({...userForm, trailhead_id: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>PERSONAL PHONE</label>
                <input type="text" value={userForm.personal_phone || ''} onChange={(e) => setUserForm({...userForm, personal_phone: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>WORK PHONE</label>
                <input type="text" value={userForm.work_phone || ''} onChange={(e) => setUserForm({...userForm, work_phone: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>PERSONAL EMAIL</label>
                <input type="email" value={userForm.personal_email || ''} onChange={(e) => setUserForm({...userForm, personal_email: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>WORK EMAIL</label>
                <input type="email" value={userForm.work_email || ''} onChange={(e) => setUserForm({...userForm, work_email: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>START DATE</label>
                <input type="date" value={userForm.start_date || ''} onChange={(e) => setUserForm({...userForm, start_date: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>EMPLOYMENT TYPE</label>
                <select value={userForm.employment_type || ''} onChange={(e) => setUserForm({...userForm, employment_type: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }}>
                  <option value="">Select Type</option>
                  <option value="FT">FT</option>
                  <option value="PT">PT</option>
                  <option value="Contract">Contract</option>
                  <option value="Seasonal">Seasonal</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>EMPLOYMENT STATUS</label>
                <select value={userForm.employment_status || ''} onChange={(e) => setUserForm({...userForm, employment_status: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }}>
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Disabled">Disabled</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>SYSTEM ROLE</label>
                <select value={userForm.system_role || ''} onChange={(e) => setUserForm({...userForm, system_role: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }}>
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>POSITION TITLE</label>
                <input type="text" value={userForm.position_title || ''} onChange={(e) => setUserForm({...userForm, position_title: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>DEPARTMENT</label>
                <input type="text" value={userForm.department || ''} onChange={(e) => setUserForm({...userForm, department: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>PROPERTY ASSIGNMENT</label>
                <input type="text" value={userForm.property_assignment || ''} onChange={(e) => setUserForm({...userForm, property_assignment: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>CABIN ASSIGNMENT</label>
                <input type="text" value={userForm.cabin_assignment || ''} onChange={(e) => setUserForm({...userForm, cabin_assignment: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#8A9A8F', marginBottom: '5px' }}>LOT ASSIGNMENT</label>
                <input type="text" value={userForm.lot_assignment || ''} onChange={(e) => setUserForm({...userForm, lot_assignment: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #2A4731', backgroundColor: '#0F1D14', color: '#F1E8D0' }} />
              </div>

            </div>

            {/* SHAREPOINT-STYLE USER DOCUMENTS REPOSITORY */}
            <div style={{ borderTop: '2px solid #2A4731', paddingTop: '20px', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#F1E8D0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={16} style={{ color: '#C1531B' }} /> User Documents & Repository
                </h4>
                <label style={{ backgroundColor: '#1E3524', color: '#FFF', padding: '8px 14px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #2A4731' }}>
                  <Upload size={14} /> Upload Document
                  <input type="file" style={{ display: 'none' }} onChange={(e) => {
                    if (e.target.files[0]) {
                      const newDoc = { id: Date.now().toString(), name: e.target.files[0].name, size: '142 KB', date: new Date().toISOString().split('T')[0] };
                      setUserDocuments([...userDocuments, newDoc]);
                    }
                  }} />
                </label>
              </div>

              <div style={{ backgroundColor: '#050A07', border: '1px solid #2A4731', borderRadius: '8px', padding: '12px', minHeight: '100px' }}>
                {userDocuments.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#8A9A8F', fontSize: '13px', padding: '20px', fontFamily: 'monospace' }}>No documents uploaded for this personnel account yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userDocuments.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#0F1D14', border: '1px solid #2A4731', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={16} style={{ color: '#C1531B' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#F1E8D0' }}>{doc.name}</div>
                            <div style={{ fontSize: '11px', color: '#8A9A8F', fontFamily: 'monospace' }}>Size: {doc.size} | Uploaded: {doc.date}</div>
                          </div>
                        </div>
                        <button onClick={() => setUserDocuments(userDocuments.filter(d => d.id !== doc.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace' }}>Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '25px', borderTop: '1px solid #2A4731', paddingTop: '15px' }}>
              <button onClick={() => setSelectedUser(null)} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#F1E8D0', border: '1px solid #8A9A8F', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveUser} style={{ padding: '10px 24px', backgroundColor: '#C1531B', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={16} /> Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PASSCODE / QR MODALS */}
      {modalType && modalData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#070C08', border: '1px solid #2A4731', borderRadius: '16px', maxWidth: '448px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', position: 'relative' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', color: '#F1E8D0' }}>
              {modalType === 'passphrase' ? `Passphrase for ${getDisplayName(modalData)}` : `QR Code for ${getDisplayName(modalData)}`}
            </h3>
            
            {modalType === 'passphrase' ? (
              <div style={{ margin: '16px 0', padding: '16px', backgroundColor: '#0F1D14', border: '1px solid #2A4731', borderRadius: '12px', fontFamily: 'monospace', textAlign: 'center', fontSize: '20px', color: '#C1531B', letterSpacing: '0.05em' }}>
                {modalData.passphrase || 'No passphrase stored'}
              </div>
            ) : (
              <div style={{ margin: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '192px', height: '192px', backgroundColor: 'white', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'black', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center' }}>[QR Code for ID: {modalData.trailhead_id || modalData.id}]</span>
                </div>
                <p style={{ fontSize: '12px', color: '#8A9A8F', marginTop: '12px', fontFamily: 'monospace' }}>{modalData.trailhead_id || modalData.id}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => { setModalType(null); setModalData(null); }}
                style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#16281D', color: '#F1E8D0', border: '1px solid #2A4731', borderRadius: '12px', fontWeight: '500', cursor: 'pointer' }}
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