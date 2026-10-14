import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Tent, Users, CheckSquare, MessageSquare, LogOut, Search, MapPin, ClipboardList, ThumbsUp, MessageCircle, BarChart2, Edit2, Plus, LayoutDashboard, Menu, X, Settings, Trash2, AlertTriangle, Moon, Sun, Lock, ShieldAlert, Database, Megaphone, Save, ChevronUp, ChevronDown } from 'lucide-react'
import StaffManager from './StaffManager'
import CustomerDatabase from './CustomerDatabase'
import SettingsTab from './SettingsTab'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

function normalizeAnnouncementHtml(html) {
  return (html || '').replace(/(?:&nbsp;|&#160;|&#xA0;|\u00a0)/gi, ' ')
}

export default function Lobby({ profile, setCampData, setActiveTab, colors, fonts, isDarkMode, setIsDarkMode, themeKey, setThemeKey }) {
  const [lobbyTab, setLobbyTab] = useState('dashboard')
  const [townHallView, setTownHallView] = useState('discussions')
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

  const [adminAnnouncement, setAdminAnnouncement] = useState('<h3>Welcome to the Project Trailhead Admin Console</h3><p>Thanks for agreeing to be our test pilots for this phase. Your feedback is what will iron out the bugs before we open this up to a larger public test group.</p>')
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false)
  const [tempAnnouncement, setTempAnnouncement] = useState('')
  const [isAnnouncementCollapsed, setIsAnnouncementCollapsed] = useState(false)
  const [isAnnouncementExpanded, setIsAnnouncementExpanded] = useState(false)
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
      setAdminAnnouncement(normalizeAnnouncementHtml(data.value))
    }
  }

  async function saveAnnouncement() {
    const normalizedAnnouncement = normalizeAnnouncementHtml(tempAnnouncement)
    setAdminAnnouncement(normalizedAnnouncement)
    setIsEditingAnnouncement(false)
    setHasBeenUpdated(true)

    await supabase
      .from('global_settings')
      .upsert({ key: 'admin_announcement', value: normalizedAnnouncement })
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
          <SideNavButton icon={<LayoutDashboard size