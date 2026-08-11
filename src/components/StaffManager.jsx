import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreVertical, Mail, MessageSquare, Key, RefreshCw, 
  QrCode, UserX, UserCheck, Trash2, Search, Shield
} from 'lucide-react';

export default function StaffManager({ supabase, selectedPropertyName }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  
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

  async function handleAction(action, user) {
    if (!supabase) return;
    setActiveMenuId(null);
    setActionMessage(null);

    const userName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Staff Member';

    switch (action) {
      case 'email':
        try {
          const res = await fetch('https://lahzovurbugnptoszlxj.supabase.co/functions/v1/send-staff-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              trailheadId: user.trailhead_id || user.id,
              passphrase: user.passphrase || '********',
              type: 'new_account'
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to send email');
          setActionMessage({ type: 'success', text: `Email successfully sent to ${user.email}` });
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
    const fullName = u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || '';
    const tId = u.trailhead_id || '';
    const userEmail = u.email || '';
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
            Managing administrative and staff personnel accounts
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
                <th style={{ padding: '14px 16px' }}>User</th>
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
                  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed Personnel';
                  const displayEmail = user.email || 'No email provided';
                  const displayId = user.trailhead_id || user.id?.substring(0, 8) || 'N/A';
                  const displayRole = user.job_title || user.access_tier || 'Staff';
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
                            style={{ position: 'absolute', right: '24px', top: '48px', width: '208px', backgroundColor: '#070C08', border: '1px solid #2A4731', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)', padding: '6px 0', zIndex: 50, textAlign: 'left' }}
                          >
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

      {modalType && modalData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#070C08', border: '1px solid #2A4731', borderRadius: '16px', maxWidth: '448px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', position: 'relative' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', color: '#F1E8D0' }}>
              {modalType === 'passphrase' ? `Passphrase for ${modalData.display_name || modalData.first_name}` : `QR Code for ${modalData.display_name || modalData.first_name}`}
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