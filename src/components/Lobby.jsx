import { useState } from 'react'
import { Tent, Users, CheckSquare, MessageSquare, LogOut, ChevronDown, MessageCircle, AlertCircle, Activity } from 'lucide-react'
import StaffManager from './StaffManager'
import DiscussionBoard from './DiscussionBoard'

export default function Lobby({ profile, setCampData, setActiveTab }) {
  const [lobbyTab, setLobbyTab] = useState('dashboard')
  const [selectedCampId, setSelectedCampId] = useState('')
  const [quickPost, setQuickPost] = useState('')

  // Placeholder data for the dropdown. 
  // Normally you would fetch this on mount using supabase.from('camps').select('*')
  const mockedCamps = [
    { id: 'camp_1', name: 'Pine Valley Retreat' },
    { id: 'camp_2', name: 'Lakeview Youth Camp' },
    { id: 'camp_3', name: 'Mountain Ridge RV Park' }
  ]

  // Official Brand Palette
  const colors = {
    background: '#16281D',
    sidebar: '#0F1D14',
    panel: '#F1E8D0',
    textDark: '#24201A',
    textLight: '#F1E8D0',
    primary: '#C1531B',
    muted: '#6B6250',
    error: '#E8896B',
    highlight: '#1E3524'
  }

  // Official Fonts
  const fonts = {
    header: "'Staatliches', sans-serif",
    body: "'Karla', sans-serif",
    utility: "'JetBrains Mono', monospace"
  }

  const handleQuickPost = () => {
    // You will wire this up to insert directly into your discussions table
    console.log("Posting to DiscussionBoard:", quickPost)
    setQuickPost('')
    alert("Post submitted to the Discussion Board.")
  }

  const handleCampSelection = (e) => {
    const campId = e.target.value
    setSelectedCampId(campId)
    if (campId) {
      const camp = mockedCamps.find(c => c.id === campId)
      setCampData(camp)
      setActiveTab('news')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: colors.background, color: colors.textLight, fontFamily: fonts.body }}>
      
      <style>{`
        .bottom-nav-label {
          display: none;
        }
        @media (min-width: 480px) {
          .bottom-nav-label {
            display: block;
            margin-top: 4px;
            font-size: 11px;
            font-weight: bold;
          }
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #16281D; }
        ::-webkit-scrollbar-thumb { background: #0F1D14; border-radius: 4px; }
      `}</style>

      {/* TOP HEADER */}
      <div style={{ backgroundColor: colors.sidebar, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${colors.highlight}`, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Tent size={36} color={colors.primary} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             <h1 style={{ margin: 0, fontSize: '32px', fontFamily: fonts.header, color: colors.textLight, letterSpacing: '2px', lineHeight: 1 }}>
              TRAILHEAD
            </h1>
            <span style={{ fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
              Admin Console
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => window.location.reload()} 
            style={{ background: 'none', border: 'none', color: colors.error, cursor: 'pointer', padding: '8px' }}
            title="Sign Out"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', boxSizing: 'border-box' }}>
        
        {lobbyTab === 'dashboard' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Camp Selector Dropdown */}
            <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '6px', border: `2px solid #0B140E`, boxShadow: '4px 4px 0px #0B140E' }}>
              <label style={{ display: 'block', color: colors.muted, fontFamily: fonts.utility, fontWeight: 'bold', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>
                Select a Property to Manage
              </label>
              <div style={{ position: 'relative' }}>
                <select 
                  value={selectedCampId} 
                  onChange={handleCampSelection}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '4px', backgroundColor: '#fff', color: colors.textDark, border: `1px solid ${colors.muted}`, appearance: 'none', outline: 'none', fontFamily: fonts.header, fontSize: '20px', letterSpacing: '1px', cursor: 'pointer' }}
                >
                  <option value="">-- Choose a Camp --</option>
                  {mockedCamps.map(camp => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
                <ChevronDown size={24} color={colors.muted} style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Two-Column Grid for Dashboard Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              {/* Helpdesk / Open Requests Preview */}
              <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '6px', border: `2px solid #0B140E` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <AlertCircle size={20} color={colors.primary} />
                  <h3 style={{ margin: 0, color: colors.textDark, fontFamily: fonts.header, fontSize: '22px' }}>Open Requests</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'rgba(193, 83, 27, 0.1)', borderLeft: `4px solid ${colors.primary}`, fontSize: '13px', color: colors.textDark }}>
                    Integration with external helpdesk pending. Displaying active internal tickets.
                  </div>
                  <TicketItem title="Cabin 4 HVAC failure" user="Pine Valley" status="High" colors={colors} fonts={fonts} />
                  <TicketItem title="Billing dispute - August" user="Lakeview" status="Open" colors={colors} fonts={fonts} />
                  <TicketItem title="App bug: map won't load" user="Mountain Ridge" status="Investigating" colors={colors} fonts={fonts} />
                </div>
              </div>

              {/* Quick Discussion Entry */}
              <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '6px', border: `2px solid #0B140E` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <MessageCircle size={20} color={colors.primary} />
                  <h3 style={{ margin: 0, color: colors.textDark, fontFamily: fonts.header, fontSize: '22px' }}>Quick Dispatch</h3>
                </div>
                <textarea
                  value={quickPost}
                  onChange={(e) => setQuickPost(e.target.value)}
                  placeholder="Drop a quick message to the Global Discussion board..."
                  style={{ width: '100%', padding: '12px', borderRadius: '4px', backgroundColor: '#fff', color: colors.textDark, border: `1px solid ${colors.muted}`, boxSizing: 'border-box', outline: 'none', fontFamily: fonts.body, fontSize: '14px', resize: 'vertical', minHeight: '80px', marginBottom: '10px' }}
                />
                <button 
                  onClick={handleQuickPost}
                  disabled={!quickPost.trim()}
                  style={{ width: '100%', padding: '10px', backgroundColor: colors.primary, color: colors.textLight, border: 'none', borderRadius: '4px', fontFamily: fonts.header, fontSize: '16px', letterSpacing: '1px', cursor: quickPost.trim() ? 'pointer' : 'not-allowed', opacity: quickPost.trim() ? 1 : 0.5 }}
                >
                  Post to Discussions
                </button>
              </div>

              {/* Recent Notifications */}
              <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '6px', border: `2px solid #0B140E` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <MessageSquare size={20} color={colors.primary} />
                  <h3 style={{ margin: 0, color: colors.textDark, fontFamily: fonts.header, fontSize: '22px' }}>Notifications</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <NotificationItem text="New system suggestion submitted by Jane Doe." time="10m ago" colors={colors} fonts={fonts} />
                  <NotificationItem text="Global Admin John Smith commented on your post." time="1h ago" colors={colors} fonts={fonts} />
                  <NotificationItem text="Camp creation request approved." time="3h ago" colors={colors} fonts={fonts} />
                </div>
              </div>

              {/* Activity Rundown */}
              <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '6px', border: `2px solid #0B140E` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <Activity size={20} color={colors.primary} />
                  <h3 style={{ margin: 0, color: colors.textDark, fontFamily: fonts.header, fontSize: '22px' }}>Staff Activity</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ActivityItem name="Jane Doe" role="Global Admin" count="42 actions" colors={colors} fonts={fonts} />
                  <ActivityItem name="QA-Test-01" role="QA Tester" count="28 actions" colors={colors} fonts={fonts} />
                  <ActivityItem name="John Smith" role="Global Superadmin" count="15 actions" colors={colors} fonts={fonts} />
                </div>
              </div>

            </div>
          </div>
        )}

        {lobbyTab === 'staff' && <StaffManager colors={colors} fonts={fonts} />}
        {lobbyTab === 'discussions' && <DiscussionBoard colors={colors} fonts={fonts} profile={profile} />}
        
        {lobbyTab === 'approvals' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textLight, marginTop: 0, letterSpacing: '1px' }}>PENDING APPROVALS</h2>
            <p style={{ fontFamily: fonts.body, opacity: 0.8, fontSize: '15px' }}>List of newly registered camps waiting for your green light.</p>
          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div style={{ backgroundColor: colors.sidebar, display: 'flex', justifyContent: 'space-around', borderTop: `2px solid ${colors.highlight}`, padding: '10px 0', paddingBottom: 'env(safe-area-inset-bottom, 10px)' }}>
        <BottomNavButton icon={<Activity size={24} />} label="Dashboard" active={lobbyTab === 'dashboard'} onClick={() => setLobbyTab('dashboard')} colors={colors} fonts={fonts} />
        <BottomNavButton icon={<MessageSquare size={24} />} label="Discuss" active={lobbyTab === 'discussions'} onClick={() => setLobbyTab('discussions')} colors={colors} fonts={fonts} />
        <BottomNavButton icon={<Users size={24} />} label="Staff" active={lobbyTab === 'staff'} onClick={() => setLobbyTab('staff')} colors={colors} fonts={fonts} />
        <BottomNavButton icon={<CheckSquare size={24} />} label="Approvals" active={lobbyTab === 'approvals'} onClick={() => setLobbyTab('approvals')} colors={colors} fonts={fonts} />
      </div>

    </div>
  )
}

function BottomNavButton({ icon, label, active, onClick, colors, fonts }) {
  return (
    <button 
      onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, background: 'none', border: 'none', color: active ? colors.primary : colors.muted, cursor: 'pointer', padding: '5px', transition: 'color 0.2s', fontFamily: fonts.body }}
    >
      {icon}
      <span className="bottom-nav-label">{label}</span>
    </button>
  )
}

function TicketItem({ title, user, status, colors, fonts }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#fff', border: `1px solid ${colors.muted}`, borderRadius: '4px' }}>
      <div>
        <div style={{ fontSize: '14px', color: colors.textDark, fontWeight: 'bold' }}>{title}</div>
        <div style={{ fontSize: '11px', color: colors.muted, fontFamily: fonts.utility }}>{user}</div>
      </div>
      <span style={{ fontSize: '10px', backgroundColor: colors.highlight, color: colors.textLight, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: fonts.utility }}>
        {status}
      </span>
    </div>
  )
}

function NotificationItem({ text, time, colors, fonts }) {
  return (
    <div style={{ fontSize: '13px', color: colors.textDark, borderBottom: `1px solid rgba(0,0,0,0.1)`, paddingBottom: '8px' }}>
      <div style={{ marginBottom: '2px' }}>{text}</div>
      <div style={{ fontSize: '10px', color: colors.primary, fontFamily: fonts.utility }}>{time}</div>
    </div>
  )
}

function ActivityItem({ name, role, count, colors, fonts }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
      <div>
        <span style={{ fontWeight: 'bold', color: colors.textDark }}>{name}</span>
        <span style={{ color: colors.muted, fontSize: '11px', marginLeft: '6px' }}>({role})</span>
      </div>
      <span style={{ fontFamily: fonts.utility, color: colors.primary, fontSize: '11px' }}>{count}</span>
    </div>
  )
}