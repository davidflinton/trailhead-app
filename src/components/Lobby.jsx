import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Tent, Users, CheckSquare, MessageSquare, LogOut, Search, MapPin, ThumbsUp, MessageCircle, BarChart2, Edit2, Plus, LayoutDashboard, Menu, X, Settings, Trash2, AlertTriangle, Moon, Sun, Lock, ShieldAlert, Database, Megaphone, Save, ChevronUp, ChevronDown } from 'lucide-react'
import StaffManager from './StaffManager'
import CustomerDatabase from './CustomerDatabase'
import SettingsTab from './SettingsTab'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const announcementEditorModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
}

function normalizeAnnouncementHtml(html) {
  return (html || '').replace(/(?:&nbsp;|&#160;|&#xA0;|\u00a0)/gi, ' ')
}

async function loadProperties(profile) {
  let assignedCamps = []
  if (profile?.id && profile?.access_tier !== 'global_superadmin') {
    const { data: personnelData } = await supabase.from('trailhead_personnel').select('assigned_camps').eq('id', profile.id).single()
    assignedCamps = personnelData?.assigned_camps || []
  }

  const { data, error } = await supabase.from('camps').select('*').order('name')
  if (error) console.error('Error fetching properties:', error.message)
  return { camps: data, assignedCamps }
}

export default function Lobby({ profile, currentUserEmail, colors, fonts, isDarkMode, setIsDarkMode, themeKey, setThemeKey }) {
  const [lobbyTab, setLobbyTab] = useState('dashboard')
  const [townHallView, setTownHallView] = useState('discussions')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const [camps, setCamps] = useState([])
  const [myAssignedCamps, setMyAssignedCamps] = useState([])
  const [pendingRegistrations, setPendingRegistrations] = useState([])
  const [isAddingRegistration, setIsAddingRegistration] = useState(false)
  const [isSavingRegistration, setIsSavingRegistration] = useState(false)
  const [registrationError, setRegistrationError] = useState('')
  const [approvalError, setApprovalError] = useState('')
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    type: 'Campground',
    contact_name: '',
    contact_number: '',
    contact_email: '',
    mailing_address: '',
    property_address: '',
    website_url: '',
    gs_restricted: false
  })
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  const [selectedCampId, setSelectedCampId] = useState(null)
  const [isAddingCamp, setIsAddingCamp] = useState(false)
  const [isEditingCamp, setIsEditingCamp] = useState(false)
  const [isDeletingCamp, setIsDeletingCamp] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  const [adminAnnouncement, setAdminAnnouncement] = useState('<h3>Welcome to the Project Trailhead Admin Console</h3><p>Thanks for agreeing to be our test pilots for this phase. Your feedback is what will iron out the bugs before we open this up to a larger public test group.</p>')
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false)
  const [announcementSaveError, setAnnouncementSaveError] = useState('')
  const [tempAnnouncement, setTempAnnouncement] = useState('')
  const [isAnnouncementCollapsed, setIsAnnouncementCollapsed] = useState(false)
  const [hasBeenUpdated, setHasBeenUpdated] = useState(false)
  const canEditAnnouncements = currentUserEmail?.trim().toLowerCase() === 'david.flinton@gmail.com'

  useEffect(() => {
    let isCurrent = true
    async function loadAnnouncement() {
      const { data } = await supabase
        .from('global_settings')
        .select('value')
        .eq('key', 'admin_announcement')
        .single()

      if (isCurrent && data?.value) {
        setAdminAnnouncement(normalizeAnnouncementHtml(data.value))
      }
    }

    void loadAnnouncement()
    return () => { isCurrent = false }
  }, [])

  async function saveAnnouncement() {
    if (!canEditAnnouncements) {
      setAnnouncementSaveError('You are not authorized to edit admin announcements.')
      return
    }
    if (isSavingAnnouncement) return

    const normalizedAnnouncement = normalizeAnnouncementHtml(tempAnnouncement)
    setIsSavingAnnouncement(true)
    setAnnouncementSaveError('')

    try {
      const { error } = await supabase
        .from('global_settings')
        .upsert({ key: 'admin_announcement', value: normalizedAnnouncement })

      if (error) throw error

      setAdminAnnouncement(normalizedAnnouncement)
      setIsEditingAnnouncement(false)
      setIsAnnouncementModalOpen(false)
      setHasBeenUpdated(true)
    } catch (error) {
      console.error('Error saving admin announcement:', error.message)
      setAnnouncementSaveError('Unable to save the announcement. Please try again.')
    } finally {
      setIsSavingAnnouncement(false)
    }
  }

  const defaultCampForm = {
    name: '', type: 'Campground', contact_name: '', contact_number: '', 
    contact_email: '', mailing_address: '', property_address: '', website_url: '',
    gs_restricted: false
  }
  const [campForm, setCampForm] = useState(defaultCampForm)

  const [selectedProject, setSelectedProject] = useState('Squirrel Hill Campground')
  const [newProjectName, setNewProjectName] = useState('')
  
  const headerDisplayName = profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.access_tier

  useEffect(() => {
    let isCurrent = true
    async function loadInitialProperties() {
      const { camps, assignedCamps } = await loadProperties(profile)
      if (isCurrent) {
        setMyAssignedCamps(assignedCamps)
        if (camps) setCamps(camps)
        setIsLoading(false)
      }
    }

    void loadInitialProperties()
    return () => { isCurrent = false }
  }, [profile])

  useEffect(() => {
    if (lobbyTab !== 'approvals') return

    let isCurrent = true
    async function loadPendingRegistrations() {
      const { data, error } = await supabase
        .from('camp_registrations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending camp registrations:', error.message)
        if (isCurrent) setApprovalError('Unable to load pending registrations. Please try again.')
        return
      }

      if (isCurrent) {
        setPendingRegistrations(data || [])
        setApprovalError('')
      }
    }

    void loadPendingRegistrations()
    return () => { isCurrent = false }
  }, [lobbyTab])

  const selectedCamp = camps.find(c => c.id === selectedCampId)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const refreshProperties = async () => {
    setIsLoading(true)
    const { camps: updatedCamps, assignedCamps } = await loadProperties(profile)
    setMyAssignedCamps(assignedCamps)
    if (updatedCamps) setCamps(updatedCamps)
    setIsLoading(false)
  }

  const refreshPendingRegistrations = async () => {
    const { data, error } = await supabase
      .from('camp_registrations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error refreshing pending camp registrations:', error.message)
      setApprovalError('Unable to refresh pending registrations. Please try again.')
      return
    }

    setPendingRegistrations(data || [])
    setApprovalError('')
  }

  const handleSubmitRegistration = async (event) => {
    event.preventDefault()
    if (isSavingRegistration) return

    setRegistrationError('')
    setIsSavingRegistration(true)

    const { error } = await supabase
      .from('camp_registrations')
      .insert([{
        ...registrationForm,
        name: registrationForm.name.trim(),
        submitted_by: profile.id
      }])

    if (error) {
      console.error('Error submitting camp registration:', error.message)
      setRegistrationError('Unable to submit the registration. Please try again.')
    } else {
      setRegistrationForm({
        name: '',
        type: 'Campground',
        contact_name: '',
        contact_number: '',
        contact_email: '',
        mailing_address: '',
        property_address: '',
        website_url: '',
        gs_restricted: false
      })
      setIsAddingRegistration(false)
      await refreshPendingRegistrations()
    }

    setIsSavingRegistration(false)
  }

  const handleReviewRegistration = async (registration, decision) => {
    setApprovalError('')
    const { error } = await supabase.rpc(
      decision === 'approve' ? 'approve_camp_registration' : 'reject_camp_registration',
      { registration_id: registration.id }
    )

    if (error) {
      console.error(`Error ${decision}ing camp registration:`, error.message)
      setApprovalError(`Unable to ${decision} this registration. Please try again.`)
      return
    }

    await refreshPendingRegistrations()
    if (decision === 'approve') await refreshProperties()
  }

  const handleAddCamp = async () => {
    if (!campForm.name.trim()) return
    const { error } = await supabase.from('camps').insert([campForm])
    if (error) console.error("Error adding camp:", error.message)
    else { resetPropertyForms(); refreshProperties(); }
  }

  const handleUpdateCamp = async () => {
    if (!campForm.name.trim() || !selectedCampId) return
    const { error } = await supabase.from('camps').update(campForm).eq('id', selectedCampId)
    if (error) console.error("Error updating camp:", error.message)
    else { resetPropertyForms(); refreshProperties(); }
  }

  const handleDeleteCamp = async () => {
    if (!deletePassword) return
    const { error } = await supabase.from('camps').delete().eq('id', selectedCampId)
    if (error) console.error("Error deleting camp:", error.message)
    else {
      setIsDeletingCamp(false)
      setDeletePassword('')
      setSelectedCampId(null)
      refreshProperties()
    }
  }

  const resetPropertyForms = () => {
    setIsAddingCamp(false)
    setIsEditingCamp(false)
    setCampForm(defaultCampForm)
  }

  const openEditForm = (camp = selectedCamp) => {
    if (!camp) return
    setSelectedCampId(camp.id)
    setIsAddingCamp(false)
    setIsEditingCamp(true)
    setCampForm({
      name: camp.name || '', type: camp.type || 'Standard Property',
      contact_name: camp.contact_name || '', contact_number: camp.contact_number || '',
      contact_email: camp.contact_email || '', mailing_address: camp.mailing_address || '',
      property_address: camp.property_address || '', website_url: camp.website_url || '',
      gs_restricted: camp.gs_restricted || false
    })
  }

  const handleProjectTextChange = (e) => {
    setNewProjectName(e.target.value.replace(/\b\w/g, char => char.toUpperCase()))
  }

  const filteredCamps = camps.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
  const visibleCamps = filteredCamps.filter(camp => {
    if (profile?.access_tier === 'global_superadmin') return true;
    if (profile?.access_tier === 'global_admin') return !camp.gs_restricted;
    return myAssignedCamps.includes(camp.id);
  })

  const dashboardWidgetStyle = {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: '16px 20px',
    backgroundColor: colors.panel,
    border: `2px solid ${colors.highlight}`,
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'left',
    color: colors.textDark,
    fontFamily: fonts.body
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body, overflow: 'hidden' }}>
      <style>{`
        ::-webkit-scrollbar { width: 8px; } 
        ::-webkit-scrollbar-track { background: ${colors.background}; } 
        ::-webkit-scrollbar-thumb { background: ${colors.highlight}; border-radius: 4px; }
        
        .trailhead-announcement-content {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          word-break: normal;
          word-wrap: normal;
          overflow-wrap: normal;
          white-space: normal;
          text-wrap: wrap;
          hyphens: none;
        }

        .trailhead-announcement-content * {
          max-width: 100%;
          min-width: 0;
          word-break: normal !important;
          word-wrap: normal !important;
          overflow-wrap: normal !important;
          white-space: normal !important;
          text-wrap: wrap !important;
        }

        .announcement-modal-content {
          color: ${colors.textDark};
          background: ${colors.panel};
          max-height: none;
          overflow: visible;
        }

        .announcement-modal-content h1,
        .announcement-modal-content h2,
        .announcement-modal-content h3 {
          color: ${colors.textDark};
        }

        .announcement-modal-editor .ql-toolbar.ql-snow,
        .announcement-modal-editor .ql-container.ql-snow,
        .announcement-modal-editor .ql-editor {
          background: ${colors.panel};
          color: ${colors.textDark};
        }

        .announcement-modal-editor .ql-container.ql-snow {
          height: auto !important;
          overflow: visible !important;
        }

        .announcement-modal-editor .ql-editor {
          min-height: 45vh;
          height: auto !important;
          overflow: visible !important;
        }
        
        .trailhead-announcement-content.preview {
          max-height: 180px;
          overflow: hidden;
        }
        
        .trailhead-announcement-content.expanded {
          max-height: 500px;
          overflow-y: auto;
          overflow-x: hidden;
          display: block;
          width: 100%;
          min-width: 0;
          word-break: normal !important;
          word-wrap: normal !important;
          overflow-wrap: normal !important;
          white-space: normal !important;
          text-wrap: wrap !important;
        }

        .trailhead-announcement-content.expanded > * {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          word-break: normal !important;
          word-wrap: normal !important;
          overflow-wrap: normal !important;
          white-space: normal !important;
          text-wrap: wrap !important;
        }
        
        /* Clean typography for raw HTML */
        .trailhead-announcement-content p {
          margin: 0 0 16px 0;
          line-height: 1.6;
        }
        
        .trailhead-announcement-content h1, 
        .trailhead-announcement-content h2, 
        .trailhead-announcement-content h3 {
          margin: 20px 0 12px 0;
          color: ${colors.primary};
          line-height: 1.3;
        }
        
        .trailhead-announcement-content ul, 
        .trailhead-announcement-content ol {
          padding-left: 24px;
          margin: 0 0 16px 0;
        }
        
        .trailhead-announcement-content li {
          margin-bottom: 8px;
        }

        /* Editor Constraints */
        .quill .ql-container.ql-snow {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          height: 150px !important;
          overflow-y: auto !important;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }
        .quill .ql-toolbar.ql-snow {
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
        }
        .quill .ql-editor {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          height: 150px !important;
          overflow-y: auto !important;
          white-space: pre-wrap !important;
          word-break: normal !important;
          word-wrap: normal !important;
          overflow-wrap: normal !important;
          hyphens: none;
        }

        .quill .ql-editor * {
          word-break: normal !important;
          word-wrap: normal !important;
          overflow-wrap: normal !important;
          white-space: inherit !important;
          hyphens: none;
        }
      `}</style>

      {/* TOP HEADER */}
      <div style={{ backgroundColor: colors.sidebar, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${colors.highlight}`, zIndex: 10 }}>
        <div 
          onClick={() => setLobbyTab('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
          title="Return to Dashboard"
        >
          <Tent size={36} color={colors.primary} />
          <h1 style={{ margin: 0, fontSize: '28px', fontFamily: fonts.header, color: colors.primary, letterSpacing: '2px', lineHeight: 1 }}>
            TRAILHEAD ADMIN CONSOLE
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ background: 'none', border: 'none', color: colors.textLight, cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }} title="Toggle Theme">
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: colors.error, cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }} title="Sign Out">
            <LogOut size={24} />
          </button>
          <button onClick={() => setIsMenuOpen(true)} style={{ background: 'none', border: 'none', color: colors.textLight, cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }} title="Menu">
            <Menu size={28} />
          </button>
        </div>
      </div>

      {/* SLIDE OUT MENU & OVERLAY */}
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 40 }} />}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '280px', backgroundColor: colors.sidebar, zIndex: 50, transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out', borderLeft: `2px solid ${colors.highlight}`, display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: '20px', borderBottom: `1px solid ${colors.highlight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: colors.primary, fontFamily: fonts.utility, fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
            User: {headerDisplayName}
          </div>
          <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: colors.textLight, cursor: 'pointer', display: 'flex' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SideNavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={lobbyTab === 'dashboard'} onClick={() => { setLobbyTab('dashboard'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
          <SideNavButton icon={<Tent size={20} />} label="Properties" active={lobbyTab === 'camps'} onClick={() => { setLobbyTab('camps'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
          <SideNavButton icon={<Users size={20} />} label="Staff Directory" active={lobbyTab === 'staff'} onClick={() => { setLobbyTab('staff'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
          <SideNavButton icon={<Database size={20} />} label="Customer Directory" active={lobbyTab === 'database'} onClick={() => { setLobbyTab('database'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
          <SideNavButton icon={<CheckSquare size={20} />} label="Approvals" active={lobbyTab === 'approvals'} onClick={() => { setLobbyTab('approvals'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
          <SideNavButton icon={<MessageSquare size={20} />} label="Town Hall" active={lobbyTab === 'townhall'} onClick={() => { setLobbyTab('townhall'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
          <SideNavButton icon={<Settings size={20} />} label="Settings" active={lobbyTab === 'settings'} onClick={() => { setLobbyTab('settings'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
        </div>
      </div>

      {isDeletingCamp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '100%', border: `2px solid ${colors.error}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.error, marginBottom: '15px' }}>
              <AlertTriangle size={28} />
              <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px' }}>CONFIRM DELETION</h3>
            </div>
            <p style={{ color: colors.textDark, fontSize: '15px', marginBottom: '20px', lineHeight: 1.5 }}>Are you absolutely sure you want to delete <strong>{selectedCamp?.name}</strong>? This action cannot be undone and will erase all associated data.</p>
            <label style={{ display: 'block', color: colors.textDark, fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>ENTER PASSWORD TO CONFIRM:</label>
            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: `1px solid ${colors.error}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body, marginBottom: '25px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setIsDeletingCamp(false); setDeletePassword(''); }} style={{ flex: 1, backgroundColor: 'transparent', color: colors.textDark, border: `1px solid ${colors.muted}`, padding: '12px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '16px' }}>CANCEL</button>
              <button onClick={handleDeleteCamp} disabled={!deletePassword} style={{ flex: 1, backgroundColor: colors.error, color: colors.textDark, border: 'none', padding: '12px', borderRadius: '4px', cursor: deletePassword ? 'pointer' : 'not-allowed', opacity: deletePassword ? 1 : 0.5, fontFamily: fonts.header, fontSize: '16px' }}>DELETE PROPERTY</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, minWidth: 0, width: '100%', padding: '30px 20px', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1000px', width: '100%', minWidth: 0, margin: '0 auto' }}>

          {/* DASHBOARD TAB */}
          {lobbyTab === 'dashboard' && (
            <div>
              <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textDark, margin: '0 0 20px 0', letterSpacing: '1px' }}>SYSTEM DASHBOARD</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                
                {/* System Alerts */}
                <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.error}`, gridColumn: '1 / -1', textAlign: 'center', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: colors.error, marginBottom: '10px' }}>
                    <ShieldAlert size={24} />
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '20px', color: colors.error }}>SYSTEM ALERTS</h3>
                  </div>
                  <p style={{ color: colors.textDark, margin: 0, fontSize: '14px' }}>All deployment nodes operating nominally. Database sync complete.</p>
                </div>

                {/* Admin Announcements Section */}
                <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `1px solid ${colors.border}`, gridColumn: '1 / -1', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px', marginBottom: isAnnouncementCollapsed ? '0' : '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.primary }}>
                      <Megaphone size={20} />
                      <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        ADMIN ANNOUNCEMENTS
                        {hasBeenUpdated && (
                          <span style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, fontSize: '10px', fontFamily: fonts.utility, padding: '2px 6px', borderRadius: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            UPDATED
                          </span>
                        )}
                      </h3>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {!isAnnouncementCollapsed && canEditAnnouncements && (
                        <button 
                          onClick={() => {
                            setTempAnnouncement(adminAnnouncement)
                            setAnnouncementSaveError('')
                            setIsEditingAnnouncement(true)
                            setIsAnnouncementModalOpen(true)
                          }}
                          style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 'bold' }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      )}
                      <button 
                        onClick={() => setIsAnnouncementCollapsed(!isAnnouncementCollapsed)} 
                        style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontFamily: fonts.utility }}
                        title={isAnnouncementCollapsed ? "Expand Section" : "Collapse Section"}
                      >
                        {isAnnouncementCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                      </button>
                    </div>
                  </div>

                  {!isAnnouncementCollapsed && (
                    <div>
                      <div style={{ position: 'relative' }}>
                        <div className="trailhead-announcement-content preview" style={{ color: colors.textDark }} dangerouslySetInnerHTML={{ __html: normalizeAnnouncementHtml(adminAnnouncement) }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: `linear-gradient(transparent, ${colors.panel})`, pointerEvents: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', paddingTop: '10px' }}>
                        <button
                          onClick={() => {
                            setIsEditingAnnouncement(false)
                            setIsAnnouncementModalOpen(true)
                          }}
                          style={{ background: colors.highlight, border: `1px solid ${colors.border}`, color: colors.textLight, cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'bold', padding: '6px 16px', borderRadius: '4px', letterSpacing: '1px' }}
                        >
                          OPEN FULL ANNOUNCEMENT
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Properties Widget */}
                <button type="button" onClick={() => setLobbyTab('camps')} style={dashboardWidgetStyle}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Properties</span>
                      <Tent color={colors.primary} size={24} />
                    </div>
                    <div style={{ fontSize: '14px', color: colors.muted }}>{camps.length} Registered Nodes</div>
                  </div>
                  <div style={{ flex: '1 1 120px', maxWidth: '180px', backgroundColor: colors.border, height: '6px', borderRadius: '3px' }}>
                    <div style={{ width: '85%', backgroundColor: colors.primary, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>MANAGE DIRECTORY &rarr;</span>
                </button>

                {/* Staff Widget */}
                <button type="button" onClick={() => setLobbyTab('staff')} style={dashboardWidgetStyle}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Staff Directory</span>
                      <Users color={colors.primary} size={24} />
                    </div>
                    <div style={{ fontSize: '14px', color: colors.muted }}>Active Personnel: 14</div>
                  </div>
                  <div style={{ flex: '1 1 120px', maxWidth: '180px', backgroundColor: colors.border, height: '6px', borderRadius: '3px' }}>
                    <div style={{ width: '100%', backgroundColor: colors.primary, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>MANAGE STAFF &rarr;</span>
                </button>

                {/* Customer Directory Widget */}
                <button type="button" onClick={() => setLobbyTab('database')} style={dashboardWidgetStyle}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Customer Directory</span>
                      <Database color={colors.primary} size={24} />
                    </div>
                    <div style={{ fontSize: '14px', color: colors.muted }}>Master Repository</div>
                  </div>
                  <div style={{ flex: '1 1 120px', maxWidth: '180px', backgroundColor: colors.border, height: '6px', borderRadius: '3px' }}>
                    <div style={{ width: '100%', backgroundColor: colors.primary, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>VIEW REPOSITORY &rarr;</span>
                </button>

                {/* Approvals Widget */}
                <button type="button" onClick={() => setLobbyTab('approvals')} style={dashboardWidgetStyle}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Approvals</span>
                      <CheckSquare color={colors.primary} size={24} />
                    </div>
                    <div style={{ fontSize: '14px', color: colors.muted }}>0 Pending Registrations</div>
                  </div>
                  <div style={{ flex: '1 1 120px', maxWidth: '180px', backgroundColor: colors.border, height: '6px', borderRadius: '3px' }}>
                    <div style={{ width: '0%', backgroundColor: colors.primary, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>REVIEW QUEUE &rarr;</span>
                </button>

                {/* Consolidated Town Hall Widget */}
                <button type="button" onClick={() => setLobbyTab('townhall')} style={dashboardWidgetStyle}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Town Hall</span>
                      <MessageSquare color={colors.primary} size={24} />
                    </div>
                    <div style={{ fontSize: '14px', color: colors.muted }}>Team Chat & QA Notes</div>
                  </div>
                  <div style={{ flex: '1 1 120px', maxWidth: '180px', backgroundColor: colors.border, height: '6px', borderRadius: '3px' }}>
                    <div style={{ width: '50%', backgroundColor: colors.primary, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>ENTER TOWN HALL &rarr;</span>
                </button>

              </div>
            </div>
          )}

          {/* 1. CAMP MANAGEMENT */}
          {lobbyTab === 'camps' && (
            <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 5px 0', letterSpacing: '1px' }}>PROPERTY DIRECTORY</h2>
                <p style={{ color: colors.muted, margin: 0, fontSize: '14px' }}>Select a property below to access management tools.</p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '4px', border: `1px solid ${colors.muted}` }}>
                {profile?.access_tier === 'global_superadmin' && (
                  <>
                    <button onClick={() => { resetPropertyForms(); setIsAddingCamp(true); setSelectedCampId(null); }} style={{ backgroundColor: colors.highlight, color: colors.textDark, border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={16} /> ADD NEW</button>
                    <div style={{ width: '1px', backgroundColor: colors.muted, margin: '0 5px' }}></div>
                  </>
                )}
                {profile?.access_tier === 'global_superadmin' && (
                  <button disabled={!selectedCampId} onClick={() => setIsDeletingCamp(true)} style={{ backgroundColor: selectedCampId ? colors.error : 'transparent', color: selectedCampId ? 'white' : colors.muted, border: selectedCampId ? 'none' : `1px solid ${colors.muted}`, padding: '10px 15px', borderRadius: '4px', cursor: selectedCampId ? 'pointer' : 'not-allowed', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}><Trash2 size={16} /> DELETE</button>
                )}
              </div>

              {(isAddingCamp || isEditingCamp) && (
                <div style={{ backgroundColor: colors.panel, padding: '25px', borderRadius: '4px', border: `2px solid ${colors.primary}`, marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, margin: 0 }}>{isEditingCamp ? 'EDIT PROPERTY DETAILS' : 'CREATE NEW PROPERTY'}</h3>
                    <button onClick={resetPropertyForms} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}><X size={20}/></button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <input type="text" placeholder="Property Name *" value={campForm.name} onChange={(e) => setCampForm({...campForm, name: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <select value={campForm.type} onChange={(e) => setCampForm({...campForm, type: e.target.value})} style={{ padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }}>
                      <option value="Campground">Campground</option>
                      <option value="Youth Camp">Youth Camp</option>
                      <option value="Standard Property">Standard Property</option>
                    </select>
                    <input type="text" placeholder="Contact Name" value={campForm.contact_name} onChange={(e) => setCampForm({...campForm, contact_name: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="text" placeholder="Contact Number" value={campForm.contact_number} onChange={(e) => setCampForm({...campForm, contact_number: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="email" placeholder="Contact Email" value={campForm.contact_email} onChange={(e) => setCampForm({...campForm, contact_email: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="url" placeholder="Existing Website URL" value={campForm.website_url} onChange={(e) => setCampForm({...campForm, website_url: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="text" placeholder="Property Address" value={campForm.property_address} onChange={(e) => setCampForm({...campForm, property_address: e.target.value})} style={{ gridColumn: '1 / -1', boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="text" placeholder="Mailing Address" value={campForm.mailing_address} onChange={(e) => setCampForm({...campForm, mailing_address: e.target.value})} style={{ gridColumn: '1 / -1', boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    
                    {profile?.access_tier === 'global_superadmin' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', gridColumn: '1 / -1', padding: '10px', backgroundColor: colors.background, borderRadius: '4px', border: `1px solid ${colors.border}` }}>
                        <input type="checkbox" id="gsRestricted" checked={campForm.gs_restricted} onChange={(e) => setCampForm({...campForm, gs_restricted: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        <label htmlFor="gsRestricted" style={{ color: colors.textDark, fontFamily: fonts.body, fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>GS Restricted (Lock out Global Admins)</label>
                      </div>
                    )}
                  </div>
                  
                  <button onClick={isEditingCamp ? handleUpdateCamp : handleAddCamp} style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '14px' }}>
                    {isEditingCamp ? 'SAVE CHANGES' : 'SAVE PROPERTY'}
                  </button>
                </div>
              )}

              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Search size={18} color={colors.muted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input type="text" placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 10px 10px 40px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontSize: '15px', outline: 'none', fontFamily: fonts.body }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                {isLoading ? <div style={{ textAlign: 'center', padding: '20px', color: colors.primary, fontFamily: fonts.utility }}>Loading...</div> : 
                 visibleCamps.length === 0 ? <div style={{ textAlign: 'center', padding: '20px', color: colors.muted }}>No properties found.</div> : 
                 visibleCamps.map(camp => (
                  <div 
                    key={camp.id} 
                    style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: selectedCampId === camp.id ? colors.highlight : colors.panel, border: selectedCampId === camp.id ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, borderRadius: '4px', transition: 'all 0.1s' }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCampId(camp.id)}
                      aria-pressed={selectedCampId === camp.id}
                      style={{ flex: '1 1 240px', minWidth: 0, padding: '5px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', border: 'none', background: 'transparent', color: colors.textDark, textAlign: 'left', cursor: 'pointer', fontFamily: fonts.body }}
                    >
                      <span style={{ display: 'block' }}>
                      <div style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {camp.name}
                        {camp.gs_restricted && <Lock size={14} color={colors.error} title="Restricted Access" />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: colors.muted, fontSize: '12px', fontFamily: fonts.utility, textTransform: 'uppercase' }}>
                        <MapPin size={12} /> {camp.type ? camp.type.replace('_', ' ') : 'Standard Property'}
                        {camp.contact_name && <span style={{ marginLeft: '10px' }}>| Contact: {camp.contact_name}</span>}
                      </div>
                      </span>
                      {selectedCampId === camp.id && <span style={{ color: colors.primary, fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'bold' }}>SELECTED</span>}
                    </button>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                      <button
                        type="button"
                        onClick={() => openEditForm(camp)}
                        style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, border: 'none', padding: '9px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Edit2 size={15} /> EDIT
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newTabUrl = `${window.location.origin}/?campId=${camp.id}`
                          window.open(newTabUrl, '_blank', 'noopener,noreferrer')
                        }}
                        style={{ backgroundColor: colors.highlight, color: colors.textLight, border: `1px solid ${colors.border}`, padding: '9px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Settings size={15} /> MANAGE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lobbyTab === 'staff' && (
            <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              <StaffManager supabase={supabase} colors={colors} fonts={fonts} isDarkMode={isDarkMode} />
            </div>
          )}

          {lobbyTab === 'database' && (
            <CustomerDatabase colors={colors} fonts={fonts} isDarkMode={isDarkMode} />
          )}

          {lobbyTab === 'settings' && (
            <SettingsTab 
              colors={colors} 
              fonts={fonts} 
              isDarkMode={isDarkMode} 
              setIsDarkMode={setIsDarkMode} 
              themeKey={themeKey} 
              setThemeKey={setThemeKey} 
              selectedPropertyName="Global Admin Console" 
            />
          )}

          {lobbyTab === 'approvals' && (
            <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 5px 0' }}>PENDING APPROVALS</h2>
                  <p style={{ color: colors.muted, margin: 0, fontSize: '14px' }}>Review camp registrations or enter one on behalf of a property.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsAddingRegistration(!isAddingRegistration); setRegistrationError('') }}
                  style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, border: 'none', padding: '10px 14px', borderRadius: '5px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '7px' }}
                >
                  <Plus size={16} /> MANUALLY ENTER REGISTRATION
                </button>
              </div>

              {approvalError && (
                <div role="alert" style={{ marginBottom: '16px', padding: '12px 14px', border: `1px solid ${colors.error}`, borderRadius: '5px', color: colors.error, fontSize: '13px' }}>
                  {approvalError}
                </div>
              )}

              {isAddingRegistration && (
                <form onSubmit={handleSubmitRegistration} style={{ marginBottom: '24px', padding: '20px', backgroundColor: colors.background, border: `1px solid ${colors.border}`, borderRadius: '6px' }}>
                  <h3 style={{ margin: '0 0 16px', color: colors.textDark, fontFamily: fonts.header, fontSize: '20px' }}>MANUAL CAMP REGISTRATION</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <input required type="text" placeholder="Property Name *" value={registrationForm.name} onChange={(event) => setRegistrationForm({ ...registrationForm, name: event.target.value })} style={{ boxSizing: 'border-box', minWidth: 0, padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body }} />
                    <select value={registrationForm.type} onChange={(event) => setRegistrationForm({ ...registrationForm, type: event.target.value })} style={{ boxSizing: 'border-box', minWidth: 0, padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body }}>
                      <option value="Campground">Campground</option>
                      <option value="Youth Camp">Youth Camp</option>
                      <option value="Standard Property">Standard Property</option>
                    </select>
                    <input type="text" placeholder="Contact Name" value={registrationForm.contact_name} onChange={(event) => setRegistrationForm({ ...registrationForm, contact_name: event.target.value })} style={{ boxSizing: 'border-box', minWidth: 0, padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="tel" placeholder="Contact Number" value={registrationForm.contact_number} onChange={(event) => setRegistrationForm({ ...registrationForm, contact_number: event.target.value })} style={{ boxSizing: 'border-box', minWidth: 0, padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="email" placeholder="Contact Email" value={registrationForm.contact_email} onChange={(event) => setRegistrationForm({ ...registrationForm, contact_email: event.target.value })} style={{ boxSizing: 'border-box', minWidth: 0, padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="url" placeholder="Website URL" value={registrationForm.website_url} onChange={(event) => setRegistrationForm({ ...registrationForm, website_url: event.target.value })} style={{ boxSizing: 'border-box', minWidth: 0, padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="text" placeholder="Property Address" value={registrationForm.property_address} onChange={(event) => setRegistrationForm({ ...registrationForm, property_address: event.target.value })} style={{ boxSizing: 'border-box', minWidth: 0, padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="text" placeholder="Mailing Address" value={registrationForm.mailing_address} onChange={(event) => setRegistrationForm({ ...registrationForm, mailing_address: event.target.value })} style={{ boxSizing: 'border-box', minWidth: 0, padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body }} />
                    {profile?.access_tier === 'global_superadmin' && (
                      <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px', color: colors.textDark, fontSize: '13px' }}>
                        <input type="checkbox" checked={registrationForm.gs_restricted} onChange={(event) => setRegistrationForm({ ...registrationForm, gs_restricted: event.target.checked })} />
                        Restrict this property to Global Superadmins
                      </label>
                    )}
                  </div>
                  {registrationError && <p role="alert" style={{ margin: '12px 0 0', color: colors.error, fontSize: '13px' }}>{registrationError}</p>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                    <button type="button" onClick={() => { setIsAddingRegistration(false); setRegistrationError('') }} disabled={isSavingRegistration} style={{ padding: '9px 14px', border: `1px solid ${colors.border}`, borderRadius: '4px', background: 'transparent', color: colors.textDark, cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px' }}>CANCEL</button>
                    <button type="submit" disabled={isSavingRegistration} style={{ padding: '9px 14px', border: 'none', borderRadius: '4px', backgroundColor: colors.primary, color: colors.textOnPrimary, cursor: isSavingRegistration ? 'wait' : 'pointer', fontFamily: fonts.utility, fontSize: '12px' }}>{isSavingRegistration ? 'SUBMITTING…' : 'SUBMIT FOR APPROVAL'}</button>
                  </div>
                </form>
              )}

              {pendingRegistrations.length === 0 ? (
                <div style={{ padding: '30px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '4px', textAlign: 'center', color: colors.muted, fontFamily: fonts.utility }}>No pending camp registrations at this time.</div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {pendingRegistrations.map((registration) => (
                    <article key={registration.id} style={{ padding: '18px', backgroundColor: colors.background, border: `1px solid ${colors.border}`, borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                        <div style={{ minWidth: 0, flex: '1 1 300px' }}>
                          <h3 style={{ margin: '0 0 5px', color: colors.textDark, fontSize: '17px' }}>{registration.name}</h3>
                          <div style={{ color: colors.primary, fontSize: '12px', marginBottom: '10px' }}>{registration.type}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px 16px', color: colors.muted, fontSize: '13px', overflowWrap: 'anywhere' }}>
                            {registration.contact_name && <div>Contact: {registration.contact_name}</div>}
                            {registration.contact_number && <div>Phone: {registration.contact_number}</div>}
                            {registration.contact_email && <div>Email: {registration.contact_email}</div>}
                            {registration.property_address && <div>Property address: {registration.property_address}</div>}
                            {registration.mailing_address && <div>Mailing address: {registration.mailing_address}</div>}
                            {registration.website_url && <div>Website: {registration.website_url}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => handleReviewRegistration(registration, 'approve')} style={{ padding: '9px 12px', border: 'none', borderRadius: '4px', backgroundColor: colors.primary, color: colors.textOnPrimary, cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px' }}>APPROVE</button>
                          <button type="button" onClick={() => handleReviewRegistration(registration, 'reject')} style={{ padding: '9px 12px', border: `1px solid ${colors.error}`, borderRadius: '4px', backgroundColor: 'transparent', color: colors.error, cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px' }}>REJECT</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* UNIFIED TOWN HALL MODULE */}
          {lobbyTab === 'townhall' && (
            <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 5px 0' }}>TOWN HALL</h2>
                  <p style={{ color: colors.muted, margin: 0, fontSize: '14px' }}>Central hub for team communication and system feedback.</p>
                </div>
              </div>
              
              {/* Town Hall Sub-navigation Tabs */}
              <div style={{ display: 'flex', borderBottom: `2px solid ${colors.border}`, marginBottom: '25px' }}>
                <button 
                  onClick={() => setTownHallView('discussions')} 
                  style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: townHallView === 'discussions' ? `3px solid ${colors.primary}` : '3px solid transparent', color: townHallView === 'discussions' ? colors.primary : colors.muted, cursor: 'pointer', fontFamily: fonts.header, fontSize: '16px', fontWeight: 'bold' }}
                >
                  Team Discussions
                </button>
                <button 
                  onClick={() => setTownHallView('notes')} 
                  style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: townHallView === 'notes' ? `3px solid ${colors.primary}` : '3px solid transparent', color: townHallView === 'notes' ? colors.primary : colors.muted, cursor: 'pointer', fontFamily: fonts.header, fontSize: '16px', fontWeight: 'bold' }}
                >
                  QA & Tester Notes
                </button>
              </div>

              {/* Sub-tab 1: Team Discussions */}
              {townHallView === 'discussions' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: colors.textDark, fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Select Project or Campground:</label>
                    <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body }}>
                      <option value="Camp Whispering Pines">Camp Whispering Pines</option>
                      <option value="Squirrel Hill Campground">Squirrel Hill Campground</option>
                      <option value="new_project">+ New Project</option>
                    </select>
                  </div>
                  {selectedProject === 'new_project' && (
                    <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: colors.highlight, borderLeft: `4px solid ${colors.primary}`, borderRadius: '0 4px 4px 0' }}>
                      <label style={{ display: 'block', color: colors.textDark, fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Enter New Project Name:</label>
                      <input type="text" value={newProjectName} onChange={handleProjectTextChange} placeholder="Project Name..." style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    </div>
                  )}
                  <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '4px', border: `1px solid ${colors.border}`, marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: colors.textDark }}>System Update: App Testing Phase 2</span>
                      <span style={{ fontSize: '12px', color: colors.muted }}>10:42 AM</span>
                    </div>
                    <p style={{ color: colors.textDark, fontSize: '15px', margin: '0 0 20px 0', lineHeight: 1.5 }}>Please make sure all QA Testers have logged their initial findings in the QA & Tester Notes tab before the end of the day.</p>
                    <div style={{ display: 'flex', gap: '20px', borderTop: `1px solid ${colors.border}`, paddingTop: '15px' }}>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}><ThumbsUp size={18} /> Like</button>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}><MessageCircle size={18} /> Reply</button>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}><BarChart2 size={18} /> Create Poll</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: QA & Tester Notes */}
              {townHallView === 'notes' && (
                <div>
                  <textarea placeholder="Enter your QA notes or system feedback here..." style={{ width: '100%', boxSizing: 'border-box', height: '120px', padding: '15px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body, resize: 'vertical', marginBottom: '15px' }} />
                  <button style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '16px', marginBottom: '30px' }}>SUBMIT NOTE</button>
                  <h3 style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, margin: '0 0 15px 0', borderBottom: `2px solid ${colors.border}`, paddingBottom: '8px' }}>YOUR PREVIOUS NOTES</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '4px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: colors.muted, marginBottom: '8px', fontFamily: fonts.utility }}>Logged: Aug 5, 2026</div>
                      <div style={{ color: colors.textDark, fontSize: '15px', lineHeight: 1.5 }}>The camp selection dropdown on mobile devices occasionally overlaps with the navigation bar.</div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: fonts.utility, fontWeight: 'bold' }}><Edit2 size={16} /> EDIT</button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {isAnnouncementModalOpen && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingAnnouncement) {
              setIsAnnouncementModalOpen(false)
              setIsEditingAnnouncement(false)
            }
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-modal-title"
            style={{ display: 'flex', flexDirection: 'column', width: 'min(100%, 960px)', maxHeight: '92vh', backgroundColor: colors.panel, color: colors.textDark, border: `1px solid ${colors.border}`, borderRadius: '8px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)', overflow: 'hidden' }}
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: `1px solid ${colors.border}` }}>
              <h2 id="announcement-modal-title" style={{ margin: 0, color: colors.textDark, fontFamily: fonts.header, fontSize: '24px' }}>
                {isEditingAnnouncement && canEditAnnouncements ? 'EDIT ANNOUNCEMENT' : 'ADMIN ANNOUNCEMENT'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsAnnouncementModalOpen(false)
                  setIsEditingAnnouncement(false)
                }}
                disabled={isSavingAnnouncement}
                aria-label="Close announcement"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: 'none', background: 'transparent', color: colors.textDark, cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </header>

            <div style={{ minHeight: 0, overflowY: 'auto', padding: '20px' }}>
              {isEditingAnnouncement && canEditAnnouncements ? (
                <div className="announcement-modal-editor">
                  <ReactQuill
                    theme="snow"
                    value={tempAnnouncement}
                    onChange={setTempAnnouncement}
                    modules={announcementEditorModules}
                  />
                </div>
              ) : (
                <div
                  className="trailhead-announcement-content announcement-modal-content"
                  dangerouslySetInnerHTML={{ __html: normalizeAnnouncementHtml(adminAnnouncement) }}
                />
              )}
              {announcementSaveError && (
                <p role="alert" style={{ margin: '12px 0 0', color: colors.error, fontSize: '14px' }}>
                  {announcementSaveError}
                </p>
              )}
            </div>

            <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: `1px solid ${colors.border}` }}>
              {isEditingAnnouncement && canEditAnnouncements ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAnnouncementModalOpen(false)
                      setIsEditingAnnouncement(false)
                    }}
                    disabled={isSavingAnnouncement}
                    style={{ padding: '8px 14px', background: colors.highlight, border: `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer', color: colors.textDark, fontFamily: fonts.utility, fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveAnnouncement}
                    disabled={isSavingAnnouncement}
                    style={{ padding: '8px 14px', backgroundColor: colors.primary, color: colors.textOnPrimary, border: 'none', borderRadius: '4px', cursor: isSavingAnnouncement ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'bold', opacity: isSavingAnnouncement ? 0.7 : 1 }}
                  >
                    <Save size={14} /> {isSavingAnnouncement ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAnnouncementModalOpen(false)}
                    style={{ padding: '8px 14px', background: colors.highlight, border: `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer', color: colors.textDark, fontFamily: fonts.utility, fontSize: '12px' }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempAnnouncement(adminAnnouncement)
                      setAnnouncementSaveError('')
                      setIsEditingAnnouncement(true)
                    }}
                    style={{ padding: '8px 14px', backgroundColor: colors.primary, color: colors.textOnPrimary, border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'bold' }}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                </>
              )}
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

function SideNavButton({ icon, label, active, onClick, colors, fonts }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxSizing: 'border-box', background: active ? colors.highlight : 'none', border: 'none', color: colors.textLight, cursor: 'pointer', padding: '15px 12px', borderRadius: '4px', transition: 'background 0.2s', fontFamily: fonts.header, fontSize: '16px', letterSpacing: '1px' }}>
      <span style={{ display: 'flex', flex: '0 0 20px' }}>{icon}</span><span style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )
}
