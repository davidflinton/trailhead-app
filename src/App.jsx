import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Bell, Tent, X } from 'lucide-react'

// Import all your existing components
import Navigation from './components/Navigation'
import Login from './components/Login'
import Lobby from './components/Lobby'
import NewsTab from './components/NewsTab'
import EventsTab from './components/EventsTab'
import SocialTab from './components/SocialTab'
import TeamTab from './components/TeamTab'
import ProfileTab from './components/ProfileTab'
import AdminTab from './components/AdminTab'
import ChallengesTab from './components/ChallengesTab'
import RequestsTab from './components/RequestsTab'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [campData, setCampData] = useState(null)
  
  const [activeTab, setActiveTab] = useState('news')
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
      // Get the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Get their specific camp data to determine the face of the app
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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9f8f6' }}>Loading Trailhead...</div>
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
      style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '16px', color: '#182821', cursor: 'pointer', fontWeight: 'bold', padding: '10px 0' }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9f8f6', fontFamily: 'sans-serif' }}>
      
      {/* GLOBAL TOP HEADER */}
      <div style={{ backgroundColor: '#14532d', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('news')}>
          <Tent size={24} />
          <h1 style={{ margin: 0, fontSize: '20px', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '1px' }}>
            {campData?.name || 'Trailhead'}
          </h1>
        </div>
        
        {/* Notification Bell with Badge */}
        <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative' }}>
          <Bell size={24} />
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', backgroundColor: '#dc2626', borderRadius: '50%', border: '2px solid #14532d' }}></span>
        </button>
      </div>

      {/* MAIN SCROLLABLE CONTENT AREA */}
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px', position: 'relative' }}>
        
        {/* Core Tabs */}
        {activeTab === 'news' && <NewsTab activeCamp={campData} />}
        {activeTab === 'events' && <EventsTab activeCamp={campData} />}
        {activeTab === 'social' && <SocialTab session={session} activeCamp={campData} />}
        {activeTab === 'profile' && <ProfileTab session={session} profile={profile} />}
        
        {/* Admin & Utility Tabs */}
        {activeTab === 'admin' && <AdminTab profile={profile} campData={campData} />}
        {activeTab === 'challenges' && <ChallengesTab activeCamp={campData} />}
        {activeTab === 'requests' && <RequestsTab activeCamp={campData} />}
        
        {/* Conditional Tabs based on Camp Type */}
        {activeTab === 'teams' && campData?.type === 'youth_camp' && <TeamTab activeCamp={campData} />}
        {activeTab === 'comms' && campData?.type === 'standard_rv' && <div>Comms Component Here</div>}
        
        {/* Basic Placeholders for Drawer Items */}
        {activeTab === 'store' && <div>Camp Store Here</div>}
        {activeTab === 'forms' && <div>Online Forms Here</div>}
      </div>

      {/* GLOBAL SLIDE-OUT MENU DRAWER */}
      <div 
        onClick={() => setIsMoreOpen(false)} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, opacity: isMoreOpen ? 1 : 0, pointerEvents: isMoreOpen ? 'auto' : 'none', transition: 'opacity 0.3s' }}
      >
        <div 
          onClick={(e) => e.stopPropagation()} 
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '280px', backgroundColor: 'white', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', transform: isMoreOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out' }}
        >
          <div style={{ padding: '20px', backgroundColor: '#14532d', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Menu</h2>
            <button onClick={() => setIsMoreOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
          </div>
          
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
            
            {/* Admin Links */}
            {(profile?.access_tier === 'global_superadmin' || profile?.access_tier === 'global_admin' || profile?.access_tier === 'camp_superadmin' || profile?.access_tier === 'camp_admin') && (
              <DrawerLink label="Admin Dashboard" targetTab="admin" />
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
            
            {/* Leave Camp Button for Global Admins to return to Lobby */}
            {isGlobalAdmin && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <button 
                  onClick={() => { setCampData(null); setIsMoreOpen(false); }} 
                  style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '16px', color: '#c05b26', cursor: 'pointer', fontWeight: 'bold' }}
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
        campBranding={{ primaryColor: '#14532d', secondaryColor: '#d97706' }} 
        session={profile} 
        campType={campData?.type}
        setIsMoreOpen={setIsMoreOpen} 
      />
      
    </div>
  )
}