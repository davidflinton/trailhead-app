import { Home, Camera, Trophy, Users, Wrench, User, Settings } from 'lucide-react'

export default function Navigation({ activeTab, setActiveTab, campBranding, session }) {
  
  const NavButton = ({ tab, icon: Icon, label }) => {
    const isActive = activeTab === tab
    return (
      <button 
        onClick={() => setActiveTab(tab)} 
        style={{ background: 'none', border: 'none', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: isActive ? campBranding.secondaryColor : '#a3b3a9', borderBottom: isActive ? `3px solid ${campBranding.secondaryColor}` : '3px solid transparent', flex: 1 }}
      >
        <Icon size={24} />
        <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>{label}</span>
      </button>
    )
  }

  return (
    <div style={{ backgroundColor: 'white', borderTop: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-around', padding: '0 5px', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
      <NavButton tab="home" icon={Home} label="Home" />
      <NavButton tab="social" icon={Camera} label="Social" />
      <NavButton tab="challenges" icon={Trophy} label="Challenges" />
      <NavButton tab="team" icon={Users} label="Team" />
      <NavButton tab="requests" icon={Wrench} label="Requests" />
      <NavButton tab="profile" icon={User} label="Profile" />
      {session.userType !== 'camper' && <NavButton tab="admin" icon={Settings} label="Admin" />}
    </div>
  )
}