import React from 'react';
import { LayoutDashboard, Building, Users, Database, CheckSquare, MessageSquare, FileText, Settings } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, campBranding, session, campType, setIsMoreOpen }) {
  const isGlobalAdmin = session?.access_tier === 'global_superadmin' || session?.access_tier === 'global_admin';
  const isCampAdmin = session?.access_tier === 'camp_superadmin' || session?.access_tier === 'camp_admin';

  const navItemStyle = (tabName) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: activeTab === tabName ? '#1E3524' : 'transparent',
    color: '#F1E8D0',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    transition: 'background-color 0.2s'
  });

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#8A9A8F', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
        Console Navigation
      </div>

      <button onClick={() => { setActiveTab('dashboard'); setIsMoreOpen(false); }} style={navItemStyle('dashboard')}>
        <LayoutDashboard size={18} color="#C1531B" /> Dashboard
      </button>

      {(isGlobalAdmin || isCampAdmin) && (
        <button onClick={() => { setActiveTab('properties'); setIsMoreOpen(false); }} style={navItemStyle('properties')}>
          <Building size={18} color="#C1531B" /> Properties
        </button>
      )}

      {(isGlobalAdmin || isCampAdmin) && (
        <button onClick={() => { setActiveTab('staff'); setIsMoreOpen(false); }} style={navItemStyle('staff')}>
          <Users size={18} color="#C1531B" /> Staff
        </button>
      )}

      {(isGlobalAdmin || isCampAdmin) && (
        <button onClick={() => { setActiveTab('customer_db'); setIsMoreOpen(false); }} style={navItemStyle('customer_db')}>
          <Database size={18} color="#C1531B" /> Customer DB
        </button>
      )}

      <button onClick={() => { setActiveTab('approvals'); setIsMoreOpen(false); }} style={navItemStyle('approvals')}>
        <CheckSquare size={18} color="#C1531B" /> Approvals
      </button>

      <button onClick={() => { setActiveTab('discuss'); setIsMoreOpen(false); }} style={navItemStyle('discuss')}>
        <MessageSquare size={18} color="#C1531B" /> Discuss
      </button>

      <button onClick={() => { setActiveTab('notes'); setIsMoreOpen(false); }} style={navItemStyle('notes')}>
        <FileText size={18} color="#C1531B" /> Notes
      </button>

      {/* Settings Navigation Item */}
      <button onClick={() => { setActiveTab('settings'); setIsMoreOpen(false); }} style={navItemStyle('settings')}>
        <Settings size={18} color="#C1531B" /> Settings
      </button>

    </div>
  );
}