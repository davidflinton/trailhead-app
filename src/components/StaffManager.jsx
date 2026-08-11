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
      .from('customer_personnel')
      .select('*')
      .order('created_at', { ascending: false });

    if (selectedPropertyName && selectedPropertyName.trim() !== '') {
      query = query.eq('property_name', selectedPropertyName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching customer personnel:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  async function handleAction(action, user) {
    if (!supabase) return;
    setActiveMenuId(null);
    setActionMessage(null);

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
        alert(`SMS text dispatch for ${user.name} goes here.`);
        break;

      case 'view_passphrase':
        setModalType('passphrase');
        setModalData(user);
        break;

      case 'reset_passphrase':
        const newPass = Math.random().toString(36).substring(2, 10);
        const { error: resetErr } = await supabase
          .from('customer_personnel')
          .update({ passphrase: newPass })
          .eq('id', user.id);

        if (resetErr) {
          setActionMessage({ type: 'error', text: 'Failed to reset passphrase' });
        } else {
          setActionMessage({ type: 'success', text: `Passphrase reset for ${user.name}` });
          fetchUsers();
        }
        break;

      case 'qr':
        setModalType('qr');
        setModalData(user);
        break;

      case 'toggle_disable':
        const newStatus = !user.active;
        const { error: statusErr } = await supabase
          .from('customer_personnel')
          .update({ active: newStatus })
          .eq('id', user.id);

        if (statusErr) {
          setActionMessage({ type: 'error', text: 'Failed to update user status' });
        } else {
          fetchUsers();
        }
        break;

      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${user.name}? This cannot be undone.`)) {
          const { error: deleteErr } = await supabase
            .from('customer_personnel')
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

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.trailhead_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-blue-500" /> Customer Staff Management
          </h1>
          <p className="text-gray-400 text-sm">
            {selectedPropertyName ? `Managing staff for ${selectedPropertyName}` : 'Managing all customer staff accounts'}
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {actionMessage && (
        <div className={`mb-4 p-3 rounded-xl text-sm flex justify-between items-center ${actionMessage.type === 'success' ? 'bg-green-950/60 border border-green-800 text-green-300' : 'bg-red-950/60 border border-red-800 text-red-300'}`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-white">&times;</button>
        </div>
      )}

      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider bg-gray-900/60">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Trailhead ID</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">Loading accounts...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">No staff accounts found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-900/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-mono text-sm">{user.trailhead_id || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300 capitalize">{user.role || 'Staff'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${user.active !== false ? 'bg-green-950 text-green-400 border border-green-800/60' : 'bg-red-950 text-red-400 border border-red-800/60'}`}>
                        {user.active !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)}
                        className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                        aria-label="Account Actions"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenuId === user.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-6 top-12 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1.5 z-50 text-left"
                        >
                          <button
                            onClick={() => handleAction('email', user)}
                            className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2.5"
                          >
                            <Mail size={15} className="text-gray-400" /> Send Email
                          </button>
                          <button
                            onClick={() => handleAction('text', user)}
                            className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2.5"
                          >
                            <MessageSquare size={15} className="text-gray-400" /> Send Text
                          </button>
                          <button
                            onClick={() => handleAction('view_passphrase', user)}
                            className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2.5"
                          >
                            <Key size={15} className="text-gray-400" /> View Passphrase
                          </button>
                          <button
                            onClick={() => handleAction('reset_passphrase', user)}
                            className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2.5"
                          >
                            <RefreshCw size={15} className="text-gray-400" /> Reset Passphrase
                          </button>
                          <button
                            onClick={() => handleAction('qr', user)}
                            className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2.5"
                          >
                            <QrCode size={15} className="text-gray-400" /> Generate QR
                          </button>
                          <div className="border-t border-gray-800 my-1"></div>
                          <button
                            onClick={() => handleAction('toggle_disable', user)}
                            className="w-full px-4 py-2 text-sm text-yellow-400 hover:bg-gray-800 flex items-center gap-2.5"
                          >
                            {user.active !== false ? <UserX size={15} /> : <UserCheck size={15} />} 
                            {user.active !== false ? 'Disable User' : 'Enable User'}
                          </button>
                          <button
                            onClick={() => handleAction('delete', user)}
                            className="w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2.5"
                          >
                            <Trash2 size={15} /> Delete User
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalType && modalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold mb-2">
              {modalType === 'passphrase' ? `Passphrase for ${modalData.name}` : `QR Code for ${modalData.name}`}
            </h3>
            
            {modalType === 'passphrase' ? (
              <div className="my-4 p-4 bg-black/40 border border-gray-800 rounded-xl font-mono text-center text-xl text-blue-400 tracking-wider">
                {modalData.passphrase || 'No passphrase stored'}
              </div>
            ) : (
              <div className="my-6 flex flex-col items-center justify-center">
                <div className="w-48 h-48 bg-white p-3 rounded-xl flex items-center justify-center">
                  <span className="text-black font-mono text-xs text-center">[QR Code for ID: {modalData.trailhead_id}]</span>
                </div>
                <p className="text-xs text-gray-400 mt-3 font-mono">{modalData.trailhead_id}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setModalType(null); setModalData(null); }}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
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