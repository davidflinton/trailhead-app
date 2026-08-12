import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Bell, Tent, X, Palette, Shield, Database, Sun, Moon } from 'lucide-react'

// Import all your existing components
import Navigation from './components/Navigation'
import Login from './components/Login'
import Lobby from './components/Lobby'
import Register from './components/Register'
import ResetPassword from './components/ResetPassword'
import NewsTab from './components/NewsTab'
import EventsTab from './components/EventsTab'
import SocialTab from './components/SocialTab'
import TeamTab from './components/TeamTab'
import ProfileTab from './components/ProfileTab'
import AdminTab from './components/AdminTab'
import ChallengesTab from './components/ChallengesTab'
import RequestsTab from './components/RequestsTab'
import StaffManager from './components/StaffManager'
import CustomerDatabase from './components/CustomerDatabase'

// Freshdesk-inspired theme palette definitions
export const THEMES = {
  forest: {
    name: 'Forest Sage',
    dark: { background: '#16281D', sidebar: '#0F1D14', panel: '#0F1D14', border: '#2A4731', textDark: '#F1E8D0', textLight: '#F1E8D0', muted: '#8A9A8F', primary: '#C1531B', error: '#E8896B', highlight: '#1E3524' },
    light: { background: '#F4F7F5', sidebar: '#FFFFFF', panel: '#FFFFFF', border: '#D1DCD5', textDark: '#1A2E22', textLight: '#1A2E22', muted: '#5C7365', primary: '#C1531B', error: '#E8896B', highlight: '#E2ECE5' }
  },
  slate: {
    name: 'Midnight Slate',
    dark: { background: '#0B0F17', sidebar: '#111827', panel: '#111827', border: '#374151', textDark: '#F3F4F6', textLight: '#F3F4F6', muted: '#9CA3AF', primary: '#3B82F6', error: '#EF4444', highlight: '#1F2937' },
    light: { background: '#F9FAFB', sidebar: '#FFFFFF', panel: '#FFFFFF', border: '#E5E7EB', textDark: '#1F2937', textLight: '#1F2937', muted: '#6B7280', primary: '#2563EB', error: '#EF4444', highlight: '#F3F4F6' }
  },
  rust: {
    name: 'Ember Rust',
    dark: { background: '#14100F', sidebar: '#1C1615', panel: '#1C1615', border: '#42322E', textDark: '#F7F2EE', textLight: '#F7F2EE', muted: '#A38F8A', primary: '#D97706', error: '#EF4444', highlight: '#2B211E' },
    light: { background: '#FFFBF9', sidebar: '#FFFFFF', panel: '#FFFFFF', border: '#E8DCD6', textDark: '#2B211E', textLight: '#2B211E', muted: '#7A6863', primary: '#B45309', error: '#EF4444', highlight: '#F7F2EE' }
  },
  ocean: {
    name: 'Deep Ocean',
    dark: { background: '#060A10', sidebar: '#0A1118', panel: '#0A1118', border: '#1E293B', textDark: '#E2E8F0', textLight: '#E2E8F0', muted: '#94A3B8', primary: '#0EA5E9', error: '#EF4444', highlight: '#111827' },
    light: { background: '#F8FAFC', sidebar: '#FFFFFF', panel: '#FFFFFF', border: '#CBD5E1', textDark: '#0F172A', textLight: '#0F172A', muted: '#64748B', primary: '#0284C7', error: '#EF4444', highlight: '#F1F5F9' }
  },
  minimal: {
    name: 'Charcoal Minimal',
    dark: { background: '#0A0A0A', sidebar: '#121212', panel: '#121212', border: '#2C2C2C', textDark: '#FFFFFF', textLight: '#FFFFFF', muted: '#888888', primary: '#E5E7EB', error: '#EF4444', highlight: '#1E1E1E' },
    light: { background: '#FFFFFF', sidebar: '#FFFFFF', panel: '#FFFFFF', border: '#CCCCCC', textDark: '#111111', textLight: '#111111', muted: '#666666', primary: '#333333', error: '#EF4444', highlight: '#F2F2F2' }
  }
};

export default function App() {
  // 0. Intercept Routes Immediately
  const path = window.location.pathname
  
  if (path.startsWith('/register')) {
    return <Register />
  }
  
  if (path.startsWith('/reset-password')) {
    return <ResetPassword />
  }

  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [campData, setCampData] = useState(null)
  
  const [activeTab, setActiveTab] = useState('news')
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Theme state controls
  const [themeKey, setThemeKey] = useState('forest')
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Active theme colors resolution
  const activeThemePalette = THEMES[themeKey] || THEMES.forest
  const colors = isDarkMode ? activeThemePalette.dark : activeThemePalette.light

  // Official Fonts
  const fonts = {
    header: "'Staatliches', sans-serif",
    body: "'Karla', sans-serif",
    utility: "'JetBrains Mono', monospace"
  }

  // 1. Check Authentication State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Fetch Profile and Camp Data securely
  useEffect(() => {
    if (session) {
      fetchUserData()
    }
  }, [session])

  async function fetchUserData() {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      if (profileData?.camp_id) {
        const { data: campResult, error: campError } = await supabase
          .from('camps')
          .select('*')
          .eq('id', profileData.camp_id)
          .single()
          
        if (campError) throw campError
        setCampData(campResult)
      }
    } catch (error) {
      console.error("Error fetching user data:", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Render Loading State
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.background, color: colors.primary, fontFamily: fonts.header, fontSize: '24px', letterSpacing: '2px' }}>LOADING TRAILHEAD...</div>
  }

  // 4. Render Login Screen if no session exists
  if (!session) {
    return <Login />
  }

  // 5. INTERCEPT: Render Global Admin Lobby if no camp is selected
  const isGlobalAdmin = profile?.access_tier === 'global_superadmin' || profile?.access_tier === 'global_admin'
  if (!campData && isGlobalAdmin) {
    return <Lobby profile={profile} setCampData={setCampData} setActiveTab={setActiveTab} />
  }

  // 6. Drawer Link Helper
  const DrawerLink = ({ label, targetTab }) => (
    <button 
      onClick={() => { setActiveTab(targetTab); setIsMoreOpen(false); }} 
      style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '16px', color: colors.textLight, cursor: 'pointer', fontFamily: fonts.body, fontWeight: 'bold', padding: '12px 0', borderBottom: `1px solid ${colors.highlight}` }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: colors.background, color: colors.textLight, fontFamily: fonts.body }}>
      
      {/* GLOBAL TOP HEADER */}
      <div style={{ backgroundColor: colors.sidebar, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${colors.highlight}`, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('news')}>
          <Tent size={28} color={colors.primary} />
          <h1 style={{ margin: 0, fontSize: '24px', fontFamily: fonts.header, color: colors.textLight, textTransform: 'uppercase', letterSpacing: '2px' }}>
            {campData?.name || 'Trailhead'}
          </h1>
        </div>
        
        {/* Right Header Actions & Theme Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Theme Dropdown Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={16} color={colors.muted} />
            <select 
              value={themeKey} 
              onChange={(e) => setThemeKey(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${colors.highlight}`, backgroundColor: colors.background, color: colors.textLight, fontSize: '13px', cursor: 'pointer', outline: 'none' }}
            >
              {Object.entries(THEMES).map(([key, t]) => (
                <option key={key} value={key} style={{ background: colors.sidebar, color: colors.textLight }}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Light/Dark Mode Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${colors.highlight}`, backgroundColor: 'transparent', color: colors.textLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Toggle Dark/Light Mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification Bell */}
          <button style={{ background: 'none', border: 'none', color: colors.textLight, cursor: 'pointer', position: 'relative' }}>
            <Bell size={24} />
            <span style={{ position: 'absolute', top: '0', right: '0', width: '10px', height: '10px', backgroundColor: colors.error, borderRadius: '50%', border: `2px solid ${colors.sidebar}` }}></span>
          </button>
        </div>
      </div>

      {/* MAIN SCROLLABLE CONTENT AREA */}
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px', position: 'relative' }}>
        
        {/* Core Tabs */}
        {activeTab === 'news' && <NewsTab activeCamp={campData} colors={colors} fonts={fonts} />}
        {activeTab === 'events' && <EventsTab activeCamp={campData} colors={colors} fonts={fonts} />}
        {activeTab === 'social' && <SocialTab session={session} activeCamp={campData} colors={colors} fonts={fonts} />}
        {activeTab === 'profile' && <ProfileTab session={session} profile={profile} colors={colors} fonts={fonts} />}
        
        {/* Admin & Utility Tabs */}
        {activeTab === 'admin' && <AdminTab profile={profile} campData={campData} colors={colors} fonts={fonts} />}
        {activeTab === 'staff-manager' && <StaffManager supabase={supabase} selectedPropertyName={campData?.name || 'Whispering Pines Youth Camp'} colors={colors} fonts={fonts} isDarkMode={isDarkMode} />}
        {activeTab === 'customer-db' && <CustomerDatabase colors={colors} fonts={fonts} isDarkMode={isDarkMode} />}
        {activeTab === 'challenges' && <ChallengesTab activeCamp={campData} colors={colors} fonts={fonts} />}
        {activeTab === 'requests' && <RequestsTab activeCamp={campData} colors={colors} fonts={fonts} />}
        
        {/* Conditional Tabs based on Camp Type */}
        {activeTab === 'teams' && campData?.type === 'youth_camp' && <TeamTab activeCamp={campData} colors={colors} fonts={fonts} />}
        {activeTab === 'comms' && campData?.type === 'standard_rv' && <div style={{ color: colors.textLight, fontFamily: fonts.body }}>Comms Component Here</div>}
        
        {/* Placeholders */}
        {activeTab === 'store' && <div style={{ color: colors.textLight, fontFamily: fonts.body }}>Camp Store Here</div>}
        {activeTab === 'forms' && <div style={{ color: colors.textLight, fontFamily: fonts.body }}>Online Forms Here</div>}
      </div>

      {/* GLOBAL SLIDE-OUT MENU DRAWER */}
      <div 
        onClick={() => setIsMoreOpen(false)} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999, opacity: isMoreOpen ? 1 : 0, pointerEvents: isMoreOpen ? 'auto' : 'none', transition: 'opacity 0.3s' }}
      >
        <div 
          onClick={(e) => e.stopPropagation()} 
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '280px', backgroundColor: colors.sidebar, borderLeft: `2px solid ${colors.highlight}`, display: 'flex', flexDirection: 'column', transform: isMoreOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out' }}
        >
          <div style={{ padding: '20px', backgroundColor: colors.highlight, color: colors.textLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontFamily: fonts.header, letterSpacing: '1px' }}>MENU</h2>
            <button onClick={() => setIsMoreOpen(false)} style={{ background: 'none', border: 'none', color: colors.textLight, cursor: 'pointer' }}><X size={24} /></button>
          </div>
          
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            {/* Admin Links */}
            {(profile?.access_tier === 'global_superadmin' || profile?.access_tier === 'global_admin' || profile?.access_tier === 'camp_superadmin' || profile?.access_tier === 'camp_admin') && (
              <>
                <DrawerLink label="Admin Dashboard" targetTab="admin" />
                <DrawerLink label="Staff Manager" targetTab="staff-manager" />
                <DrawerLink label="Customer DB" targetTab="customer-db" />
              </>
            )}
            
            {/* Global Links */}
            <DrawerLink label="Camp Store" targetTab="store" />
            <DrawerLink label="Payments" targetTab="payments" />
            <DrawerLink label="Online Forms" targetTab="forms" />
            <DrawerLink label="Interactive Camp Map" targetTab="map" />
            <DrawerLink label="Nature ID Tool" targetTab="nature-id" />
            <DrawerLink label="Challenges" targetTab="challenges" />
            <DrawerLink label="Requests" targetTab="requests" />

            {/* Youth Camp Specific Links */}
            {campData?.type === 'youth_camp' && (
              <>
                <DrawerLink label="Team Performance Reviews" targetTab="team-reviews" />
                <DrawerLink label="Camper / Nature Guidebook" targetTab="guidebook" />
                <DrawerLink label="Volunteer Pocket Handbook" targetTab="volunteer-handbook" />
                <DrawerLink label="Report a Problem" targetTab="report-problem" />
                <DrawerLink label="Speak Up" targetTab="speak-up" />
              </>
            )}

            {/* Standard RV Specific Links */}
            {campData?.type === 'standard_rv' && (
              <>
                <DrawerLink label="Private Performance Reviews" targetTab="private-reviews" />
                <DrawerLink label="Maintenance Requests" targetTab="maintenance" />
                <DrawerLink label="Hours of Operation" targetTab="hours" />
                <DrawerLink label="Contacts" targetTab="contacts" />
                <DrawerLink label="Campground Rules" targetTab="rules" />
                <DrawerLink label="Campground Policies" targetTab="policies" />
                <DrawerLink label="Employee Handbook" targetTab="employee-handbook" />
              </>
            )}
            
            {/* Leave Camp Button */}
            {isGlobalAdmin && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `2px solid ${colors.highlight}` }}>
                <button 
                  onClick={() => { setCampData(null); setIsMoreOpen(false); }} 
                  style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '16px', color: colors.primary, cursor: 'pointer', fontFamily: fonts.body, fontWeight: 'bold' }}
                >
                  Return to Global Lobby
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        campBranding={{ primaryColor: colors.sidebar, secondaryColor: colors.primary }} 
        session={profile} 
        campType={campData?.type}
        setIsMoreOpen={setIsMoreOpen} 
      />
      
    </div>
  )
}