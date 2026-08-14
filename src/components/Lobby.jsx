import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Tent, Users, CheckSquare, MessageSquare, LogOut, Search, MapPin, ClipboardList, ThumbsUp, MessageCircle, BarChart2, Edit2, Plus, LayoutDashboard, Menu, X, Settings, Trash2, AlertTriangle, Moon, Sun, Lock, ShieldAlert, Database, Megaphone, Save, ChevronUp, ChevronDown } from 'lucide-react'
import StaffManager from './StaffManager'
import CustomerDatabase from './CustomerDatabase'
import SettingsTab from './SettingsTab'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

export default function Lobby({ profile, setCampData, setActiveTab, colors, fonts, isDarkMode, setIsDarkMode, themeKey, setThemeKey }) {
  const [lobbyTab, setLobbyTab] = useState('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const [camps, setCamps] = useState([])
  const [myAssignedCamps, setMyAssignedCamps] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  const [selectedCampId, setSelectedCampId] = useState(null)
  const [isAddingCamp, setIsAddingCamp] = useState(false)
  const [isEditingCamp, setIsEditingCamp] = useState(false)
  const [isDeletingCamp, setIsDeletingCamp] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  // Admin Announcements State loaded from Database
  const [adminAnnouncement, setAdminAnnouncement] = useState('<h3>Welcome to the Project Trailhead Admin Console</h3><p>Thanks for agreeing to be our test pilots for this phase. Your feedback is what will iron out the bugs before we open this up to a larger public test group.</p>')
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false)
  const [tempAnnouncement, setTempAnnouncement] = useState('')
  const [isAnnouncementCollapsed, setIsAnnouncementCollapsed] = useState(false)
  const [hasBeenUpdated, setHasBeenUpdated] = useState(false)

  useEffect(() => {
    fetchAnnouncement()
  }, [])

  async function fetchAnnouncement() {
    const { data, error } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'admin_announcement')
      .single()

    if (data && data.value) {
      setAdminAnnouncement(data.value)
    }
  }

  async function saveAnnouncement() {
    setAdminAnnouncement(tempAnnouncement)
    setIsEditingAnnouncement(false)
    setHasBeenUpdated(true)

    await supabase
      .from('global_settings')
      .upsert({ key: 'admin_announcement', value: tempAnnouncement })
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

  useEffect(() => { fetchProperties() }, [])

  const fetchProperties = async () => {
    setIsLoading(true)
    if (profile?.id && profile?.access_tier !== 'global_superadmin') {
       const { data: personnelData } = await supabase.from('trailhead_personnel').select('assigned_camps').eq('id', profile.id).single()
       if (personnelData && personnelData.assigned_camps) setMyAssignedCamps(personnelData.assigned_camps)
    }
    const { data, error } = await supabase.from('camps').select('*').order('name')
    if (data) setCamps(data)
    if (error) console.error("Error fetching properties:", error.message)
    setIsLoading(false)
  }

  const selectedCamp = camps.find(c => c.id === selectedCampId)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleAddCamp = async () => {
    if (!campForm.name.trim()) return
    const { error } = await supabase.from('camps').insert([campForm])
    if (error) console.error("Error adding camp:", error.message)
    else { resetPropertyForms(); fetchProperties(); }
  }

  const handleUpdateCamp = async () => {
    if (!campForm.name.trim() || !selectedCampId) return
    const { error } = await supabase.from('camps').update(campForm).eq('id', selectedCampId)
    if (error) console.error("Error updating camp:", error.message)
    else { resetPropertyForms(); fetchProperties(); }
  }

  const handleDeleteCamp = async () => {
    if (!deletePassword) return
    const { error } = await supabase.from('camps').delete().eq('id', selectedCampId)
    if (error) console.error("Error deleting camp:", error.message)
    else {
      setIsDeletingCamp(false)
      setDeletePassword('')
      setSelectedCampId(null)
      fetchProperties()
    }
  }

  const resetPropertyForms = () => {
    setIsAddingCamp(false)
    setIsEditingCamp(false)
    setCampForm(defaultCampForm)
  }

  const openEditForm = () => {
    setIsAddingCamp(false)
    setIsEditingCamp(true)
    setCampForm({
      name: selectedCamp?.name || '', type: selectedCamp?.type || 'Standard Property',
      contact_name: selectedCamp?.contact_name || '', contact_number: selectedCamp?.contact_number || '',
      contact_email: selectedCamp?.contact_email || '', mailing_address: selectedCamp?.mailing_address || '',
      property_address: selectedCamp?.property_address || '', website_url: selectedCamp?.website_url || '',
      gs_restricted: selectedCamp?.gs_restricted || false
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body, overflow: 'hidden' }}>
      <style>{`
        ::-webkit-scrollbar { width: 8px; } 
        ::-webkit-scrollbar-track { background: ${colors.background}; } 
        ::-webkit-scrollbar-thumb { background: ${colors.highlight}; border-radius: 4px; }
        
        /* Locked Scrollable Height for Announcements */
        .announcement-scroll-box {
          max-height: 120px;
          overflow-y: auto;
        }
        .quill .ql-container.ql-snow {
          height: 120px !important;
          overflow-y: auto !important;
        }
        .quill .ql-editor {
          height: 120px !important;
          overflow-y: auto !important;
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
          <SideNavButton icon={<Users size={20} />} label="Staff" active={lobbyTab === 'staff'} onClick={() => { setLobbyTab('staff'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
          <SideNavButton icon={<Database size={20} />} label="Customer DB" active={lobbyTab === 'database'} onClick={() => { setLobbyTab('database'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
          <SideNavButton icon={<CheckSquare size={20} />} label="Approvals" active={lobbyTab === 'approvals'} onClick={() => { setLobbyTab('approvals'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
          <SideNavButton icon={<MessageSquare size={20} />} label="Discuss" active={lobbyTab === 'discussions'} onClick={() => { setLobbyTab('discussions'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
          <SideNavButton icon={<ClipboardList size={20} />} label="Notes" active={lobbyTab === 'feedback'} onClick={() => { setLobbyTab('feedback'); setIsMenuOpen(false); }} colors={colors} fonts={fonts} />
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
            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: `1px solid ${colors.error}`, backgroundColor: isDarkMode ? '#111' : '#fff', color: colors.textDark, fontFamily: fonts.body, marginBottom: '25px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setIsDeletingCamp(false); setDeletePassword(''); }} style={{ flex: 1, backgroundColor: 'transparent', color: colors.textDark, border: `1px solid ${colors.muted}`, padding: '12px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '16px' }}>CANCEL</button>
              <button onClick={handleDeleteCamp} disabled={!deletePassword} style={{ flex: 1, backgroundColor: colors.error, color: 'white', border: 'none', padding: '12px', borderRadius: '4px', cursor: deletePassword ? 'pointer' : 'not-allowed', opacity: deletePassword ? 1 : 0.5, fontFamily: fonts.header, fontSize: '16px' }}>DELETE PROPERTY</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, padding: '30px 20px', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* DASHBOARD TAB */}
          {lobbyTab === 'dashboard' && (
            <div>
              <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textDark, margin: '0 0 20px 0', letterSpacing: '1px' }}>SYSTEM DASHBOARD</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* System Alerts */}
                <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: '2px solid #ef4444', gridColumn: '1 / -1', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#ef4444', marginBottom: '10px' }}>
                    <ShieldAlert size={24} />
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '20px', color: '#ef4444' }}>SYSTEM ALERTS</h3>
                  </div>
                  <p style={{ color: colors.textDark, margin: 0, fontSize: '14px' }}>All deployment nodes operating nominally. Database sync complete.</p>
                </div>

                {/* Admin Announcements Section */}
                <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `1px solid ${colors.border}`, gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px', marginBottom: isAnnouncementCollapsed ? '0' : '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.primary }}>
                      <Megaphone size={20} />
                      <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        ADMIN ANNOUNCEMENTS
                        {hasBeenUpdated && (
                          <span style={{ backgroundColor: colors.primary, color: '#FFF', fontSize: '10px', fontFamily: fonts.utility, padding: '2px 6px', borderRadius: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            UPDATED
                          </span>
                        )}
                      </h3>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {!isEditingAnnouncement && !isAnnouncementCollapsed && (
                        <button 
                          onClick={() => { setTempAnnouncement(adminAnnouncement); setIsEditingAnnouncement(true); }} 
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
                    isEditingAnnouncement ? (
                      <div>
                        <div style={{ backgroundColor: isDarkMode ? '#111' : '#FFF', color: colors.textDark, marginBottom: '20px' }}>
                          <ReactQuill theme="snow" value={tempAnnouncement} onChange={setTempAnnouncement} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button onClick={() => setIsEditingAnnouncement(false)} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${colors.muted}`, borderRadius: '4px', cursor: 'pointer', color: colors.textDark, fontFamily: fonts.utility, fontSize: '12px' }}>Cancel</button>
                          <button onClick={saveAnnouncement} style={{ padding: '6px 14px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'bold' }}><Save size={14} /> Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="ql-snow" style={{ textAlign: 'left' }}>
                        <div className="ql-editor announcement-scroll-box" style={{ padding: 0, color: colors.textDark, lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: adminAnnouncement }} />
                      </div>
                    )
                  )}
                </div>

                {/* Properties Widget */}
                <div onClick={() => setLobbyTab('camps')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Properties</h3>
                    <Tent color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>{camps.length} Registered Nodes</div>
                  <div style={{ width: '100%', backgroundColor: colors.border, height: '6px', borderRadius: '3px', marginTop: '5px' }}>
                    <div style={{ width: '85%', backgroundColor: colors.primary, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>MANAGE DIRECTORY &rarr;</div>
                </div>

                {/* Staff Widget */}
                <div onClick={() => setLobbyTab('staff')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Staff Accounts</h3>
                    <Users color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>Active Personnel: 14</div>
                  <div style={{ width: '100%', backgroundColor: colors.border, height: '6px', borderRadius: '3px', marginTop: '5px' }}>
                    <div style={{ width: '100%', backgroundColor: colors.primary, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>MANAGE STAFF &rarr;</div>
                </div>

                {/* Customer DB Widget */}
                <div onClick={() => setLobbyTab('database')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Customer DB</h3>
                    <Database color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>Master Repository</div>
                  <div style={{ width: '100%', backgroundColor: colors.border, height: '6px', borderRadius: '3px', marginTop: '5px' }}>
                    <div style={{ width: '100%', backgroundColor: colors.primary, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>VIEW REPOSITORY &rarr;</div>
                </div>

                {/* Approvals Widget */}
                <div onClick={() => setLobbyTab('approvals')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: '0', fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Approvals</h3>
                    <CheckSquare color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>0 Pending Registrations</div>
                  <div style={{ width: '100%', backgroundColor: colors.border, height: '6px', borderRadius: '3px', marginTop: '5px' }}>
                    <div style={{ width: '0%', backgroundColor: colors.primary, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>REVIEW QUEUE &rarr;</div>
                </div>

                {/* Discussions Widget */}
                <div onClick={() => setLobbyTab('discussions')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Discussions</h3>
                    <MessageSquare color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>1 New Mention</div>
                  <div style={{ marginTop: '21px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>JOIN CONVERSATION &rarr;</div>
                </div>

                {/* Feedback Widget */}
                <div onClick={() => setLobbyTab('feedback')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Tester Notes</h3>
                    <ClipboardList color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>3 Open Tickets</div>
                  <div style={{ marginTop: '21px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>SUBMIT NOTES &rarr;</div>
                </div>
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
                    <button onClick={() => { resetPropertyForms(); setIsAddingCamp(true); setSelectedCampId(null); }} style={{ backgroundColor: colors.highlight, color: '#FFF', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={16} /> ADD NEW</button>
                    <div style={{ width: '1px', backgroundColor: colors.muted, margin: '0 5px' }}></div>
                  </>
                )}
                <button disabled={!selectedCampId} onClick={openEditForm} style={{ backgroundColor: selectedCampId ? colors.primary : 'transparent', color: selectedCampId ? '#FFF' : colors.muted, border: selectedCampId ? 'none' : `1px solid ${colors.muted}`, padding: '10px 15px', borderRadius: '4px', cursor: selectedCampId ? 'pointer' : 'not-allowed', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Edit2 size={16} /> EDIT</button>
                <button 
                  disabled={!selectedCampId} 
                  onClick={() => { 
                    const newTabUrl = `${window.location.origin}/?campId=${selectedCampId}`;
                    window.open(newTabUrl, '_blank', 'noopener,noreferrer');
                  }} 
                  style={{ backgroundColor: selectedCampId ? colors.primary : 'transparent', color: selectedCampId ? '#FFF' : colors.muted, border: selectedCampId ? 'none' : `1px solid ${colors.muted}`, padding: '10px 15px', borderRadius: '4px', cursor: selectedCampId ? 'pointer' : 'not-allowed', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Settings size={16} /> MANAGE
                </button>
                {profile?.access_tier === 'global_superadmin' && (
                  <button disabled={!selectedCampId} onClick={() => setIsDeletingCamp(true)} style={{ backgroundColor: selectedCampId ? colors.error : 'transparent', color: selectedCampId ? 'white' : colors.muted, border: selectedCampId ? 'none' : `1px solid ${colors.muted}`, padding: '10px 15px', borderRadius: '4px', cursor: selectedCampId ? 'pointer' : 'not-allowed', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}><Trash2 size={16} /> DELETE</button>
                )}
              </div>

              {(isAddingCamp || isEditingCamp) && (
                <div style={{ backgroundColor: isDarkMode ? '#111' : 'white', padding: '25px', borderRadius: '4px', border: `2px solid ${colors.primary}`, marginBottom: '20px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', gridColumn: '1 / -1', padding: '10px', backgroundColor: isDarkMode ? '#1A1A1A' : '#F8F8F8', borderRadius: '4px', border: `1px solid ${colors.muted}` }}>
                        <input type="checkbox" id="gsRestricted" checked={campForm.gs_restricted} onChange={(e) => setCampForm({...campForm, gs_restricted: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        <label htmlFor="gsRestricted" style={{ color: colors.textDark, fontFamily: fonts.body, fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>GS Restricted (Lock out Global Admins)</label>
                      </div>
                    )}
                  </div>
                  
                  <button onClick={isEditingCamp ? handleUpdateCamp : handleAddCamp} style={{ backgroundColor: colors.primary, color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '14px' }}>
                    {isEditingCamp ? 'SAVE CHANGES' : 'SAVE PROPERTY'}
                  </button>
                </div>
              )}

              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Search size={18} color={colors.muted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input type="text" placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 10px 10px 40px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: isDarkMode ? '#111' : 'white', color: colors.textDark, fontSize: '15px', outline: 'none', fontFamily: fonts.body }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                {isLoading ? <div style={{ textAlign: 'center', padding: '20px', color: colors.primary, fontFamily: fonts.utility }}>Loading...</div> : 
                 visibleCamps.length === 0 ? <div style={{ textAlign: 'center', padding: '20px', color: colors.muted }}>No properties found.</div> : 
                 visibleCamps.map(camp => (
                  <div 
                    key={camp.id} 
                    onClick={() => { 
                      const newTabUrl = `${window.location.origin}/?campId=${camp.id}`;
                      window.open(newTabUrl, '_blank', 'noopener,noreferrer');
                    }} 
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: selectedCampId === camp.id ? (isDarkMode ? '#2A4731' : '#E5DCC0') : (isDarkMode ? '#16281D' : 'white'), border: selectedCampId === camp.id ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer', transition: 'all 0.1s' }}
                  >
                    <div>
                      <div style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {camp.name}
                        {camp.gs_restricted && <Lock size={14} color={colors.error} title="Restricted Access" />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: colors.muted, fontSize: '12px', fontFamily: fonts.utility, textTransform: 'uppercase' }}>
                        <MapPin size={12} /> {camp.type ? camp.type.replace('_', ' ') : 'Standard Property'}
                        {camp.contact_name && <span style={{ marginLeft: '10px' }}>| Contact: {camp.contact_name}</span>}
                      </div>
                    </div>
                    {selectedCampId === camp.id && <div style={{ color: colors.primary, fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'bold' }}>SELECTED</div>}
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
              <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 5px 0' }}>PENDING APPROVALS</h2>
              <p style={{ color: colors.muted, margin: '0 0 20px 0', fontSize: '14px' }}>Review and approve recently registered camps.</p>
              <div style={{ padding: '30px', backgroundColor: isDarkMode ? '#111' : 'white', border: `1px solid ${colors.muted}`, borderRadius: '4px', textAlign: 'center', color: colors.muted, fontFamily: fonts.utility }}>No pending camp registrations at this time.</div>
            </div>
          )}

          {lobbyTab === 'discussions' && (
            <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 5px 0' }}>TEAM DISCUSSIONS</h2>
              <p style={{ color: colors.muted, margin: '0 0 20px 0', fontSize: '14px' }}>Communicate with your team and track project updates.</p>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: colors.textDark, fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Select Project or Campground:</label>
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: isDarkMode ? '#111' : 'white', color: colors.textDark, fontFamily: fonts.body }}>
                  <option value="Camp Whispering Pines">Camp Whispering Pines</option>
                  <option value="Squirrel Hill Campground">Squirrel Hill Campground</option>
                  <option value="new_project">+ New Project</option>
                </select>
              </div>
              {selectedProject === 'new_project' && (
                <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'rgba(193, 83, 27, 0.1)', borderLeft: `4px solid ${colors.primary}`, borderRadius: '0 4px 4px 0' }}>
                  <label style={{ display: 'block', color: colors.textDark, fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Enter New Project Name:</label>
                  <input type="text" value={newProjectName} onChange={handleProjectTextChange} placeholder="Project Name..." style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                </div>
              )}
              <div style={{ backgroundColor: isDarkMode ? '#111' : 'white', padding: '20px', borderRadius: '4px', border: `1px solid ${colors.muted}`, marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: colors.textDark }}>System Update: App Testing Phase 2</span>
                  <span style={{ fontSize: '12px', color: colors.muted }}>10:42 AM</span>
                </div>
                <p style={{ color: colors.textDark, fontSize: '15px', margin: '0 0 20px 0', lineHeight: 1.5 }}>Please make sure all QA Testers have logged their initial findings in the feedback tab before the end of the day.</p>
                <div style={{ display: 'flex', gap: '20px', borderTop: `1px solid ${colors.border}`, paddingTop: '15px' }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}><ThumbsUp size={18} /> Like</button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}><MessageCircle size={18} /> Reply</button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}><BarChart2 size={18} /> Create Poll</button>
                </div>
              </div>
            </div>
          )}

          {lobbyTab === 'feedback' && (
            <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 5px 0' }}>TESTER NOTES & FEEDBACK</h2>
              <p style={{ color: colors.muted, margin: '0 0 20px 0', fontSize: '14px' }}>Log system bugs, drop testing notes, and edit your previous feedback.</p>
              <textarea placeholder="Enter your QA notes or system feedback here..." style={{ width: '100%', boxSizing: 'border-box', height: '120px', padding: '15px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: isDarkMode ? '#111' : 'white', color: colors.textDark, fontFamily: fonts.body, resize: 'vertical', marginBottom: '15px' }} />
              <button style={{ backgroundColor: colors.primary, color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '16px', marginBottom: '30px' }}>SUBMIT NOTE</button>
              <h3 style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, margin: '0 0 15px 0', borderBottom: `2px solid ${colors.border}`, paddingBottom: '8px' }}>YOUR PREVIOUS NOTES</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', backgroundColor: isDarkMode ? '#111' : 'white', border: `1px solid ${colors.muted}`, borderRadius: '4px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: colors.muted, marginBottom: '8px', fontFamily: fonts.utility }}>Logged: Aug 5, 2026</div>
                  <div style={{ color: colors.textDark, fontSize: '15px', lineHeight: 1.5 }}>The camp selection dropdown on mobile devices occasionally overlaps with the navigation bar.</div>
                </div>
                <button style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: fonts.utility, fontWeight: 'bold' }}><Edit2 size={16} /> EDIT</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function SideNavButton({ icon, label, active, onClick, colors, fonts }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%', background: active ? colors.highlight : 'none', border: 'none', color: active ? '#FFF' : colors.textLight, cursor: 'pointer', padding: '15px 20px', borderRadius: '4px', transition: 'background 0.2s', fontFamily: fonts.header, fontSize: '18px', letterSpacing: '1px' }}>
      {icon}<span>{label}</span>
    </button>
  )
}