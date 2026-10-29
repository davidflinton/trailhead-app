import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Tent, Users, CheckSquare, MessageSquare, LogOut, Search, MapPin, Edit2, Plus, LayoutDashboard, Menu, X, Settings, Trash2, AlertTriangle, Moon, Sun, Lock, ShieldAlert, Database, Megaphone, Save, ChevronUp, ChevronDown } from 'lucide-react'
import StaffManager from './StaffManager'
import CustomerDatabase from './CustomerDatabase'
import PageHeader from './PageHeader'
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

const propertyTypes = [
  'Campground/RV Park',
  'Youth Camp',
  'Standard Property',
  'Cabins, Lodges & Resorts',
  'Vacation Rentals / Short-Term Rentals',
  'Bed-and-Breakfasts, Inns & Guesthouses',
  'Hotels/Motels',
  'Hostels',
  'Marinas & Storage',
  'Retreat, Conference & Event Centers'
]

const registrationPropertyTypes = [
  ...propertyTypes,
  'Other'
]

const registrationFeatureOptions = [
  'Reservations and guest management',
  'Staff coordination',
  'Maintenance tracking',
  'Announcements and communication',
  'Reporting and analytics',
  'Multi-property management'
]

const defaultRegistrationForm = {
  name: '',
  organization_name: '',
  property_types: ['Campground/RV Park'],
  other_property_type: '',
  contact_name: '',
  contact_number: '',
  contact_email: '',
  billing_contact_name: '',
  billing_contact_email: '',
  mailing_address: '',
  property_address: '',
  website_url: '',
  location_count: 1,
  current_unit_count: 0,
  peak_unit_count: 0,
  current_people_count: 0,
  peak_people_count: 0,
  requested_features: [],
  other_feature: '',
  plan_preference: 'help_me_choose',
  billing_preference: 'monthly_or_annual',
  desired_start_date: '',
  notes: '',
  gs_restricted: false
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
  const [townHallPosts, setTownHallPosts] = useState([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [isSavingPost, setIsSavingPost] = useState(false)
  const [postError, setPostError] = useState('')
  const [postForm, setPostForm] = useState({ title: '', content: '' })
  const [editingPostId, setEditingPostId] = useState(null)
  const [editPostForm, setEditPostForm] = useState({ title: '', content: '' })
  
  const [camps, setCamps] = useState([])
  const [myAssignedCamps, setMyAssignedCamps] = useState([])
  const [pendingRegistrations, setPendingRegistrations] = useState([])
  const [isAddingRegistration, setIsAddingRegistration] = useState(false)
  const [isSavingRegistration, setIsSavingRegistration] = useState(false)
  const [registrationError, setRegistrationError] = useState('')
  const [approvalError, setApprovalError] = useState('')
  const [registrationForm, setRegistrationForm] = useState(defaultRegistrationForm)
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
    name: '', type: 'Campground/RV Park', contact_name: '', contact_number: '',
    contact_email: '', mailing_address: '', property_address: '', website_url: '',
    amenities: '', capacity: '', nightly_rate: '',
    gs_restricted: false
  }
  const [campForm, setCampForm] = useState(defaultCampForm)

  const [selectedProject, setSelectedProject] = useState('Test-Campground')
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

  useEffect(() => {
    if (lobbyTab !== 'townhall') return

    let isCurrent = true
    async function loadTownHallPosts() {
      setIsLoadingPosts(true)
      setPostError('')
      const { data, error } = await supabase
        .from('town_hall_posts')
        .select('*')
        .eq('post_type', townHallView === 'discussions' ? 'discussion' : 'note')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching Town Hall posts:', error.message)
        if (isCurrent) {
          setPostError('Unable to load posts. Please try again.')
          setIsLoadingPosts(false)
        }
        return
      }

      if (isCurrent) {
        setTownHallPosts(data || [])
        setIsLoadingPosts(false)
      }
    }

    void loadTownHallPosts()
    return () => { isCurrent = false }
  }, [lobbyTab, townHallView])

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

  const toggleRegistrationOption = (field, option, isChecked) => {
    setRegistrationForm((current) => ({
      ...current,
      [field]: isChecked
        ? [...current[field], option]
        : current[field].filter((value) => value !== option)
    }))
  }

  const handleSubmitRegistration = async (event) => {
    event.preventDefault()
    if (isSavingRegistration) return

    setRegistrationError('')
    if (registrationForm.property_types.length === 0) {
      setRegistrationError('Select at least one property type.')
      return
    }
    if (Number(registrationForm.peak_unit_count) < Number(registrationForm.current_unit_count)) {
      setRegistrationError('Peak units/assets must be at least the current unit/assets count.')
      return
    }
    if (Number(registrationForm.peak_people_count) < Number(registrationForm.current_people_count)) {
      setRegistrationError('Peak occupants must be at least the current occupants count.')
      return
    }
    setIsSavingRegistration(true)

    const { error } = await supabase
      .from('camp_registrations')
      .insert([{
        ...registrationForm,
        type: registrationForm.property_types[0],
        name: registrationForm.name.trim(),
        organization_name: registrationForm.organization_name.trim(),
        other_property_type: registrationForm.other_property_type.trim(),
        contact_name: registrationForm.contact_name.trim(),
        contact_email: registrationForm.contact_email.trim(),
        billing_contact_name: registrationForm.billing_contact_name.trim(),
        billing_contact_email: registrationForm.billing_contact_email.trim(),
        current_unit_count: Number(registrationForm.current_unit_count),
        peak_unit_count: Number(registrationForm.peak_unit_count),
        current_people_count: Number(registrationForm.current_people_count),
        peak_people_count: Number(registrationForm.peak_people_count),
        location_count: Number(registrationForm.location_count),
        desired_start_date: registrationForm.desired_start_date || null,
        submitted_by: profile.id
      }])

    if (error) {
      console.error('Error submitting camp registration:', error.message)
      setRegistrationError('Unable to submit the registration. Please try again.')
    } else {
      setRegistrationForm(defaultRegistrationForm)
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

  const handleCreateTownHallPost = async (event) => {
    event.preventDefault()
    if (isSavingPost) return

    const postType = townHallView === 'discussions' ? 'discussion' : 'note'
    const projectName = postType === 'discussion'
      ? selectedProject === 'new_project' ? newProjectName.trim() : selectedProject
      : null
    if (postType === 'discussion' && !projectName) {
      setPostError('Enter a project or campground name before posting.')
      return
    }
    if (!postForm.content.trim()) {
      setPostError('Post content cannot be empty.')
      return
    }

    setIsSavingPost(true)
    setPostError('')
    const { data, error } = await supabase
      .from('town_hall_posts')
      .insert([{
        post_type: postType,
        project_name: projectName,
        title: postForm.title.trim(),
        content: postForm.content.trim(),
        author_id: profile.id,
        author_name: headerDisplayName || currentUserEmail || 'Team member'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating Town Hall post:', error.message)
      setPostError('Unable to publish your post. Please try again.')
    } else {
      setTownHallPosts((posts) => [data, ...posts])
      setPostForm({ title: '', content: '' })
      if (postType === 'discussion' && selectedProject === 'new_project') {
        setSelectedProject(projectName)
        setNewProjectName('')
      }
    }
    setIsSavingPost(false)
  }

  const handleSaveTownHallEdit = async (post) => {
    if (isSavingPost) return
    if (!editPostForm.content.trim()) {
      setPostError('Post content cannot be empty.')
      return
    }

    setIsSavingPost(true)
    setPostError('')
    const { data, error } = await supabase
      .from('town_hall_posts')
      .update({
        title: editPostForm.title.trim(),
        content: editPostForm.content.trim()
      })
      .eq('id', post.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating Town Hall post:', error.message)
      setPostError('Unable to save your changes. Please try again.')
    } else {
      setTownHallPosts((posts) => posts.map((item) => item.id === post.id ? data : item))
      setEditingPostId(null)
    }
    setIsSavingPost(false)
  }

  const handleDeleteTownHallPost = async (post) => {
    const { error } = await supabase
      .from('town_hall_posts')
      .delete()
      .eq('id', post.id)

    if (error) {
      console.error('Error deleting Town Hall post:', error.message)
      setPostError('Unable to delete this post. Please try again.')
      return
    }

    setTownHallPosts((posts) => posts.filter((item) => item.id !== post.id))
    if (editingPostId === post.id) setEditingPostId(null)
    setPostError('')
  }

  const handleAddCamp = async () => {
    if (!campForm.name.trim()) return
    const { error } = await supabase.from('camps').insert([{
      ...campForm,
      amenities: campForm.amenities.split(',').map((amenity) => amenity.trim()).filter(Boolean),
      capacity: campForm.capacity === '' ? null : Number(campForm.capacity),
      nightly_rate: campForm.nightly_rate === '' ? null : Number(campForm.nightly_rate)
    }])
    if (error) console.error("Error adding camp:", error.message)
    else { resetPropertyForms(); refreshProperties(); }
  }

  const handleUpdateCamp = async () => {
    if (!campForm.name.trim() || !selectedCampId) return
    const { error } = await supabase.from('camps').update({
      ...campForm,
      amenities: campForm.amenities.split(',').map((amenity) => amenity.trim()).filter(Boolean),
      capacity: campForm.capacity === '' ? null : Number(campForm.capacity),
      nightly_rate: campForm.nightly_rate === '' ? null : Number(campForm.nightly_rate)
    }).eq('id', selectedCampId)
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
      amenities: (camp.amenities || []).join(', '),
      capacity: camp.capacity ?? '',
      nightly_rate: camp.nightly_rate ?? '',
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

  const registrationInputStyle = {
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
    padding: '10px',
    borderRadius: '4px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.panel,
    color: colors.textDark,
    fontFamily: fonts.body
  }
  const registrationLabelStyle = {
    display: 'block',
    marginBottom: '6px',
    color: colors.textDark,
    fontSize: '13px',
    fontWeight: '600'
  }

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
              <PageHeader title="Dashboard" subtitle="Overview of properties, personnel, announcements, and system status." icon={LayoutDashboard} colors={colors} fonts={fonts} eyebrow={<>ADMIN CONSOLE <span style={{ padding: '0 7px' }}>/</span> DASHBOARD</>} />
              
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
            <>
              <PageHeader title="Property Directory" subtitle="Select a property below to access management tools." icon={Tent} colors={colors} fonts={fonts} eyebrow={<>DIRECTORY <span style={{ padding: '0 7px' }}>/</span> PROPERTIES</>} />
              <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              
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
                      {propertyTypes.map((propertyType) => <option key={propertyType} value={propertyType}>{propertyType}</option>)}
                    </select>
                    <input type="text" placeholder="Contact Name" value={campForm.contact_name} onChange={(e) => setCampForm({...campForm, contact_name: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="text" placeholder="Contact Number" value={campForm.contact_number} onChange={(e) => setCampForm({...campForm, contact_number: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="email" placeholder="Contact Email" value={campForm.contact_email} onChange={(e) => setCampForm({...campForm, contact_email: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="url" placeholder="Existing Website URL" value={campForm.website_url} onChange={(e) => setCampForm({...campForm, website_url: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="text" placeholder="Property Address" value={campForm.property_address} onChange={(e) => setCampForm({...campForm, property_address: e.target.value})} style={{ gridColumn: '1 / -1', boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="text" placeholder="Mailing Address" value={campForm.mailing_address} onChange={(e) => setCampForm({...campForm, mailing_address: e.target.value})} style={{ gridColumn: '1 / -1', boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <textarea placeholder="Amenities (comma-separated)" value={campForm.amenities} onChange={(e) => setCampForm({...campForm, amenities: e.target.value})} style={{ boxSizing: 'border-box', minHeight: '70px', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="number" min="0" step="1" placeholder="Capacity (guests)" value={campForm.capacity} onChange={(e) => setCampForm({...campForm, capacity: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    <input type="number" min="0" step="0.01" placeholder="Nightly rate ($)" value={campForm.nightly_rate} onChange={(e) => setCampForm({...campForm, nightly_rate: e.target.value})} style={{ boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    
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
            </>
          )}

          {lobbyTab === 'staff' && (
            <StaffManager supabase={supabase} colors={colors} fonts={fonts} isDarkMode={isDarkMode} />
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
            <>
              <PageHeader title="Pending Approvals" subtitle="Review camp registrations or enter one on behalf of a property." icon={CheckSquare} colors={colors} fonts={fonts} eyebrow={<>ADMIN CONSOLE <span style={{ padding: '0 7px' }}>/</span> APPROVALS</>} />
              <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
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
                  <h3 style={{ margin: '0 0 6px', color: colors.textDark, fontFamily: fonts.header, fontSize: '20px' }}>NEW CUSTOMER INTAKE</h3>
                  <p style={{ margin: '0 0 20px', color: colors.muted, fontSize: '13px' }}>Capture the operation’s size and needs. This form does not collect payment details; plan and pricing can be confirmed during follow-up.</p>

                  <h4 style={{ margin: '0 0 10px', color: colors.primary, fontFamily: fonts.header, fontSize: '16px' }}>Organization & Contact</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <label style={registrationLabelStyle}>Property or location name *
                      <input required type="text" value={registrationForm.name} onChange={(event) => setRegistrationForm({ ...registrationForm, name: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Organization / business name
                      <input type="text" value={registrationForm.organization_name} onChange={(event) => setRegistrationForm({ ...registrationForm, organization_name: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Primary contact name
                      <input type="text" value={registrationForm.contact_name} onChange={(event) => setRegistrationForm({ ...registrationForm, contact_name: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Primary contact email
                      <input type="email" value={registrationForm.contact_email} onChange={(event) => setRegistrationForm({ ...registrationForm, contact_email: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Primary contact phone
                      <input type="tel" value={registrationForm.contact_number} onChange={(event) => setRegistrationForm({ ...registrationForm, contact_number: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Website
                      <input type="url" value={registrationForm.website_url} onChange={(event) => setRegistrationForm({ ...registrationForm, website_url: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Property address
                      <input type="text" value={registrationForm.property_address} onChange={(event) => setRegistrationForm({ ...registrationForm, property_address: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Mailing address
                      <input type="text" value={registrationForm.mailing_address} onChange={(event) => setRegistrationForm({ ...registrationForm, mailing_address: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Billing contact name
                      <input type="text" value={registrationForm.billing_contact_name} onChange={(event) => setRegistrationForm({ ...registrationForm, billing_contact_name: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Billing contact email
                      <input type="email" value={registrationForm.billing_contact_email} onChange={(event) => setRegistrationForm({ ...registrationForm, billing_contact_email: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                  </div>

                  <h4 style={{ margin: '0 0 10px', color: colors.primary, fontFamily: fonts.header, fontSize: '16px' }}>Property Types</h4>
                  <fieldset style={{ border: `1px solid ${colors.border}`, borderRadius: '5px', padding: '12px', margin: '0 0 20px' }}>
                    <legend style={{ padding: '0 6px', color: colors.textDark, fontSize: '13px' }}>Select all that apply *</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 14px' }}>
                      {registrationPropertyTypes.map((propertyType) => (
                        <label key={propertyType} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textDark, fontSize: '13px' }}>
                          <input type="checkbox" checked={registrationForm.property_types.includes(propertyType)} onChange={(event) => toggleRegistrationOption('property_types', propertyType, event.target.checked)} />
                          {propertyType}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {registrationForm.property_types.includes('Other') && (
                    <label style={{ ...registrationLabelStyle, marginBottom: '20px' }}>Describe the other property type
                      <input required type="text" value={registrationForm.other_property_type} onChange={(event) => setRegistrationForm({ ...registrationForm, other_property_type: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                  )}

                  <h4 style={{ margin: '0 0 10px', color: colors.primary, fontFamily: fonts.header, fontSize: '16px' }}>Operation Size</h4>
                  <p style={{ margin: '0 0 12px', color: colors.muted, fontSize: '12px' }}>Estimate current and peak-season active inventory and people managed. Historical records are not included in these estimates.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <label style={registrationLabelStyle}>Number of locations
                      <input required type="number" min="1" step="1" value={registrationForm.location_count} onChange={(event) => setRegistrationForm({ ...registrationForm, location_count: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Current units / assets
                      <input required type="number" min="0" step="1" value={registrationForm.current_unit_count} onChange={(event) => setRegistrationForm({ ...registrationForm, current_unit_count: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Peak units / assets
                      <input required type="number" min="0" step="1" value={registrationForm.peak_unit_count} onChange={(event) => setRegistrationForm({ ...registrationForm, peak_unit_count: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Current occupants / guests
                      <input required type="number" min="0" step="1" value={registrationForm.current_people_count} onChange={(event) => setRegistrationForm({ ...registrationForm, current_people_count: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Peak occupants / guests
                      <input required type="number" min="0" step="1" value={registrationForm.peak_people_count} onChange={(event) => setRegistrationForm({ ...registrationForm, peak_people_count: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                  </div>

                  <h4 style={{ margin: '0 0 10px', color: colors.primary, fontFamily: fonts.header, fontSize: '16px' }}>Needs & Subscription Preferences</h4>
                  <fieldset style={{ border: `1px solid ${colors.border}`, borderRadius: '5px', padding: '12px', margin: '0 0 12px' }}>
                    <legend style={{ padding: '0 6px', color: colors.textDark, fontSize: '13px' }}>Features of interest</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 14px' }}>
                      {registrationFeatureOptions.map((feature) => (
                        <label key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textDark, fontSize: '13px' }}>
                          <input type="checkbox" checked={registrationForm.requested_features.includes(feature)} onChange={(event) => toggleRegistrationOption('requested_features', feature, event.target.checked)} />
                          {feature}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                    <label style={registrationLabelStyle}>Other feature or need
                      <input type="text" value={registrationForm.other_feature} onChange={(event) => setRegistrationForm({ ...registrationForm, other_feature: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                    <label style={registrationLabelStyle}>Plan preference (not a quote)
                      <select value={registrationForm.plan_preference} onChange={(event) => setRegistrationForm({ ...registrationForm, plan_preference: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }}>
                        <option value="help_me_choose">Help me choose</option>
                        <option value="starter">Starter</option>
                        <option value="growth">Growth</option>
                        <option value="portfolio">Portfolio</option>
                        <option value="enterprise">Enterprise / custom</option>
                      </select>
                    </label>
                    <label style={registrationLabelStyle}>Billing preference
                      <select value={registrationForm.billing_preference} onChange={(event) => setRegistrationForm({ ...registrationForm, billing_preference: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }}>
                        <option value="monthly_or_annual">Monthly or annual</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </label>
                    <label style={registrationLabelStyle}>Desired start date
                      <input type="date" value={registrationForm.desired_start_date} onChange={(event) => setRegistrationForm({ ...registrationForm, desired_start_date: event.target.value })} style={{ ...registrationInputStyle, marginTop: '6px' }} />
                    </label>
                  </div>
                  <label style={{ ...registrationLabelStyle, marginBottom: '16px' }}>Additional notes
                    <textarea value={registrationForm.notes} onChange={(event) => setRegistrationForm({ ...registrationForm, notes: event.target.value })} rows="3" style={{ ...registrationInputStyle, marginTop: '6px', resize: 'vertical' }} />
                  </label>

                  {profile?.access_tier === 'global_superadmin' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: colors.textDark, fontSize: '13px' }}>
                      <input type="checkbox" checked={registrationForm.gs_restricted} onChange={(event) => setRegistrationForm({ ...registrationForm, gs_restricted: event.target.checked })} />
                      Restrict the created property to Global Superadmins
                    </label>
                  )}
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
                          <div style={{ color: colors.primary, fontSize: '12px', marginBottom: '10px' }}>{registration.organization_name || 'Organization not provided'} · {(registration.property_types || [registration.type]).join(', ')}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px 16px', color: colors.muted, fontSize: '13px', overflowWrap: 'anywhere' }}>
                            {registration.contact_name && <div>Contact: {registration.contact_name}</div>}
                            {registration.contact_number && <div>Phone: {registration.contact_number}</div>}
                            {registration.contact_email && <div>Email: {registration.contact_email}</div>}
                            {registration.billing_contact_name && <div>Billing contact: {registration.billing_contact_name}</div>}
                            {registration.billing_contact_email && <div>Billing email: {registration.billing_contact_email}</div>}
                            {registration.property_address && <div>Property address: {registration.property_address}</div>}
                            {registration.mailing_address && <div>Mailing address: {registration.mailing_address}</div>}
                            {registration.website_url && <div>Website: {registration.website_url}</div>}
                            {registration.other_property_type && <div>Other property type: {registration.other_property_type}</div>}
                            <div>Locations: {registration.location_count}</div>
                            <div>Units/assets: {registration.current_unit_count} current · {registration.peak_unit_count} peak</div>
                            <div>Occupants/guests: {registration.current_people_count} current · {registration.peak_people_count} peak</div>
                            <div>Plan preference: {{ help_me_choose: 'Help me choose', starter: 'Starter', growth: 'Growth', portfolio: 'Portfolio', enterprise: 'Enterprise / custom' }[registration.plan_preference] || 'Help me choose'}</div>
                            <div>Billing: {{ monthly_or_annual: 'Monthly or annual', monthly: 'Monthly', annual: 'Annual' }[registration.billing_preference] || 'Not specified'}</div>
                            {registration.desired_start_date && <div>Desired start: {registration.desired_start_date}</div>}
                            {(registration.requested_features || []).length > 0 && <div style={{ gridColumn: '1 / -1' }}>Features: {registration.requested_features.join(', ')}</div>}
                            {registration.other_feature && <div style={{ gridColumn: '1 / -1' }}>Other need: {registration.other_feature}</div>}
                            {registration.notes && <div style={{ gridColumn: '1 / -1', whiteSpace: 'pre-wrap' }}>Notes: {registration.notes}</div>}
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
            </>
          )}

          {/* UNIFIED TOWN HALL MODULE */}
          {lobbyTab === 'townhall' && (
            <>
              <PageHeader title="Town Hall" subtitle="Central hub for team communication and system feedback." icon={MessageSquare} colors={colors} fonts={fonts} eyebrow={<>ADMIN CONSOLE <span style={{ padding: '0 7px' }}>/</span> TOWN HALL</>} />
              <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              
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
                      <option value="Test-Youth Camp">Test-Youth Camp</option>
                      <option value="Test-Campground">Test-Campground</option>
                      <option value="new_project">+ New Project</option>
                    </select>
                  </div>
                  {selectedProject === 'new_project' && (
                    <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: colors.highlight, borderLeft: `4px solid ${colors.primary}`, borderRadius: '0 4px 4px 0' }}>
                      <label style={{ display: 'block', color: colors.textDark, fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Enter New Project Name:</label>
                      <input type="text" value={newProjectName} onChange={handleProjectTextChange} placeholder="Project Name..." style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'transparent', color: colors.textDark, fontFamily: fonts.body }} />
                    </div>
                  )}
                  <form onSubmit={handleCreateTownHallPost} style={{ padding: '18px', marginBottom: '20px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '6px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', color: colors.textDark, fontWeight: 'bold', fontSize: '14px' }}>Discussion title
                      <input type="text" value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} placeholder="Optional title" style={{ width: '100%', boxSizing: 'border-box', marginTop: '6px', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body }} />
                    </label>
                    <label style={{ display: 'block', marginBottom: '12px', color: colors.textDark, fontWeight: 'bold', fontSize: '14px' }}>Your post
                      <textarea required value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} rows="4" placeholder="Share an update or start a discussion..." style={{ width: '100%', boxSizing: 'border-box', display: 'block', marginTop: '6px', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body, resize: 'vertical' }} />
                    </label>
                    {postError && <p role="alert" style={{ margin: '0 0 12px', color: colors.error, fontSize: '13px' }}>{postError}</p>}
                    <button type="submit" disabled={isSavingPost} style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, border: 'none', padding: '9px 16px', borderRadius: '4px', cursor: isSavingPost ? 'wait' : 'pointer', fontFamily: fonts.utility, fontSize: '12px' }}>{isSavingPost ? 'POSTING…' : 'POST TO DISCUSSION'}</button>
                  </form>

                  {isLoadingPosts ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: colors.muted }}>Loading discussions…</div>
                  ) : townHallPosts.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: colors.muted, backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '6px' }}>No discussion posts yet for this project.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {townHallPosts.filter((post) => post.project_name === (selectedProject === 'new_project' ? newProjectName.trim() : selectedProject)).map((post) => {
                        const isAuthor = post.author_id === profile?.id
                        const canDelete = isAuthor || profile?.access_tier === 'global_superadmin'
                        const isEditing = editingPostId === post.id
                        return (
                          <article key={post.id} style={{ padding: '18px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              <div>
                                <div style={{ color: colors.primary, fontSize: '12px', fontFamily: fonts.utility }}>{post.project_name}</div>
                                <div style={{ color: colors.muted, fontSize: '12px', marginTop: '4px' }}>{post.author_name} · {new Date(post.created_at).toLocaleString()}{post.updated_at !== post.created_at ? ' · edited' : ''}</div>
                              </div>
                              {(isAuthor || canDelete) && !isEditing && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {isAuthor && <button type="button" onClick={() => { setEditingPostId(post.id); setEditPostForm({ title: post.title, content: post.content }); setPostError('') }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 9px', border: `1px solid ${colors.border}`, borderRadius: '4px', background: 'transparent', color: colors.textDark, cursor: 'pointer', fontFamily: fonts.utility, fontSize: '11px' }}><Edit2 size={14} /> EDIT</button>}
                                  {canDelete && <button type="button" onClick={() => { if (window.confirm('Delete this discussion post?')) void handleDeleteTownHallPost(post) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 9px', border: `1px solid ${colors.error}`, borderRadius: '4px', background: 'transparent', color: colors.error, cursor: 'pointer', fontFamily: fonts.utility, fontSize: '11px' }}><Trash2 size={14} /> DELETE</button>}
                                </div>
                              )}
                            </div>
                            {isEditing ? (
                              <div>
                                <input type="text" value={editPostForm.title} onChange={(event) => setEditPostForm({ ...editPostForm, title: event.target.value })} aria-label="Edit discussion title" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '8px', padding: '9px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body }} />
                                <textarea value={editPostForm.content} onChange={(event) => setEditPostForm({ ...editPostForm, content: event.target.value })} rows="4" aria-label="Edit discussion post" style={{ width: '100%', boxSizing: 'border-box', padding: '9px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body, resize: 'vertical' }} />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                                  <button type="button" onClick={() => setEditingPostId(null)} style={{ padding: '7px 10px', border: `1px solid ${colors.border}`, borderRadius: '4px', background: 'transparent', color: colors.textDark, cursor: 'pointer' }}>Cancel</button>
                                  <button type="button" onClick={() => void handleSaveTownHallEdit(post)} disabled={isSavingPost} style={{ padding: '7px 10px', border: 'none', borderRadius: '4px', backgroundColor: colors.primary, color: colors.textOnPrimary, cursor: 'pointer' }}>Save</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {post.title && <h3 style={{ margin: '0 0 8px', color: colors.textDark, fontSize: '16px' }}>{post.title}</h3>}
                                <p style={{ margin: 0, color: colors.textDark, fontSize: '15px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                              </>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: QA & Tester Notes */}
              {townHallView === 'notes' && (
                <div>
                  <form onSubmit={handleCreateTownHallPost} style={{ padding: '18px', marginBottom: '20px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '6px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', color: colors.textDark, fontWeight: 'bold', fontSize: '14px' }}>Note title
                      <input type="text" value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} placeholder="Optional title" style={{ width: '100%', boxSizing: 'border-box', marginTop: '6px', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body }} />
                    </label>
                    <label style={{ display: 'block', marginBottom: '12px', color: colors.textDark, fontWeight: 'bold', fontSize: '14px' }}>QA or tester note
                      <textarea required value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} rows="4" placeholder="Describe an issue, suggestion, or test finding..." style={{ width: '100%', boxSizing: 'border-box', display: 'block', marginTop: '6px', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body, resize: 'vertical' }} />
                    </label>
                    {postError && <p role="alert" style={{ margin: '0 0 12px', color: colors.error, fontSize: '13px' }}>{postError}</p>}
                    <button type="submit" disabled={isSavingPost} style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, border: 'none', padding: '9px 16px', borderRadius: '4px', cursor: isSavingPost ? 'wait' : 'pointer', fontFamily: fonts.utility, fontSize: '12px' }}>{isSavingPost ? 'SUBMITTING…' : 'SUBMIT NOTE'}</button>
                  </form>
                  <h3 style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, margin: '0 0 15px', borderBottom: `2px solid ${colors.border}`, paddingBottom: '8px' }}>TOWN HALL NOTES</h3>
                  {isLoadingPosts ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: colors.muted }}>Loading notes…</div>
                  ) : townHallPosts.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: colors.muted, backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '6px' }}>No notes have been submitted yet.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {townHallPosts.map((post) => {
                        const isAuthor = post.author_id === profile?.id
                        const canDelete = isAuthor || profile?.access_tier === 'global_superadmin'
                        const isEditing = editingPostId === post.id
                        return (
                          <article key={post.id} style={{ padding: '18px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              <div style={{ color: colors.muted, fontSize: '12px' }}>{post.author_name} · {new Date(post.created_at).toLocaleString()}{post.updated_at !== post.created_at ? ' · edited' : ''}</div>
                              {(isAuthor || canDelete) && !isEditing && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {isAuthor && <button type="button" onClick={() => { setEditingPostId(post.id); setEditPostForm({ title: post.title, content: post.content }); setPostError('') }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 9px', border: `1px solid ${colors.border}`, borderRadius: '4px', background: 'transparent', color: colors.textDark, cursor: 'pointer', fontFamily: fonts.utility, fontSize: '11px' }}><Edit2 size={14} /> EDIT</button>}
                                  {canDelete && <button type="button" onClick={() => { if (window.confirm('Delete this note?')) void handleDeleteTownHallPost(post) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 9px', border: `1px solid ${colors.error}`, borderRadius: '4px', background: 'transparent', color: colors.error, cursor: 'pointer', fontFamily: fonts.utility, fontSize: '11px' }}><Trash2 size={14} /> DELETE</button>}
                                </div>
                              )}
                            </div>
                            {isEditing ? (
                              <div>
                                <input type="text" value={editPostForm.title} onChange={(event) => setEditPostForm({ ...editPostForm, title: event.target.value })} aria-label="Edit note title" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '8px', padding: '9px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body }} />
                                <textarea value={editPostForm.content} onChange={(event) => setEditPostForm({ ...editPostForm, content: event.target.value })} rows="4" aria-label="Edit note" style={{ width: '100%', boxSizing: 'border-box', padding: '9px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body, resize: 'vertical' }} />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                                  <button type="button" onClick={() => setEditingPostId(null)} style={{ padding: '7px 10px', border: `1px solid ${colors.border}`, borderRadius: '4px', background: 'transparent', color: colors.textDark, cursor: 'pointer' }}>Cancel</button>
                                  <button type="button" onClick={() => void handleSaveTownHallEdit(post)} disabled={isSavingPost} style={{ padding: '7px 10px', border: 'none', borderRadius: '4px', backgroundColor: colors.primary, color: colors.textOnPrimary, cursor: 'pointer' }}>Save</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {post.title && <h4 style={{ margin: '0 0 8px', color: colors.textDark }}>{post.title}</h4>}
                                <p style={{ margin: 0, color: colors.textDark, fontSize: '15px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                              </>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            </>
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
