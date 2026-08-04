import { Newspaper, Calendar, Camera, Users, Menu, Tent } from 'lucide-react'

export default function Navigation({ activeTab, setActiveTab, campBranding, session, setIsMoreOpen }) {
  
  const ProfileIcon = () => (
    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: campBranding.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {session?.photoUrl ? (
        <img src={session.photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Tent size={14} color={campBranding.secondaryColor} />
      )}
    </div>
  )

  const NavButton = ({ tab, icon: Icon, label, isDrawerTrigger }) => {
    const isActive = activeTab === tab && !isDrawerTrigger
    return (
      <button 
        onClick={() => isDrawerTrigger ? setIsMoreOpen(true) : setActiveTab(tab)} 
        style={{ background: 'none', border: 'none', padding: '10px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: isActive ? campBranding.secondaryColor : '#a3b3a9', borderBottom: isActive ? `3px solid ${campBranding.secondaryColor}` : '3px solid transparent', flex: 1 }}
      >
        <Icon size={24} />
        <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>{label}</span>
      </button>
    )
  }

  return (
    <div style={{ backgroundColor: 'white', borderTop: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', padding: '0', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
      <NavButton tab="news" icon={Newspaper} label="News" />
      <NavButton tab="events" icon={Calendar} label="Events" />
      <NavButton tab="social" icon={Camera} label="Social" />
      <NavButton tab="teams" icon={Users} label="Teams" />
      <NavButton tab="profile" icon={ProfileIcon} label="Profile" />
      <NavButton tab="more" icon={Menu} label="More" isDrawerTrigger={true} />
    </div>
  )
}