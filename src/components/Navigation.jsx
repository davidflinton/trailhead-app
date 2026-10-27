import { LayoutDashboard, Building, Users, Database, CheckSquare, MessageSquare, FileText, Settings } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, session, setIsMoreOpen, colors }) {
  const isGlobalAdmin = session?.access_tier === 'global_superadmin' || session?.access_tier === 'global_admin';
  const isCampAdmin = session?.access_tier === 'camp_superadmin' || session?.access_tier === 'camp_admin';

  const navItemStyle = (tabName) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: activeTab === tabName ? colors.highlight : 'transparent',
    color: colors.textLight,
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
      
      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: colors.muted, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
        Console Navigation
      </div>

      <button onClick={() => { setActiveTab('dashboard'); setIsMoreOpen(false); }} style={navItemStyle('dashboard')}>
        <LayoutDashboard size={18} color={colors.primary} /> Dashboard
      </button>

      {(isGlobalAdmin || isCampAdmin) && (
        <button onClick={() => { setActiveTab('properties'); setIsMoreOpen(false); }} style={navItemStyle('properties')}>
          <Building size={18} color={colors.primary} /> Properties
        </button>
      )}

      {(isGlobalAdmin || isCampAdmin) && (
        <button onClick={() => { setActiveTab('staff'); setIsMoreOpen(false); }} style={navItemStyle('staff')}>
          <Users size={18} color={colors.primary} /> Staff
        </button>
      )}

      {(isGlobalAdmin || isCampAdmin) && (
        <button onClick={() => { setActiveTab('customer_db'); setIsMoreOpen(false); }} style={navItemStyle('customer_db')}>
          <Database size={18} color={colors.primary} /> Customer DB
        </button>
      )}

      <button onClick={() => { setActiveTab('approvals'); setIsMoreOpen(false); }} style={navItemStyle('approvals')}>
        <CheckSquare size={18} color={colors.primary} /> Approvals
      </button>

      <button onClick={() => { setActiveTab('discuss'); setIsMoreOpen(false); }} style={navItemStyle('discuss')}>
        <MessageSquare size={18} color={colors.primary} /> Discuss
      </button>

      <button onClick={() => { setActiveTab('notes'); setIsMoreOpen(false); }} style={navItemStyle('notes')}>
        <FileText size={18} color={colors.primary} /> Notes
      </button>

      {/* Settings Option for Property Portals / Navigation */}
      <button onClick={() => { setActiveTab('settings'); setIsMoreOpen(false); }} style={navItemStyle('settings')}>
        <Settings size={18} color={colors.primary} /> Settings
      </button>

    </div>
  );
}