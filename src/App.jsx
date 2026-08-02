import Navigation from './components/Navigation';
import HomeTab from './components/HomeTab';
import SocialTab from './components/SocialTab';
import ChallengesTab from './components/ChallengesTab';
import TeamTab from './components/TeamTab';
import RequestsTab from './components/RequestsTab';
import ProfileTab from './components/ProfileTab';
import AdminTab from './components/AdminTab';
import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { Tent, LogOut, Plus, X, Trash2, Search, Upload, Send, Lock, History, Download, Map, Pin, Edit3, Save, MessageSquare } from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const ROLES = [
  'Parent/Guardian',
  'Youth Camper',
  'Jr Counselor',
  'Counselor',
  'Asst. Team Leader',
  'Team Leader',
  'Activities Staff',
  'Service Staff',
  'Asst. Camp Director',
  'Camp Director',
  'Board Members',
  'Administrators'
]

export default function App() {
  const [session, setSession] = useState(null)
  const [activeCamp, setActiveCamp] = useState(null)
  const [activeTab, setActiveTab] = useState(localStorage.getItem('trailhead_active_tab') || 'home')

useEffect(() => {
  localStorage.setItem('trailhead_active_tab', activeTab)
}, [activeTab])
  const [camps, setCamps] = useState([])
  
  // Lobby State 
  const [selectedLobbyCamp, setSelectedLobbyCamp] = useState('')
  const [globalStaff, setGlobalStaff] = useState([])
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [deployCampForm, setDeployCampForm] = useState({ name: '', stateAbbr: 'MN', campPrefix: 'TRL', campType: 'Youth Camp' })
  
  // Tester Notes State
  const [testerNotes, setTesterNotes] = useState([])
  const [newNoteText, setNewNoteText] = useState('')
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')

  const [loginInput, setLoginInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [loginError, setLoginError] = useState('')
  
  // Admin & Roster State
  const [adminView, setAdminView] = useState('directory')
  const [showModal, setShowModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [allCampers, setAllCampers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  
  // Settings & Branding State
  const [cabins, setCabins] = useState([])
  const [teams, setTeams] = useState([])
  const [newCabinName, setNewCabinName] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  
  const [campBranding, setCampBranding] = useState({
    name: 'Trailhead',
    stateAbbr: 'MN',
    campPrefix: 'TRL',
    primaryColor: '#182821',
    secondaryColor: '#bd5b27',
    logoUrl: '',
    layoutTemplate: 'standard',
    aboutText: '',
    googleCalendarId: ''
  })

  // Home Tab Editing State
  const [isEditingAbout, setIsEditingAbout] = useState(false)
  const [tempAbout, setTempAbout] = useState('')
  
  // Announcements State
  const [announcements, setAnnouncements] = useState([])
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null)
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', isPinned: false })

  const fileInputRef = useRef(null)

  const defaultForm = {
    trailheadId: '', password: '', prefix: '', firstName: '', middleName: '', lastName: '', suffix: '', 
    preferredName: '', pronouns: '', dob: '', photoUrl: '', camperEmail: '', camperPhone: '',
    medicalNotes: '', emergencyContactName: '', emergencyContactPhone: '', 
    emergencyContact2Name: '', emergencyContact2Phone: '', emergencyContact3Name: '', emergencyContact3Phone: '',
    currentCabin: 'Unassigned', campRole: 'Youth Camper', team: 'Unassigned', jobTitle: '',
    isBoardMember: false, isAdmin: false, isCampAdmin: false, isCreator: false, internalNotes: ''
  }

  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    const savedSession = localStorage.getItem('trailhead_session')
    const savedCamp = localStorage.getItem('trailhead_active_camp')
    
    if (savedSession) setSession(JSON.parse(savedSession))
    if (savedCamp) loadCampData(JSON.parse(savedCamp))
  }, [])

  function generateCamperId() {
    const chars = 'BCDFGHJKMOPQRTVWXY2346789'
    let id = ''
    for (let i = 0; i < 10; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return id
  }

  function handleGeneratePassphrase() {
    const words = ['Pine', 'River', 'Bear', 'Cabin', 'Moose', 'Canoe', 'Trail', 'Ridge', 'Stone', 'Hawk', 'Wolf', 'Camp', 'Fire', 'Lake', 'Peak', 'Cedar', 'Birch', 'Trout']
    const w1 = words[Math.floor(Math.random() * words.length)]
    const w2 = words[Math.floor(Math.random() * words.length)]
    const w3 = words[Math.floor(Math.random() * words.length)]
    const num = Math.floor(Math.random() * 90) + 10
    setFormData(prev => ({ ...prev, password: `${w1}-${w2}-${w3}-${num}` }))
  }

  async function backfillMissingIds(camperArray) {
    const validIdRegex = /^[BCDFGHJKMOPQRTVWXY2346789]{10}$/
    
    const needsUpdate = camperArray.filter(c => {
      if (c.trailhead_id === 'GlobalAdministrator' || c.trailhead_id === 'BACKDOOR') return false; 
      return !c.trailhead_id || !validIdRegex.test(c.trailhead_id);
    })
    
    if (needsUpdate.length === 0) return camperArray
    
    const updatedArray = [...camperArray]
    for (let i = 0; i < updatedArray.length; i++) {
      if (updatedArray[i].trailhead_id !== 'GlobalAdministrator' && updatedArray[i].trailhead_id !== 'BACKDOOR' && (!updatedArray[i].trailhead_id || !validIdRegex.test(updatedArray[i].trailhead_id))) {
        const newId = generateCamperId()
        updatedArray[i].trailhead_id = newId
        await supabase.from('campers').update({ trailhead_id: newId }).eq('id', updatedArray[i].id)
      }
    }
    return updatedArray
  }

  useEffect(() => {
    async function getCamps() {
      const { data, error } = await supabase.from('camps').select('*').order('name', { ascending: true })
      if (!error && data) setCamps(data)
    }
    getCamps()
  }, [])

  useEffect(() => {
    async function fetchGlobalData() {
      if (session && session.userType === 'creator' && !activeCamp) {
        const { data: staffData } = await supabase.from('campers').select('*').is('camp_id', null).order('last_name', { ascending: true })
        if (staffData) {
          const fixedData = await backfillMissingIds(staffData)
          setGlobalStaff(fixedData)
        }
        fetchTesterNotes()
      }
    }
    fetchGlobalData()
  }, [session, activeCamp])

  async function fetchTesterNotes() {
    const { data } = await supabase.from('tester_notes').select('*').order('created_at', { ascending: false })
    if (data) setTesterNotes(data)
  }

  async function handleAddNote(e) {
    e.preventDefault()
    if (!newNoteText.trim()) return

    const payload = {
      author_id: session.profileId || null,
      author_name: session.name || 'Tester',
      note_text: newNoteText.trim()
    }

    const { data, error } = await supabase.from('tester_notes').insert([payload]).select()
    if (!error && data) {
      setTesterNotes([data[0], ...testerNotes])
      setNewNoteText('')
    } else {
      alert("Failed to save note. Make sure you ran the SQL table setup script.")
    }
  }

  async function handleUpdateNote(id) {
    if (!editingNoteText.trim()) return
    const { error } = await supabase.from('tester_notes').update({
      note_text: editingNoteText.trim(),
      updated_at: new Date().toISOString()
    }).eq('id', id)

    if (!error) {
      setTesterNotes(testerNotes.map(n => n.id === id ? { ...n, note_text: editingNoteText.trim() } : n))
      setEditingNoteId(null)
      setEditingNoteText('')
    } else {
      alert("Failed to update note.")
    }
  }

  async function handleDeleteNote(id) {
    if (!window.confirm("Are you sure you want to delete this note?")) return
    const { error } = await supabase.from('tester_notes').delete().eq('id', id)
    if (!error) {
      setTesterNotes(testerNotes.filter(n => n.id !== id))
    }
  }

  async function loadCampData(camp) {
    localStorage.setItem('trailhead_active_camp', JSON.stringify(camp))
    setActiveCamp(camp)
    setCampBranding({
      name: camp.name || 'Trailhead',
      stateAbbr: camp.state || 'MN',
      campPrefix: camp.camp_prefix || 'TRL',
      primaryColor: camp.primary_color || '#182821',
      secondaryColor: camp.secondary_color || '#bd5b27',
      logoUrl: camp.logo_url || '',
      layoutTemplate: camp.layout_template || 'standard',
      aboutText: camp.about_text || '',
      googleCalendarId: camp.google_calendar_id || ''
    })
    
    const { data: camperData } = await supabase.from('campers').select('*').eq('camp_id', camp.id).order('last_name', { ascending: true })
    if (camperData) {
      const fixedData = await backfillMissingIds(camperData)
      setAllCampers(fixedData)
    }

    const { data: cabinData } = await supabase.from('camp_cabins').select('*').eq('camp_id', camp.id).order('name', { ascending: true })
    if (cabinData) setCabins(cabinData)

    const { data: teamData } = await supabase.from('camp_teams').select('*').eq('camp_id', camp.id).order('name', { ascending: true })
    if (teamData) setTeams(teamData)

    fetchAnnouncements(camp.id)
  }

  async function fetchAnnouncements(campId) {
    const { data } = await supabase
      .from('camp_announcements')
      .select('*')
      .eq('camp_id', campId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setAnnouncements(data)
  }

  async function handleDeployCamp(e) {
    e.preventDefault()
    if (!deployCampForm.name.trim()) return

    const payload = {
      name: deployCampForm.name.trim(),
      state: deployCampForm.stateAbbr.trim().toUpperCase(),
      camp_prefix: deployCampForm.campPrefix.trim().toUpperCase(),
      camp_type: deployCampForm.campType,
      primary_color: '#182821',
      secondary_color: '#bd5b27',
      layout_template: 'standard'
    }

    const { data, error } = await supabase.from('camps').insert([payload]).select()
    if (error) {
      console.error("Error deploying camp:", error)
      alert("Failed to deploy new camp. Check console for details.")
      return
    }

    if (data && data.length > 0) {
      setCamps([...camps, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
      setShowDeployModal(false)
      setDeployCampForm({ name: '', stateAbbr: 'MN', campPrefix: 'TRL', campType: 'Youth Camp' })
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')

    const input = loginInput.trim().toUpperCase()
    const pass = passwordInput

    if (input === 'MASTER' && pass === 'rooster') {
      const masterSession = { userType: 'creator', role: 'Creator', name: 'Rooster', team: 'Global', trailheadId: 'BACKDOOR', campId: null, profileId: null }
      setSession(masterSession)
      localStorage.setItem('trailhead_session', JSON.stringify(masterSession))
      setLoginInput('')
      setPasswordInput('')
      return
    }

    if (!input || !pass) {
      setLoginError('Please enter both your Camp ID and Password.')
      return
    }

    const { data, error } = await supabase.from('campers').select('*').ilike('trailhead_id', input).eq('password', pass).single()

    if (error || !data) {
      setLoginError('Invalid credentials. Please verify your ID and password.')
      return
    }

    let uType = 'standard'
    if (data.is_creator) uType = 'creator'
    else if (data.is_camp_admin) uType = 'camp_admin'
    else if (data.camp_role === 'Youth Camper') uType = 'camper'

    const sessionData = { userType: uType, role: data.camp_role, team: data.team, name: data.preferred_name || data.first_name, profileId: data.id, trailheadId: data.trailhead_id, campId: data.camp_id, photoUrl: data.photo_url }
    
    setSession(sessionData)
    localStorage.setItem('trailhead_session', JSON.stringify(sessionData))

    if (uType === 'creator' && !data.camp_id) {
      setLoginInput('')
      setPasswordInput('')
      return
    }

    const assignedCamp = camps.find(c => c.id === data.camp_id)
    if (assignedCamp) {
      await loadCampData(assignedCamp)
    } else {
      setLoginError('Camp configuration missing for this profile.')
    }

    setLoginInput('')
    setPasswordInput('')
  }

  function handleLogout() {
    setSession(null)
    setActiveCamp(null)
    setActiveTab('home')
    setSelectedLobbyCamp('')
    localStorage.removeItem('trailhead_session')
    localStorage.removeItem('trailhead_active_camp')
    localStorage.removeItem('trailhead_active_tab')
  }

  async function logAction(actionType, targetProfile, detailsStr) {
    if (!activeCamp) return
    const { error } = await supabase.from('audit_logs').insert([{ camp_id: activeCamp.id, action: actionType, target_profile: targetProfile, details: detailsStr }])
    if (error) console.error("Failed to write audit log:", error)
  }

  async function fetchLogs() {
    if (!activeCamp) return
    const { data, error } = await supabase.from('audit_logs').select('*').eq('camp_id', activeCamp.id).order('created_at', { ascending: false })
    if (!error) {
      setAuditLogs(data)
      setShowLogsModal(true)
    }
  }

  function exportLogsToCSV() {
    if (auditLogs.length === 0) return
    const headers = ['Timestamp', 'Action', 'Target Profile', 'Details']
    const rows = auditLogs.map(log => [new Date(log.created_at).toLocaleString(), log.action, `"${log.target_profile}"`, `"${log.details || ''}"`])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'trailhead_audit_logs.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // SETTINGS HANDLERS
  async function handleAddCabin(e) {
    e.preventDefault()
    if (!newCabinName.trim() || !activeCamp) return
    const payload = { camp_id: activeCamp.id, name: newCabinName.trim() }
    const { data, error } = await supabase.from('camp_cabins').insert([payload]).select()
    if (!error && data) {
      setCabins([...cabins, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCabinName('')
      await logAction('SETTINGS', 'Camp Settings', `Added new cabin: ${payload.name}`)
    }
  }

  async function handleDeleteCabin(id, name) {
    if (!window.confirm(`Are you sure you want to delete the cabin "${name}"?`)) return
    const { error } = await supabase.from('camp_cabins').delete().eq('id', id)
    if (!error) {
      setCabins(cabins.filter(c => c.id !== id))
      await logAction('SETTINGS', 'Camp Settings', `Deleted cabin: ${name}`)
    }
  }

  async function handleAddTeam(e) {
    e.preventDefault()
    if (!newTeamName.trim() || !activeCamp) return
    const payload = { camp_id: activeCamp.id, name: newTeamName.trim() }
    const { data, error } = await supabase.from('camp_teams').insert([payload]).select()
    if (!error && data) {
      setTeams([...teams, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
      setNewTeamName('')
      await logAction('SETTINGS', 'Camp Settings', `Added new team: ${payload.name}`)
    }
  }

  async function handleDeleteTeam(id, name) {
    if (!window.confirm(`Are you sure you want to delete the team "${name}"?`)) return
    const { error } = await supabase.from('camp_teams').delete().eq('id', id)
    if (!error) {
      setTeams(teams.filter(t => t.id !== id))
      await logAction('SETTINGS', 'Camp Settings', `Deleted team: ${name}`)
    }
  }

  async function handleSaveBranding(e) {
    e.preventDefault()
    if (!activeCamp) return

    const payload = {
      name: campBranding.name,
      state: campBranding.stateAbbr,
      camp_prefix: campBranding.campPrefix,
      primary_color: campBranding.primaryColor,
      secondary_color: campBranding.secondaryColor,
      logo_url: campBranding.logoUrl,
      layout_template: campBranding.layoutTemplate,
      google_calendar_id: campBranding.googleCalendarId
    }

    const { error } = await supabase.from('camps').update(payload).eq('id', activeCamp.id)
    if (error) {
      alert("Failed to update branding.")
    } else {
      setActiveCamp({ ...activeCamp, ...payload })
      setCamps(camps.map(c => c.id === activeCamp.id ? { ...c, ...payload } : c))
      await logAction('SETTINGS', 'Camp Branding', 'Updated camp branding profile')
      alert("Settings and Identifiers updated successfully!")
    }
  }

  // HOME FEED INLINE EDITING
  async function handleSaveCampInfo() {
    if (!activeCamp) return
    const payload = { about_text: tempAbout }
    const { error } = await supabase.from('camps').update(payload).eq('id', activeCamp.id)
    if (!error) {
      setCampBranding(prev => ({ ...prev, aboutText: tempAbout }))
      setIsEditingAbout(false)
      await logAction('HOME_FEED', 'Camp Info', `Updated About Section`)
    }
  }

  // ANNOUNCEMENTS
  function openNewAnnouncementModal() {
    setEditingAnnouncementId(null)
    setAnnouncementForm({ title: '', content: '', isPinned: false })
    setShowAnnouncementModal(true)
  }

  function openEditAnnouncementModal(ann) {
    setEditingAnnouncementId(ann.id)
    setAnnouncementForm({ title: ann.title, content: ann.content, isPinned: ann.is_pinned })
    setShowAnnouncementModal(true)
  }

  async function handleSaveAnnouncement(e) {
    e.preventDefault()
    if (!activeCamp || !announcementForm.title || !announcementForm.content || announcementForm.content === '<p><br></p>') return

    if (editingAnnouncementId) {
      const { error } = await supabase.from('camp_announcements').update({
        title: announcementForm.title,
        content: announcementForm.content,
        is_pinned: announcementForm.isPinned
      }).eq('id', editingAnnouncementId)

      if (!error) {
        fetchAnnouncements(activeCamp.id)
        setShowAnnouncementModal(false)
        setEditingAnnouncementId(null)
        setAnnouncementForm({ title: '', content: '', isPinned: false })
        await logAction('HOME_FEED', 'Announcement', `Edited: ${announcementForm.title}`)
      } else {
        alert("Failed to update announcement.")
      }
    } else {
      const payload = {
        camp_id: activeCamp.id,
        author_name: session.name,
        title: announcementForm.title,
        content: announcementForm.content,
        is_pinned: announcementForm.isPinned
      }

      const { data, error } = await supabase.from('camp_announcements').insert([payload]).select()
      if (!error && data) {
        fetchAnnouncements(activeCamp.id)
        setShowAnnouncementModal(false)
        setAnnouncementForm({ title: '', content: '', isPinned: false })
        await logAction('HOME_FEED', 'Announcement', `Posted: ${payload.title}`)
      } else {
        alert("Failed to post announcement.")
      }
    }
  }

  async function handleDeleteAnnouncement(id, title) {
    if (!window.confirm("Delete this announcement?")) return
    const { error } = await supabase.from('camp_announcements').delete().eq('id', id)
    if (!error) {
      setAnnouncements(announcements.filter(a => a.id !== id))
      await logAction('HOME_FEED', 'Announcement', `Deleted: ${title}`)
    }
  }

  // PROFILE FORM HANDLERS
  function handleInputChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function openNewCamperModal() {
    setEditingId(null)
    setFormData(defaultForm)
    setShowModal(true)
  }

  function openEditModal(camper) {
    if (camper.is_creator && session.userType !== 'creator') { alert("This is a Global Trailhead profile. Access Denied."); return }
    
    if (camper.trailhead_id === 'GlobalAdministrator' && session.trailheadId !== 'GlobalAdministrator' && session.trailheadId !== 'BACKDOOR') {
      alert("The Global Administrator account can only be edited by authorized users."); 
      return 
    }

    if (camper.is_camp_admin && session.userType !== 'creator' && session.userType !== 'camp_admin') { alert("This is a CampAdmin profile. Access Denied."); return }
    
    setEditingId(camper.id)
    setFormData({
      trailheadId: camper.trailhead_id || '', password: camper.password || '', prefix: camper.prefix || '', firstName: camper.first_name || '', middleName: camper.middle_name || '', lastName: camper.last_name || '', suffix: camper.suffix || '', preferredName: camper.preferred_name || '', pronouns: camper.pronouns || '', dob: camper.date_of_birth || '', photoUrl: camper.photo_url || '', camperEmail: camper.camper_email || '', camperPhone: camper.camper_phone || '', medicalNotes: camper.medical_notes || '', emergencyContactName: camper.emergency_contact_name || '', emergencyContactPhone: camper.emergency_contact_phone || '', emergencyContact2Name: camper.emergency_contact_2_name || '', emergencyContact2Phone: camper.emergency_contact_2_phone || '', emergencyContact3Name: camper.emergency_contact_3_name || '', emergencyContact3Phone: camper.emergency_contact_3_phone || '', currentCabin: camper.current_cabin || 'Unassigned', campRole: camper.camp_role || 'Administrators', team: camper.team || 'Unassigned', jobTitle: camper.job_title || '', isBoardMember: camper.is_board_member || false, isAdmin: camper.is_admin || false, isCampAdmin: camper.is_camp_admin || false, isCreator: camper.is_creator || false, internalNotes: camper.internal_notes || ''
    })
    setShowModal(true)
  }

  async function handleSaveCamper(e) {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName) return

    if (formData.password && formData.password.length < 15) {
      alert("Password must be at least 15 characters long. A passphrase is recommended.")
      return
    }

    const isGlobalScope = !activeCamp
    const assignedId = formData.trailheadId || generateCamperId()

    const payload = {
      trailhead_id: assignedId, password: formData.password, prefix: formData.prefix, first_name: formData.firstName, middle_name: formData.middleName, last_name: formData.lastName, suffix: formData.suffix, preferred_name: formData.preferredName, pronouns: formData.pronouns, date_of_birth: formData.dob || null, photo_url: formData.photoUrl, camper_email: formData.camperEmail, camper_phone: formData.camperPhone, medical_notes: formData.medicalNotes, emergency_contact_name: formData.emergencyContactName, emergency_contact_phone: formData.emergencyContactPhone, emergency_contact_2_name: formData.emergencyContact2Name, emergency_contact_2_phone: formData.emergencyContact2Phone, emergency_contact_3_name: formData.emergencyContact3Name, emergency_contact_3_phone: formData.emergencyContact3Phone, current_cabin: formData.currentCabin, camp_role: formData.campRole, team: formData.team, job_title: formData.jobTitle, is_board_member: formData.isBoardMember, is_admin: formData.isAdmin, is_camp_admin: formData.isCampAdmin, is_creator: isGlobalScope ? true : formData.isCreator, internal_notes: formData.internalNotes, camp_id: isGlobalScope ? null : activeCamp.id
    }
    const profileName = `${formData.firstName} ${formData.lastName}`

    if (editingId) {
      const { error } = await supabase.from('campers').update(payload).eq('id', editingId)
      if (error) { 
        alert(`Update failed: ${error.message}`)
        console.error(error)
        return 
      }
      
      if (isGlobalScope) setGlobalStaff(prev => prev.map(c => c.id === editingId ? { ...c, ...payload } : c))
      else {
        setAllCampers(prev => prev.map(c => c.id === editingId ? { ...c, ...payload } : c))
        await logAction('UPDATE', profileName, `Profile updated by ${session.userType}`)
      }
    } else {
      const { data, error } = await supabase.from('campers').insert([payload]).select()
      
      if (error) { 
        alert(`Insert failed: ${error.message}`)
        console.error(error)
        return 
      }
      
      if (data && data.length > 0) {
        if (isGlobalScope) setGlobalStaff([...globalStaff, data[0]].sort((a, b) => a.last_name.localeCompare(b.last_name)))
        else {
          setAllCampers([...allCampers, data[0]].sort((a, b) => a.last_name.localeCompare(b.last_name)))
          await logAction('CREATE', profileName, `New profile created by ${session.userType}`)
        }
      }
    }
    setShowModal(false)
  }

  async function handleDeleteCamper() {
    if (!editingId) return
    
    if (formData.trailheadId === 'GlobalAdministrator' || formData.trailheadId === 'MASTER-KEY' || formData.trailheadId === 'BACKDOOR') {
      alert("This system account cannot be deleted.");
      return;
    }

    const isGlobalScope = !activeCamp
    if (formData.isCreator && session.userType !== 'creator') { alert("You cannot delete a Creator profile."); return }
    if (formData.isCampAdmin && session.userType !== 'creator' && session.userType !== 'camp_admin') { alert("You cannot delete a CampAdmin profile."); return }
    if (!window.confirm("Are you sure you want to permanently delete this profile? This cannot be undone.")) return
    
    const profileName = `${formData.firstName} ${formData.lastName}`
    await supabase.from('campers').delete().eq('id', editingId)
    
    if (isGlobalScope) setGlobalStaff(prev => prev.filter(c => c.id !== editingId))
    else {
      setAllCampers(prev => prev.filter(c => c.id !== editingId))
      await logAction('DELETE', profileName, `Profile permanently deleted by ${session.userType}`)
    }
    setShowModal(false)
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file || !activeCamp) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target.result
      const rows = text.split('\n').map(row => row.split(','))
      const newCampers = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (row.length >= 2 && row[0].trim() !== '') {
          newCampers.push({
            first_name: row[0].trim(), last_name: row[1].trim(), camp_role: row[2] ? row[2].trim() : 'Youth Camper', current_cabin: row[3] ? row[3].trim() : 'Unassigned', team: row[4] ? row[4].trim() : 'Unassigned', password: 'changemeplease!', trailhead_id: generateCamperId(), camp_id: activeCamp.id
          })
        }
      }
      if (newCampers.length > 0) {
        const { data } = await supabase.from('campers').insert(newCampers).select()
        if (data) {
          setAllCampers([...allCampers, ...data].sort((a, b) => a.last_name.localeCompare(b.last_name)))
          await logAction('BULK_IMPORT', 'CSV Upload', `Imported ${data.length} profiles`)
          alert(`Successfully imported ${data.length} profiles! Default passwords set to 'changemeplease!'`)
        }
      }
      e.target.value = null
    }
    reader.readAsText(file)
  }

  function getFullName(c) {
    const parts = []
    if (c.prefix) parts.push(c.prefix)
    parts.push(c.preferred_name || c.first_name)
    if (c.middle_name) parts.push(c.middle_name)
    parts.push(c.last_name)
    if (c.suffix) parts.push(c.suffix)
    return parts.join(' ')
  }

  function handleSendRegistrationCode() {
    alert("Registration code sent! (This will be hooked up to your email/SMS provider later.)")
  }

  // --- RENDER LOGIC ---

  const inputStyle = { padding: '10px 15px', border: '1px solid #d1ccc0', borderRadius: '6px', fontSize: '15px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white', color: '#182821' }
  const selectStyle = { padding: '10px 15px', border: '1px solid #d1ccc0', borderRadius: '6px', fontSize: '15px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white', color: '#182821', height: '44px', lineHeight: 'normal' }
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#182821', fontSize: '14px' }
  const squareBadgeStyle = { width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: 'white' }
  const rectBadgeStyle = { padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', color: 'white' }
  const sectionHeaderStyle = { color: campBranding.secondaryColor, borderBottom: '1px solid #d1ccc0', paddingBottom: '5px', marginBottom: '15px', fontSize: '16px', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  }

  // 1. GENERIC LOGIN SCREEN
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#182821', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#efebe0', margin: '-8px', padding: '20px' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500&display=swap');`}</style>
        
        <Tent size={72} color="#bd5b27" strokeWidth={1.5} style={{ marginBottom: '30px' }} />
        <h1 style={{ margin: '0 0 30px 0', fontSize: '42px', letterSpacing: '6px', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif", fontWeight: '500', color: '#ffffff' }}>
          Trailhead
        </h1>
        <p style={{ margin: '0 0 40px 0', fontSize: '16px', textAlign: 'center', maxWidth: '320px', lineHeight: '1.5', color: '#a3b3a9' }}>Enter your Camp ID to access your portal.</p>
        
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <input type="text" placeholder="Camp ID" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} style={{ padding: '16px', border: 'none', borderRadius: '8px', fontSize: '16px', width: '100%', boxSizing: 'border-box', textTransform: 'uppercase' }} />
          </div>
          <div>
            <input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={{ padding: '16px', border: 'none', borderRadius: '8px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }} />
          </div>
          {loginError && <div style={{ color: '#f87171', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>{loginError}</div>}
          <button type="submit" style={{ padding: '16px', backgroundColor: '#bd5b27', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%', marginBottom: '60px', marginTop: '10px' }}>
            Sign In
          </button>
        </form>
      </div>
    )
  }

  // 2. CREATOR / GLOBAL LOBBY
  if (session && session.userType === 'creator' && !activeCamp) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#efebe0', fontFamily: 'sans-serif', margin: '-8px', display: 'flex', flexDirection: 'column' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500&display=swap');`}</style>
        
        <div style={{ backgroundColor: '#182821', padding: '15px 20px', color: '#efebe0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tent size={28} color="#bd5b27" />
            <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif", fontWeight: '500', color: '#ffffff' }}>Global Control</h2>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#a3b3a9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}>
            <LogOut size={16} /> Exit
          </button>
        </div>

        <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #d1ccc0', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#182821', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>Select Camp Workspace</h3>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <select value={selectedLobbyCamp} onChange={(e) => setSelectedLobbyCamp(e.target.value)} style={{ ...selectStyle, flexGrow: 1 }}>
                <option value="">-- Choose a Camp --</option>
                {camps.map(c => <option key={c.id} value={c.id}>{c.state} - {c.name}</option>)}
              </select>
              <button 
                onClick={() => { const c = camps.find(c => c.id === selectedLobbyCamp); if (c) loadCampData(c); }}
                disabled={!selectedLobbyCamp}
                style={{ padding: '0 20px', height: '44px', backgroundColor: selectedLobbyCamp ? '#14532d' : '#e5e7eb', color: selectedLobbyCamp ? 'white' : '#a3b3a9', border: 'none', borderRadius: '6px', cursor: selectedLobbyCamp ? 'pointer' : 'not-allowed', fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                Launch Portal
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {camps.map(camp => (
              <div key={camp.id} onClick={() => loadCampData(camp)} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', cursor: 'pointer', borderTop: `6px solid ${camp.primary_color || '#182821'}`, transition: 'transform 0.1s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {camp.logo_url ? <img src={camp.logo_url} alt="Logo" style={{ height: '50px', objectFit: 'contain', marginBottom: '15px' }} /> : <Map size={40} color={camp.secondary_color || '#bd5b27'} style={{ marginBottom: '15px' }} />}
                <h3 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>{camp.name}</h3>
              </div>
            ))}
            
            <div onClick={() => setShowDeployModal(true)} style={{ backgroundColor: '#f9f8f6', padding: '25px', borderRadius: '8px', cursor: 'pointer', border: '2px dashed #a3b3a9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <Plus size={40} color="#a3b3a9" style={{ marginBottom: '15px' }} />
              <h3 style={{ margin: 0, color: '#a3b3a9', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Deploy New Camp</h3>
            </div>
          </div>

          {/* TESTER & EMPLOYEE NOTES SECTION */}
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #d1ccc0', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ borderBottom: '2px solid #efebe0', paddingBottom: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={22} color="#bd5b27" />
              <h3 style={{ margin: 0, color: '#182821', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>Employee & Tester Feedback Notes</h3>
            </div>

            <form onSubmit={handleAddNote} style={{ marginBottom: '25px' }}>
              <textarea 
                value={newNoteText} 
                onChange={(e) => setNewNoteText(e.target.value)} 
                placeholder="Leave feedback, bug reports, or feature requests about the app..." 
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', marginBottom: '10px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#bd5b27', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Post Feedback Note
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {testerNotes.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#a3b3a9', backgroundColor: '#f9f8f6', borderRadius: '6px', border: '1px dashed #d1ccc0' }}>
                  No tester notes posted yet.
                </div>
              ) : (
                testerNotes.map(note => {
                  const isAuthor = session.profileId === note.author_id || session.trailheadId === 'BACKDOOR' || session.trailheadId === 'GlobalAdministrator'
                  
                  return (
                    <div key={note.id} style={{ backgroundColor: '#fdf6e3', padding: '15px 20px', borderRadius: '8px', border: '1px solid #d1ccc0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ color: '#182821', fontSize: '15px' }}>{note.author_name}</strong>
                          <span style={{ fontSize: '12px', color: '#a3b3a9', marginLeft: '10px' }}>
                            {new Date(note.created_at).toLocaleDateString()} {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {isAuthor && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.note_text); }} style={{ background: 'none', border: 'none', color: '#14532d', cursor: 'pointer' }}>
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => handleDeleteNote(note.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      {editingNoteId === note.id ? (
                        <div>
                          <textarea 
                            value={editingNoteText} 
                            onChange={(e) => setEditingNoteText(e.target.value)} 
                            style={{ ...inputStyle, minHeight: '70px', marginBottom: '10px' }} 
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setEditingNoteId(null)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #d1ccc0', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleUpdateNote(note.id)} style={{ padding: '6px 12px', backgroundColor: '#14532d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Save size={14} /> Save</button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ margin: 0, color: '#182821', lineHeight: '1.5', whitespace: 'pre-wrap' }}>{note.note_text}</p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #d1ccc0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #efebe0', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#182821', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>Trailhead Global Staff</h3>
              <button onClick={openNewCamperModal} style={{ padding: '8px 15px', backgroundColor: '#182821', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px' }}>
                <Plus size={16} /> Add Employee
              </button>
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
              {globalStaff.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#a3b3a9' }}>No global staff accounts configured.</div>
              ) : (
                globalStaff.map(staff => (
                  <div key={staff.id} onClick={() => openEditModal(staff)} style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#182821', fontSize: '16px' }}>{getFullName(staff)}</strong>
                        <span style={{ ...rectBadgeStyle, backgroundColor: '#182821' }}>GLOBAL CREATOR</span>
                      </div>
                      <div style={{ color: '#a3b3a9', fontSize: '13px', marginTop: '4px' }}>
                        <strong>ID: {staff.trailhead_id || 'PENDING'}</strong> • {staff.job_title || 'No Title'}
                      </div>
                    </div>
                    <div style={{ color: '#bd5b27', fontSize: '14px', fontWeight: 'bold' }}>Edit</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* DEPLOY CAMP MODAL */}
        {showDeployModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(24, 40, 33, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid #bd5b27`, paddingBottom: '15px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#182821', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>Deploy New Camp</h2>
                <button onClick={() => setShowDeployModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3b3a9' }}><X size={24} /></button>
              </div>
              <form onSubmit={handleDeployCamp}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Camp Name *</label>
                  <input type="text" value={deployCampForm.name} onChange={(e) => setDeployCampForm({...deployCampForm, name: e.target.value})} style={inputStyle} required placeholder="e.g., Camp Whispering Pines" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={labelStyle}>State Abbreviation *</label>
                    <input type="text" value={deployCampForm.stateAbbr} onChange={(e) => setDeployCampForm({...deployCampForm, stateAbbr: e.target.value.toUpperCase()})} style={inputStyle} required maxLength="2" placeholder="MN" />
                  </div>
                  <div>
                    <label style={labelStyle}>Camp ID Prefix *</label>
                    <input type="text" value={deployCampForm.campPrefix} onChange={(e) => setDeployCampForm({...deployCampForm, campPrefix: e.target.value.toUpperCase()})} style={inputStyle} required maxLength="4" placeholder="WHP" />
                  </div>
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <label style={labelStyle}>Camp Type *</label>
                  <select value={deployCampForm.campType} onChange={(e) => setDeployCampForm({...deployCampForm, campType: e.target.value})} style={selectStyle}>
                    <option value="Youth Camp">Youth Camp (Kids, Counselors, Parents)</option>
                    <option value="Standard Campground">Standard Campground (RV, Tent, General Public)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #d1ccc0', paddingTop: '20px' }}>
                  <button type="button" onClick={() => setShowDeployModal(false)} style={{ padding: '10px 15px', backgroundColor: 'transparent', color: '#182821', border: '1px solid #d1ccc0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#14532d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Deploy Camp</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* GLOBAL STAFF MODAL */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(24, 40, 33, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid #182821`, paddingBottom: '15px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#182821', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>
                  {editingId ? 'Edit Global Employee' : 'New Global Employee'}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3b3a9' }}><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveCamper}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Trailhead ID (Auto-Generated)</label>
                  <input type="text" value={formData.trailheadId || "GLBLTRLXXXX"} disabled style={{ ...inputStyle, backgroundColor: '#f9f8f6' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Access Password *</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" name="password" value={formData.password} onChange={handleInputChange} required style={inputStyle} />
                    <button type="button" onClick={handleGeneratePassphrase} style={{ padding: '10px 15px', backgroundColor: '#182821', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Generate</button>
                  </div>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#a3b3a9' }}>Min 15 characters (passphrase recommended).</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={labelStyle}>First Name *</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name *</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Job Title</label>
                    <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input type="email" name="camperEmail" value={formData.camperEmail} onChange={handleInputChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input type="tel" name="camperPhone" value={formData.camperPhone} onChange={handleInputChange} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #d1ccc0', paddingTop: '20px', marginTop: '20px' }}>
                  {editingId ? (
                    <button type="button" onClick={handleDeleteCamper} style={{ padding: '10px 15px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #f87171', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                  ) : <div></div>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 15px', backgroundColor: 'transparent', color: '#182821', border: '1px solid #d1ccc0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                    <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#182821', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save Profile</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 3. THE BRANDED APP INTERFACE
  const adultStaffRoles = ['Counselor', 'Asst. Team Leader', 'Team Leader', 'Activities Staff', 'Service Staff', 'Asst. Camp Director', 'Camp Director', 'Board Members', 'Administrators']
  const showAdminOptions = adultStaffRoles.includes(formData.campRole)
  const isYouthCamper = formData.campRole === 'Youth Camper'
  
  const isCreatorLogin = session.userType === 'creator'
  const isCampAdminLogin = session.userType === 'camp_admin' || session.userType === 'creator'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#efebe0', fontFamily: 'sans-serif', margin: '-8px', display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500&display=swap');`}</style>
      
      {/* Themed Top Header */}
      <div style={{ backgroundColor: campBranding.primaryColor, padding: '15px 20px', color: '#efebe0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {campBranding.logoUrl ? (
            <img src={campBranding.logoUrl} alt="Logo" style={{ height: '28px', objectFit: 'contain' }} />
          ) : (
            <Tent size={28} color={campBranding.secondaryColor} />
          )}
          <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif", fontWeight: '500', color: '#ffffff' }}>
            {campBranding.name}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {isCreatorLogin && <span style={{ color: campBranding.secondaryColor, fontSize: '14px', fontWeight: 'bold', border: `1px solid ${campBranding.secondaryColor}`, padding: '4px 8px', borderRadius: '4px', display: window.innerWidth > 600 ? 'block' : 'none' }}>CREATOR SESSION</span>}
          
          {/* Return to Lobby Button for Global Creators */}
          {isCreatorLogin && !session.campId && (
            <button onClick={() => { setActiveCamp(null); setActiveTab('home'); localStorage.removeItem('trailhead_active_camp'); }} style={{ background: 'none', border: 'none', color: '#a3b3a9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}>
              <Tent size={16} /> Lobby
            </button>
          )}

          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#a3b3a9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}>
            <LogOut size={16} /> {isCreatorLogin && !session.campId ? 'Exit' : 'Logout'}
          </button>
        </div>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {activeTab === 'home' && (
          <HomeTab
            campBranding={campBranding}
            isCampAdminLogin={isCampAdminLogin}
            isEditingAbout={isEditingAbout}
            setIsEditingAbout={setIsEditingAbout}
            tempAbout={tempAbout}
            setTempAbout={setTempAbout}
            handleSaveCampInfo={handleSaveCampInfo}
            announcements={announcements}
            openNewAnnouncementModal={openNewAnnouncementModal}
            openEditAnnouncementModal={openEditAnnouncementModal}
            handleDeleteAnnouncement={handleDeleteAnnouncement}
            quillModules={quillModules}
          />
        )}
        
        {activeTab === 'social' && (
        <SocialTab campBranding={campBranding} inputStyle={inputStyle} session={session} activeCamp={activeCamp} />        )}
        
        {activeTab === 'challenges' && (
          <ChallengesTab isCampAdminLogin={isCampAdminLogin} campBranding={campBranding} />
        )}
        
        {activeTab === 'team' && (
          <TeamTab session={session} teams={teams} selectStyle={selectStyle} />
        )}
        
        {activeTab === 'requests' && (
          <RequestsTab />
        )}
        
        {activeTab === 'profile' && (
          <<ProfileTab session={session} setSession={setSession} campBranding={campBranding} /
        )}
        
        {activeTab === 'admin' && (
          <AdminTab
            adminView={adminView}
            setAdminView={setAdminView}
            campBranding={campBranding}
            setCampBranding={setCampBranding}
            handleSaveBranding={handleSaveBranding}
            newCabinName={newCabinName}
            setNewCabinName={setNewCabinName}
            handleAddCabin={handleAddCabin}
            cabins={cabins}
            handleDeleteCabin={handleDeleteCabin}
            newTeamName={newTeamName}
            setNewTeamName={setNewTeamName}
            handleAddTeam={handleAddTeam}
            teams={teams}
            handleDeleteTeam={handleDeleteTeam}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            ROLES={ROLES}
            fetchLogs={fetchLogs}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            openNewCamperModal={openNewCamperModal}
            allCampers={allCampers}
            openEditModal={openEditModal}
            getFullName={getFullName}
            isCreatorLogin={isCreatorLogin}
            isCampAdminLogin={isCampAdminLogin}
            inputStyle={inputStyle}
            selectStyle={selectStyle}
            labelStyle={labelStyle}
            sectionHeaderStyle={sectionHeaderStyle}
            squareBadgeStyle={squareBadgeStyle}
            rectBadgeStyle={rectBadgeStyle}
          />
        )}
      </div>

      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        campBranding={campBranding} 
        session={session} 
      />

      {/* NEW/EDIT ANNOUNCEMENT MODAL */}
      {showAnnouncementModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(24, 40, 33, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${campBranding.secondaryColor}`, paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#182821', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>
                {editingAnnouncementId ? 'Edit Announcement' : 'Post Announcement'}
              </h2>
              <button onClick={() => setShowAnnouncementModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3b3a9' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveAnnouncement}>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Headline</label>
                <input type="text" value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} style={inputStyle} required placeholder="What's happening?" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Details</label>
                <div style={{ backgroundColor: 'white', marginBottom: '15px' }}>
                  <ReactQuill theme="snow" value={announcementForm.content} onChange={content => setAnnouncementForm({...announcementForm, content})} modules={quillModules} style={{ height: '150px', marginBottom: '40px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="pinCheck" checked={announcementForm.isPinned} onChange={e => setAnnouncementForm({...announcementForm, isPinned: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: campBranding.secondaryColor }} />
                <label htmlFor="pinCheck" style={{ fontWeight: 'bold', color: '#182821', cursor: 'pointer' }}>Pin to top of feed</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #d1ccc0', paddingTop: '20px' }}>
                <button type="button" onClick={() => setShowAnnouncementModal(false)} style={{ padding: '10px 15px', backgroundColor: 'transparent', color: '#182821', border: '1px solid #d1ccc0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 15px', backgroundColor: campBranding.secondaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {editingAnnouncementId ? 'Save Changes' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT LOGS MODAL */}
      {showLogsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(24, 40, 33, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '900px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${campBranding.secondaryColor}`, paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#182821', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>Audit Logs</h2>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={exportLogsToCSV} style={{ padding: '8px 12px', backgroundColor: '#14532d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px' }}>
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={() => setShowLogsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3b3a9' }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flexGrow: 1, border: '1px solid #e5e7eb', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f9f8f6', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid #d1ccc0', color: '#182821' }}>Date & Time</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid #d1ccc0', color: '#182821' }}>Action</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid #d1ccc0', color: '#182821' }}>Target Profile</th>
                    <th style={{ padding: '12px 15px', borderBottom: '1px solid #d1ccc0', color: '#182821' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 15px', color: '#a3b3a9', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold', color: log.action.includes('DELETE') ? '#dc2626' : '#14532d' }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '12px 15px', color: '#182821' }}>{log.target_profile}</td>
                      <td style={{ padding: '12px 15px', color: '#a3b3a9' }}>{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#a3b3a9' }}>No audit logs found for this camp.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* PROFILE EDITOR MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(24, 40, 33, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '750px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${campBranding.secondaryColor}`, paddingBottom: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h2 style={{ margin: 0, color: '#182821', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>
                  {editingId ? 'Edit Profile' : 'Register New Profile'}
                </h2>
                {formData.trailheadId ? (
                  <span style={{ backgroundColor: '#efebe0', color: '#182821', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #d1ccc0' }}>
                    ID: {formData.trailheadId}
                  </span>
                ) : (
                  <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #f87171' }}>
                    ID PENDING SAVE
                  </span>
                )}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3b3a9' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveCamper}>
              
              <div style={{ backgroundColor: '#fdf6e3', padding: '20px', borderRadius: '8px', border: '1px solid #d1ccc0', marginBottom: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                
                <div style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>
                  <label style={labelStyle}>Set / Reset Password</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" name="password" value={formData.password} onChange={handleInputChange} style={inputStyle} placeholder="Enter a secure password" />
                    <button type="button" onClick={handleGeneratePassphrase} style={{ padding: '10px 15px', backgroundColor: '#182821', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Generate</button>
                  </div>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#a3b3a9' }}>Min 15 characters (passphrase recommended).</p>
                </div>

                <div>
                  <label style={labelStyle}>Role</label>
                  <select name="campRole" value={formData.campRole} onChange={handleInputChange} style={selectStyle}>
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {isYouthCamper ? (
                  <>
                    <div>
                      <label style={labelStyle}>Cabin Assignment</label>
                      <select name="currentCabin" value={formData.currentCabin} onChange={handleInputChange} style={selectStyle}>
                        <option value="Unassigned">Unassigned</option>
                        {cabins.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Team</label>
                      <select name="team" value={formData.team} onChange={handleInputChange} style={selectStyle}>
                        <option value="Unassigned">Unassigned</option>
                        {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Job Title / Position</label>
                    <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} style={inputStyle} placeholder="e.g., Lead Activities Coordinator" />
                  </div>
                )}

                {showAdminOptions && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '30px', marginTop: '10px', padding: '10px 15px', backgroundColor: 'rgba(20, 83, 45, 0.05)', borderRadius: '6px', border: '1px solid rgba(20, 83, 45, 0.1)', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#14532d', fontWeight: 'bold' }}>
                      <input type="checkbox" name="isBoardMember" checked={formData.isBoardMember} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: '#14532d' }} />
                      Board Member
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#c2410c', fontWeight: 'bold' }}>
                      <input type="checkbox" name="isAdmin" checked={formData.isAdmin} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: '#c2410c' }} />
                      System Admin
                    </label>
                    
                    {(isCreatorLogin || isCampAdminLogin) && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#4f46e5', fontWeight: 'bold', borderLeft: '2px solid #d1ccc0', paddingLeft: '20px' }}>
                        <input type="checkbox" name="isCampAdmin" checked={formData.isCampAdmin} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: '#4f46e5' }} />
                        CampAdmin (Super)
                      </label>
                    )}
                    {isCreatorLogin && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#182821', fontWeight: 'bold', borderLeft: '2px solid #d1ccc0', paddingLeft: '20px' }}>
                        <input type="checkbox" name="isCreator" checked={formData.isCreator} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: '#182821' }} />
                        Creator (Global)
                      </label>
                    )}
                  </div>
                )}
              </div>

              <h4 style={sectionHeaderStyle}>Basic Information</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Prefix</label>
                  <input type="text" name="prefix" value={formData.prefix} onChange={handleInputChange} style={inputStyle} placeholder="Mr." />
                </div>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Middle Name</label>
                  <input type="text" name="middleName" value={formData.middleName} onChange={handleInputChange} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Suffix</label>
                  <input type="text" name="suffix" value={formData.suffix} onChange={handleInputChange} style={inputStyle} placeholder="Jr." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Preferred Name</label>
                  <input type="text" name="preferredName" value={formData.preferredName} onChange={handleInputChange} style={inputStyle} placeholder="e.g., Tony" />
                </div>
                <div>
                  <label style={labelStyle}>Pronouns</label>
                  <input type="text" name="pronouns" value={formData.pronouns} onChange={handleInputChange} style={inputStyle} placeholder="e.g., he/him" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>{isYouthCamper ? 'Parent/Guardian Email' : 'Personal Email'}</label>
                  <input type="email" name="camperEmail" value={formData.camperEmail} onChange={handleInputChange} style={inputStyle} placeholder="email@example.com" />
                </div>
                <div>
                  <label style={labelStyle}>{isYouthCamper ? 'Parent/Guardian Phone' : 'Personal Phone'}</label>
                  <input type="tel" name="camperPhone" value={formData.camperPhone} onChange={handleInputChange} style={inputStyle} placeholder="555-123-4567" />
                </div>
              </div>
              
              <div style={{ marginBottom: '25px' }}>
                <button 
                  type="button" 
                  onClick={handleSendRegistrationCode}
                  disabled={!formData.camperEmail && !formData.camperPhone}
                  style={{ 
                    padding: '10px 15px', 
                    backgroundColor: (formData.camperEmail || formData.camperPhone) ? '#182821' : '#e5e7eb', 
                    color: (formData.camperEmail || formData.camperPhone) ? 'white' : '#a3b3a9', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: (formData.camperEmail || formData.camperPhone) ? 'pointer' : 'not-allowed', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontWeight: 'bold',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={18} /> {isYouthCamper ? 'Send Portal Link to Parent' : 'Send Registration Code'}
                </button>
                {(!formData.camperEmail && !formData.camperPhone) && (
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#a3b3a9', textAlign: 'center' }}>Enter an email or phone number to send a registration link.</p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Photo URL</label>
                  <input type="text" name="photoUrl" value={formData.photoUrl} onChange={handleInputChange} style={inputStyle} placeholder="https://..." />
                </div>
              </div>

              <h4 style={sectionHeaderStyle}>Emergency Contacts</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Primary Contact Name</label>
                  <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Primary Phone</label>
                  <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Secondary Contact Name</label>
                  <input type="text" name="emergencyContact2Name" value={formData.emergencyContact2Name} onChange={handleInputChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Secondary Phone</label>
                  <input type="tel" name="emergencyContact2Name" value={formData.emergencyContact2Phone} onChange={handleInputChange} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div>
                  <label style={labelStyle}>Tertiary Contact Name</label>
                  <input type="text" name="emergencyContact3Name" value={formData.emergencyContact3Name} onChange={handleInputChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tertiary Phone</label>
                  <input type="tel" name="emergencyContact3Name" value={formData.emergencyContact3Phone} onChange={handleInputChange} style={inputStyle} />
                </div>
              </div>

              <h4 style={sectionHeaderStyle}>Medical</h4>
              <div style={{ marginBottom: '35px' }}>
                <label style={labelStyle}>Medical Notes & Allergies</label>
                <textarea name="medicalNotes" value={formData.medicalNotes} onChange={handleInputChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="List any allergies, medications, or specific needs..."></textarea>
              </div>

              <h4 style={sectionHeaderStyle}>Internal Notes <span style={{ fontSize: '12px', color: '#a3b3a9', textTransform: 'none', fontWeight: 'normal' }}>(Hidden from Parents)</span></h4>
              <div style={{ marginBottom: '35px' }}>
                <textarea name="internalNotes" value={formData.internalNotes} onChange={handleInputChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', backgroundColor: '#fdf6e3', borderColor: '#d1ccc0' }} placeholder="Behavioral notes, preferred names, internal staff communications..."></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #d1ccc0', paddingTop: '20px' }}>
                {editingId ? (
                  <button type="button" onClick={handleDeleteCamper} style={{ padding: '12px 20px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #f87171', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trash2 size={18} /> Delete Profile
                  </button>
                ) : <div></div>}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#182821', border: '1px solid #d1ccc0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '12px 20px', backgroundColor: campBranding.secondaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {editingId ? 'Save Changes' : 'Create Profile'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}