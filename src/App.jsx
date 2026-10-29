import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Bell, Tent, X, Palette, Sun, Moon } from 'lucide-react'

// Import all existing components
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
import SettingsTab from './components/SettingsTab'
import { THEMES } from './themes'

export default function App() {
  const path = window.location.pathname
  
  if (path.startsWith('/register')) {
    return <Register />
  }
  
  if (path.startsWith('/reset-password')) {
    return <ResetPassword />
  }

  return <AuthenticatedApp />
}

function AuthenticatedApp() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [campData, setCampData] = useState(null)
  
  const [activeTab, setActiveTab] = useState('news')
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Theme state controls
  const [themeKey, setThemeKey] = useState('midnight')
  const [isDarkMode, setIsDarkMode] = useState(true)

  async function handleThemeChange(newKey) {
    setThemeKey(newKey)
    if (session?.user?.id) {
      const { error } = await supabase.from('profiles').update({ theme_key: newKey }).eq('id', session.user.id)
      if (error) console.error('Error saving theme preference:', error.message)
    }
  }

  async function handleDarkModeToggle() {
    const nextMode = !isDarkMode
    setIsDarkMode(nextMode)
    if (session?.user?.id) {
      const { error } = await supabase.from('profiles').update({ is_dark_mode: nextMode }).eq('id', session.user.id)
      if (error) console.error('Error saving display mode preference:', error.message)
    }
  }

  const activeThemePalette = THEMES[themeKey] || THEMES.midnight
  const colors = isDarkMode ? activeThemePalette.dark : activeThemePalette.light

  const fonts = {
    header: "'Staatliches', sans-serif",
    body: "'Karla', sans-serif",
    utility: "'JetBrains Mono', monospace"
  }

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

  useEffect(() => {
    if (!session) return

    let isCurrent = true
    async function loadUserData() {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) throw profileError
        if (!isCurrent) return

        setProfile(profileData)
        const savedThemeKey = ['forest', 'slate'].includes(profileData?.theme_key) ? 'midnight' : profileData?.theme_key
        if (savedThemeKey && THEMES[savedThemeKey]) {
          setThemeKey(savedThemeKey)
          if (profileData.theme_key !== savedThemeKey) {
            const { error: themeMigrationError } = await supabase
              .from('profiles')
              .update({ theme_key: savedThemeKey })
              .eq('id', session.user.id)
            if (themeMigrationError) console.error('Error updating default theme preference:', themeMigrationError.message)
          }
        }
        if (profileData?.is_dark_mode !== undefined && profileData?.is_dark_mode !== null) {
          setIsDarkMode(profileData.is_dark_mode)
        }

        const params = new URLSearchParams(window.location.search)
        const urlCampId = params.get('campId')
        const campId = urlCampId || profileData?.camp_id

        if (campId) {
          const { data: campResult, error: campError } = await supabase
            .from('camps')
            .select('*')
            .eq('id', campId)
            .single()

          if (campError) throw campError
          if (!isCurrent) return
          setCampData(campResult)
        }
      } catch (error) {
        console.error('Error fetching user data:', error.message)
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadUserData()
    return () => { isCurrent = false }
  }, [session])

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: THEMES.classic.dark.background, color: THEMES.classic.dark.primary, fontFamily: fonts.header, fontSize: '24px', letterSpacing: '2px' }}>LOADING TRAILHEAD...</div>
  }

  if (!session) {
    return <Login />
  }

  const isGlobalAdmin = profile?.access_tier === 'global_superadmin' || profile?.access_tier === 'global_admin'
  if (!campData && isGlobalAdmin) {
    return (
      <Lobby 
        profile={profile} 
        currentUserEmail={session.user.email}
        colors={colors} 
        fonts={fonts} 
        isDarkMode={isDarkMode} 
        setIsDarkMode={handleDarkModeToggle} 
        themeKey={themeKey} 
        setThemeKey={handleThemeChange} 
      />
    )
  }

  const renderDrawerLink = (label, targetTab) => (
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
              onChange={(e) => handleThemeChange(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${colors.highlight}`, backgroundColor: colors.background, color: colors.textLight, fontSize: '13px', cursor: 'pointer', outline: 'none' }}
            >
              {Object.entries(THEMES).map(([key, t]) => (
                <option key={key} value={key} style={{ background: colors.sidebar, color: colors.textLight }}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Light/Dark Mode Toggle */}
          <button 
            onClick={handleDarkModeToggle} 
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
        {activeTab === 'profile' && <ProfileTab session={session} setSession={setSession} profile={profile} colors={colors} fonts={fonts} />}
        
        {/* Admin & Utility Tabs */}
        {activeTab === 'admin' && <AdminTab profile={profile} campData={campData} colors={colors} fonts={fonts} />}
        {activeTab === 'staff-manager' && <StaffManager supabase={supabase} selectedPropertyName={campData?.name || 'Test-Youth Camp'} colors={colors} fonts={fonts} isDarkMode={isDarkMode} />}
        {activeTab === 'customer-db' && <CustomerDatabase colors={colors} fonts={fonts} />}
        {activeTab === 'settings' && <SettingsTab colors={colors} fonts={fonts} isDarkMode={isDarkMode} setIsDarkMode={handleDarkModeToggle} themeKey={themeKey} setThemeKey={handleThemeChange} selectedPropertyName={campData?.name || 'Trailhead Admin Console'} />}
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
                {renderDrawerLink('Admin Dashboard', 'admin')}
                {renderDrawerLink('Staff Manager', 'staff-manager')}
                {renderDrawerLink('Customer DB', 'customer-db')}
              </>
            )}
            
            {/* Global & Standard Links */}
            {renderDrawerLink('Camp Store', 'store')}
            {renderDrawerLink('Payments', 'payments')}
            {renderDrawerLink('Online Forms', 'forms')}
            {renderDrawerLink('Interactive Camp Map', 'map')}
            {renderDrawerLink('Nature ID Tool', 'nature-id')}
            {renderDrawerLink('Challenges', 'challenges')}
            {renderDrawerLink('Requests', 'requests')}

            {/* Youth Camp Specific Links */}
            {campData?.type === 'youth_camp' && (
              <>
                {renderDrawerLink('Team Performance Reviews', 'team-reviews')}
                {renderDrawerLink('Camper / Nature Guidebook', 'guidebook')}
                {renderDrawerLink('Volunteer Pocket Handbook', 'volunteer-handbook')}
                {renderDrawerLink('Report a Problem', 'report-problem')}
                {renderDrawerLink('Speak Up', 'speak-up')}
              </>
            )}

            {/* Standard RV Specific Links */}
            {campData?.type === 'standard_rv' && (
              <>
                {renderDrawerLink('Private Performance Reviews', 'private-reviews')}
                {renderDrawerLink('Maintenance Requests', 'maintenance')}
                {renderDrawerLink('Hours of Operation', 'hours')}
                {renderDrawerLink('Contacts', 'contacts')}
                {renderDrawerLink('Campground Rules', 'rules')}
                {renderDrawerLink('Campground Policies', 'policies')}
                {renderDrawerLink('Employee Handbook', 'employee-handbook')}
              </>
            )}

            {/* Settings Link at the bottom of the menu */}
            {renderDrawerLink('Settings', 'settings')}
            
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
        colors={colors}
        setIsMoreOpen={setIsMoreOpen} 
        isMoreOpen={isMoreOpen}
        fonts={fonts}
      />
      
    </div>
  )
}