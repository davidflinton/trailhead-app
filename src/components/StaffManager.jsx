import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Mail, Smartphone, Dices, RefreshCw, LayoutDashboard, List, UserPlus, Edit2, Check, X, ShieldAlert, Trash2, Key, ToggleLeft, ToggleRight, QrCode } from 'lucide-react'

const words = [
  'cow', 'truck', 'sing', 'water', 'diner', 'wolf', 'bear', 'tent', 'pine', 'camp',
  'fire', 'wood', 'lake', 'moon', 'star', 'leaf', 'rock', 'path', 'trail', 'fish',
  'bird', 'hawk', 'deer', 'frog', 'toad', 'moss', 'fern', 'dirt', 'mud', 'sand',
  'sun', 'sky', 'cloud', 'rain', 'snow', 'wind', 'storm', 'cold', 'warm', 'hot',
  'cool', 'base', 'peak', 'hill', 'ridge', 'creek', 'river', 'pond', 'bog', 'fox',
  'elk', 'buck', 'doe', 'fawn', 'owl', 'crow', 'jay', 'dove', 'swan', 'duck',
  'bass', 'carp', 'newt', 'snake', 'worm', 'bug', 'ant', 'bee', 'wasp', 'moth',
  'bat', 'lynx', 'puma', 'lion', 'crab', 'clam', 'gull', 'seal', 'boar', 'hare',
  'goat', 'ram', 'ewe', 'calf', 'pup', 'cub', 'tree', 'oak', 'elm', 'ash',
  'fir', 'yew', 'root', 'bark', 'twig', 'bush', 'weed', 'vine', 'dust', 'stone',
  'clay', 'cliff', 'edge', 'cave', 'den', 'road', 'track', 'pool', 'sea', 'bay',
  'cove', 'gulf', 'tide', 'wave', 'surf', 'foam', 'drop', 'swamp', 'marsh', 'gale',
  'gust', 'hail', 'sleet', 'ice', 'frost', 'dew', 'fog', 'mist', 'haze', 'ray',
  'beam', 'dry', 'wet', 'damp', 'dark', 'dawn', 'dusk', 'day', 'tarp', 'peg',
  'rope', 'knot', 'burn', 'coal', 'axe', 'saw', 'knife', 'pot', 'pan', 'cup',
  'mug', 'bowl', 'fork', 'spoon', 'food', 'grub', 'meat', 'stew', 'soup', 'bean',
  'oat', 'nut', 'seed', 'berry', 'plum', 'pear', 'apple', 'pack', 'bag', 'map',
  'pass', 'gear', 'boot', 'shoe', 'hat', 'cap', 'coat', 'vest', 'belt', 'cord',
  'wire', 'hike', 'walk', 'run', 'jog', 'leap', 'jump', 'swim', 'wade', 'dive',
  'sail', 'row', 'hunt', 'trap', 'seek', 'find', 'hide', 'look', 'spot', 'spy',
  'hear', 'rest', 'sleep', 'nap', 'wake', 'eat', 'drink', 'chew', 'bite', 'cook',
  'boil', 'bake', 'chop', 'cut', 'split', 'tie', 'bind', 'fold', 'zip', 'pull',
  'push', 'lift', 'haul', 'drag', 'toss', 'throw', 'catch', 'yard', 'barn', 'shed',
  'farm', 'gate', 'fence', 'pole', 'flag', 'horn', 'bell', 'drum', 'song', 'tune',
  'beat', 'play', 'game', 'race', 'team', 'win', 'lose', 'draw', 'step', 'stair',
  'door', 'room', 'roof', 'wall', 'floor', 'hall', 'seat', 'desk', 'page', 'book',
  'word', 'pen', 'ink', 'note', 'bill', 'coin', 'cash'
]

const generatePassphrase = () => {
  const getW = () => words[Math.floor(Math.random() * words.length)]
  const getNum = () => String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  const symbols = ['!', '#', '$', '%', '&', '+']
  const getSym = () => symbols[Math.floor(Math.random() * symbols.length)]
  return `${getW()}-${getW()}-${getW()}-${getNum()}${getSym()}`
}

const generateRandomIdSuffix = () => {
  const chars = '0123456789ACDEFHJKLMNPQRTUVWXY'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const getRolePrefix = (role) => {
  switch(role) {
    case 'Global Superadmin': return 'GS'
    case 'Global Admin': return 'TA'
    case 'QA Tester': return 'TS'
    default: return 'TS'
  }
}

export default function StaffManager({ colors, fonts, isDarkMode }) {
  const [staffSubTab, setStaffSubTab] = useState('directory')
  const [activeStaff, setActiveStaff] = useState([])
  const [camps, setCamps] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState(null)
  
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [isCreatingStaff, setIsCreatingStaff] = useState(false)
  const [isEditingStaff, setIsEditingStaff] = useState(false)
  const [showQrCode, setShowQrCode] = useState(null)

  const defaultStaffForm = {
    prefix: '', firstName: '', middleName: '', lastName: '', suffix: '', 
    displayName: '', preferredPronouns: '', spokenLanguages: '', 
    idSuffix: generateRandomIdSuffix(), email: '', phone: '', 
    role: 'QA Tester', passphrase: generatePassphrase(),
    position: '', startDate: '', endDate: '', assignedCamps: []
  }
  
  const [staffForm, setStaffForm] = useState(defaultStaffForm)

  useEffect(() => {
    fetchStaffDirectory()
    fetchCamps()
  }, [])

  const fetchStaffDirectory = async () => {
    try {
      const { data, error } = await supabase
        .from('trailhead_personnel')
        .select('*')
        .in('access_tier', ['global_superadmin', 'global_admin', 'QA Tester'])
        .order('last_name')
      
      if (error) throw error
      setActiveStaff(data || [])
    } catch (error) {
      console.error("Failed to load staff:", error.message)
    }
  }

  const fetchCamps = async () => {
    try {
      const { data, error } = await supabase.from('camps').select('id, name').order('name')
      if (error) throw error
      setCamps(data || [])
    } catch (error) {
      console.error("Failed to load camps:", error.message)
    }
  }

  const handleIdSuffixChange = (e) => {
    const charMap = { 'B': '8', 'G': '6', 'I': '1', 'O': '0', 'S': '5', 'Z': '2' }
    let raw = e.target.value.toUpperCase()
    let corrected = raw.replace(/[BGIOSZ]/g, match => charMap[match])
    corrected = corrected.replace(/[^0-9ACDEFHJKLMNPQRTUVWXY]/g, '')
    setStaffForm({ ...staffForm, idSuffix: corrected.substring(0, 8) })
  }

  const handleAssignCamp = (campId) => {
    setStaffForm(prev => ({ ...prev, assignedCamps: [...prev.assignedCamps, campId] }))
  }

  const handleUnassignCamp = (campId) => {
    setStaffForm(prev => ({ ...prev, assignedCamps: prev.assignedCamps.filter(id => id !== campId) }))
  }

  const handleStaffCreate = async (method) => {
    setIsLoading(true)
    setFeedbackMsg(null)

    const fullTrailheadId = `${getRolePrefix(staffForm.role)}${staffForm.idSuffix}`
    const authEmail = `${fullTrailheadId.toLowerCase()}@trailhead.local`

    try {
      const { data: authData, error: authError } = await supabase.functions.invoke('create-admin-user', {
        body: { email: authEmail, password: staffForm.passphrase }
      })

      if (authError) throw authError
      const newUserId = authData.user.id

      const { error: profileError } = await supabase
        .from('trailhead_personnel')
        .insert([{
          id: newUserId,
          prefix: staffForm.prefix || null,
          first_name: staffForm.firstName,
          middle_name: staffForm.middleName || null,
          last_name: staffForm.lastName,
          suffix: staffForm.suffix || null,
          display_name: staffForm.displayName || null,
          preferred_pronouns: staffForm.preferredPronouns || null,
          spoken_languages: staffForm.spokenLanguages || null,
          position: staffForm.position || null,
          start_date: staffForm.startDate || null,
          end_date: staffForm.endDate || null,
          email: staffForm.email || null,
          phone: staffForm.phone || null,
          is_active: true,
          assigned_camps: staffForm.assignedCamps,
          trailhead_id: fullTrailheadId,
          access_tier: staffForm.role === 'Global Superadmin' ? 'global_superadmin' : 
                       staffForm.role === 'Global Admin' ? 'global_admin' : 'QA Tester'
        }])

      if (profileError) throw profileError

      if (method === 'qr') {
        setFeedbackMsg(`Success. Account ${fullTrailheadId} created.`)
        setShowQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`https://trailhead.local/register?id=${fullTrailheadId}&code=${staffForm.passphrase}`)}`)
      } else {
        setFeedbackMsg(`Success. Account ${fullTrailheadId} created. Setup link sent via ${method.toUpperCase()}.`)
      }
      
      resetStaffForm()
      fetchStaffDirectory()

    } catch (error) {
      setFeedbackMsg(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStaffUpdate = async () => {
    setIsLoading(true)
    setFeedbackMsg(null)
    const fullTrailheadId = `${getRolePrefix(staffForm.role)}${staffForm.idSuffix}`

    try {
      const { error: profileError } = await supabase
        .from('trailhead_personnel')
        .update({
          prefix: staffForm.prefix || null,
          first_name: staffForm.firstName,
          middle_name: staffForm.middleName || null,
          last_name: staffForm.lastName,
          suffix: staffForm.suffix || null,
          display_name: staffForm.displayName || null,
          preferred_pronouns: staffForm.preferredPronouns || null,
          spoken_languages: staffForm.spokenLanguages || null,
          position: staffForm.position || null,
          start_date: staffForm.startDate || null,
          end_date: staffForm.endDate || null,
          email: staffForm.email || null,
          phone: staffForm.phone || null,
          assigned_camps: staffForm.assignedCamps,
          trailhead_id: fullTrailheadId,
          access_tier: staffForm.role === 'Global Superadmin' ? 'global_superadmin' : 
                       staffForm.role === 'Global Admin' ? 'global_admin' : 'QA Tester'
        }).eq('id', selectedStaffId)

      if (profileError) throw profileError

      setFeedbackMsg(`Success. Account updated.`)
      resetStaffForm()
      fetchStaffDirectory()
    } catch (error) {
      setFeedbackMsg(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAccess = async () => {
    const selected = activeStaff.find(s => s.id === selectedStaffId)
    if (!selected) return

    try {
      const { error } = await supabase
        .from('trailhead_personnel')
        .update({ is_active: !selected.is_active })
        .eq('id', selectedStaffId)

      if (error) throw error
      setFeedbackMsg(`Success. Account access has been ${!selected.is_active ? 'enabled' : 'disabled'}.`)
      fetchStaffDirectory()
    } catch (error) {
      setFeedbackMsg(`Error updating access: ${error.message}`)
    }
  }

  const handlePasswordReset = async () => {
    const selected = activeStaff.find(s => s.id === selectedStaffId)
    if (!selected) return
    
    const authEmail = `${selected.trailhead_id.toLowerCase()}@trailhead.local`

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail)
      if (error) throw error
      setFeedbackMsg(`Password reset link has been dispatched to the user's registered email.`)
    } catch (error) {
      setFeedbackMsg(`Error initiating password reset: ${error.message}`)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you entirely sure you want to delete this staff record? This action cannot be reversed.")
    if (!confirmDelete) return

    try {
      const { error } = await supabase.from('trailhead_personnel').delete().eq('id', selectedStaffId)
      if (error) throw error
      setFeedbackMsg("Staff record deleted successfully.")
      setSelectedStaffId(null)
      fetchStaffDirectory()
    } catch (error) {
      setFeedbackMsg(`Error deleting account: ${error.message}`)
    }
  }

  const resetStaffForm = () => {
    setIsCreatingStaff(false)
    setIsEditingStaff(false)
    setSelectedStaffId(null)
    setStaffForm(defaultStaffForm)
  }

  const openEditForm = () => {
    const selected = activeStaff.find(s => s.id === selectedStaffId)
    if (!selected) return

    let parsedRole = 'QA Tester'
    if (selected.access_tier === 'global_superadmin') parsedRole = 'Global Superadmin'
    if (selected.access_tier === 'global_admin') parsedRole = 'Global Admin'

    const currentSuffix = selected.trailhead_id ? selected.trailhead_id.substring(2) : generateRandomIdSuffix()

    setStaffForm({
      prefix: selected.prefix || '',
      firstName: selected.first_name || '',
      middleName: selected.middle_name || '',
      lastName: selected.last_name || '',
      suffix: selected.suffix || '',
      displayName: selected.display_name || '',
      preferredPronouns: selected.preferred_pronouns || '',
      spokenLanguages: selected.spoken_languages || '',
      position: selected.position || '',
      startDate: selected.start_date || '',
      endDate: selected.end_date || '',
      email: selected.email || '',
      phone: selected.phone || '',
      assignedCamps: selected.assigned_camps || [],
      idSuffix: currentSuffix,
      role: parsedRole,
      passphrase: generatePassphrase()
    })
    setIsCreatingStaff(false)
    setIsEditingStaff(true)
  }

  const labelStyle = { display: 'block', color: colors.muted, fontFamily: fonts.body, fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '4px', backgroundColor: isDarkMode ? '#111' : '#fff', color: colors.textDark, border: `1px solid ${colors.muted}`, boxSizing: 'border-box', outline: 'none', fontFamily: fonts.body, fontSize: '15px' }
  const actionButtonStyle = { width: '100%', padding: '12px', border: 'none', borderRadius: '4px', fontFamily: fonts.body, fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* QR CODE MODAL */}
      {showQrCode && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: isDarkMode ? '#111' : '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '100%', border: `2px solid ${colors.primary}`, textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>SCAN TO AUTHENTICATE</h3>
            <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '20px' }}>Have the staff member scan this code to complete their account setup or login process.</p>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', display: 'inline-block', marginBottom: '20px' }}>
              <img src={showQrCode} alt="Authentication QR Code" style={{ width: '200px', height: '200px' }} />
            </div>
            <button 
              onClick={() => setShowQrCode(null)}
              style={{ width: '100%', backgroundColor: colors.primary, color: '#FFF', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '16px' }}
            >
              DONE
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px' }}>
        <SubNavButton icon={<List size={18} />} label="Directory" active={staffSubTab === 'directory'} onClick={() => setStaffSubTab('directory')} colors={colors} fonts={fonts} />
        <SubNavButton icon={<LayoutDashboard size={18} />} label="Dashboard" active={staffSubTab === 'dashboard'} onClick={() => setStaffSubTab('dashboard')} colors={colors} fonts={fonts} />
      </div>

      {staffSubTab === 'dashboard' && (
        <div>
          <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textDark, marginTop: 0, letterSpacing: '1px' }}>STAFF DASHBOARD</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: colors.background, padding: '20px', borderRadius: '4px', border: `2px solid ${colors.border}` }}>
              <h3 style={{ margin: '0 0 10px 0', color: colors.textDark, fontFamily: fonts.header, fontSize: '24px' }}>NOTIFICATIONS</h3>
              <p style={{ color: colors.muted, fontSize: '14px', margin: 0 }}>No new system alerts at this time.</p>
            </div>
          </div>
        </div>
      )}

      {staffSubTab === 'directory' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textDark, margin: '0 0 5px 0', letterSpacing: '1px' }}>STAFF DIRECTORY</h2>
              <p style={{ color: colors.muted, margin: 0, fontSize: '14px' }}>Manage system accounts and access tiers.</p>
            </div>
            <button 
              onClick={() => { resetStaffForm(); setIsCreatingStaff(true); }}
              style={{ backgroundColor: colors.highlight, color: '#FFF', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={16} /> ADD STAFF
            </button>
          </div>

          {feedbackMsg && (
            <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: feedbackMsg.includes('Error') ? colors.error : '#8A6D3B', color: '#FFF', fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'bold', borderRadius: '4px' }}>
              {feedbackMsg}
            </div>
          )}

          {/* ACTION BAR WHEN ROW IS SELECTED */}
          {selectedStaffId && !isCreatingStaff && !isEditingStaff && (() => {
            const selected = activeStaff.find(s => s.id === selectedStaffId)
            const isActive = selected?.is_active
            
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '4px', border: `1px solid ${colors.muted}` }}>
                <button 
                  onClick={openEditForm} 
                  style={{ backgroundColor: colors.primary, color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit2 size={16} /> EDIT
                </button>
                <div style={{ width: '1px', backgroundColor: colors.muted, margin: '0 5px' }}></div>
                <button 
                  onClick={handlePasswordReset} 
                  style={{ backgroundColor: 'transparent', color: colors.textDark, border: `1px solid ${colors.muted}`, padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Key size={16} /> RESET PW
                </button>
                <button 
                  onClick={() => {
                    const encodedUrl = encodeURIComponent(`https://trailhead.local/reset-password?id=${selected.trailhead_id}`)
                    setShowQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedUrl}`)
                  }} 
                  style={{ backgroundColor: colors.highlight, color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <QrCode size={16} /> SHOW QR
                </button>
                <button 
                  onClick={handleToggleAccess} 
                  style={{ backgroundColor: isActive ? 'transparent' : colors.primary, color: isActive ? colors.textDark : '#FFF', border: `1px solid ${colors.muted}`, padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isActive ? <ToggleRight size={16} color={colors.primary} /> : <ToggleLeft size={16} />} 
                  {isActive ? 'DISABLE' : 'ENABLE'}
                </button>
                <button 
                  onClick={handleDeleteAccount} 
                  style={{ backgroundColor: colors.error, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
                >
                  <Trash2 size={16} /> DELETE
                </button>
              </div>
            )
          })()}

          {/* ADD / EDIT FORM */}
          {(isCreatingStaff || isEditingStaff) && (
            <div style={{ backgroundColor: isDarkMode ? '#111' : '#fff', padding: '25px', borderRadius: '4px', border: `2px solid ${colors.primary}`, marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, margin: 0 }}>
                  {isEditingStaff ? 'EDIT STAFF ACCOUNT' : 'CREATE NEW STAFF ACCOUNT'}
                </h3>
                <button onClick={resetStaffForm} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}><X size={20}/></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
                
                {/* COMPACT NAME GRID */}
                <div style={{ padding: '15px', border: `1px solid ${colors.muted}`, borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <label style={{ ...labelStyle, fontSize: '11px', textTransform: 'uppercase', marginBottom: '10px' }}>Identity Information</label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 2fr 2fr 2fr minmax(80px, 1fr)', gap: '10px', marginBottom: '15px', alignItems: 'end' }}>
                    <div>
                      <label style={labelStyle}>Prefix</label>
                      <select value={staffForm.prefix} onChange={(e) => setStaffForm({...staffForm, prefix: e.target.value})} style={inputStyle}>
                        <option value=""></option>
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Mx.">Mx.</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>First Name</label>
                      <input type="text" value={staffForm.firstName} onChange={(e) => setStaffForm({...staffForm, firstName: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Middle</label>
                      <input type="text" value={staffForm.middleName} onChange={(e) => setStaffForm({...staffForm, middleName: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input type="text" value={staffForm.lastName} onChange={(e) => setStaffForm({...staffForm, lastName: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Suffix</label>
                      <select value={staffForm.suffix} onChange={(e) => setStaffForm({...staffForm, suffix: e.target.value})} style={inputStyle}>
                        <option value=""></option>
                        <option value="Jr.">Jr.</option>
                        <option value="Sr.">Sr.</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Display Name</label>
                      <input type="text" placeholder="Optional" value={staffForm.displayName} onChange={(e) => setStaffForm({...staffForm, displayName: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Preferred Pronouns</label>
                      <input type="text" placeholder="They/Them, She/Her, etc." value={staffForm.preferredPronouns} onChange={(e) => setStaffForm({...staffForm, preferredPronouns: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Spoken Languages</label>
                      <input type="text" placeholder="English, ASL, etc." value={staffForm.spokenLanguages} onChange={(e) => setStaffForm({...staffForm, spokenLanguages: e.target.value})} style={inputStyle} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>System Role</label>
                    <select value={staffForm.role} onChange={(e) => setStaffForm({...staffForm, role: e.target.value})} style={inputStyle}>
                      <option value="QA Tester">QA Tester</option>
                      <option value="Global Admin">Global Admin</option>
                      <option value="Global Superadmin">Global Superadmin</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Position / Job Title</label>
                    <input type="text" placeholder="Manager, Developer, etc." value={staffForm.position} onChange={(e) => setStaffForm({...staffForm, position: e.target.value})} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Start Date</label>
                    <input type="date" value={staffForm.startDate} onChange={(e) => setStaffForm({...staffForm, startDate: e.target.value})} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>End Date (Auto-Disable at 5PM CST)</label>
                    <input type="date" value={staffForm.endDate} onChange={(e) => setStaffForm({...staffForm, endDate: e.target.value})} style={inputStyle} />
                  </div>
                </div>

                <div style={{ padding: '15px', border: `1px solid ${colors.muted}`, borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <label style={{ ...labelStyle, fontSize: '11px', textTransform: 'uppercase', marginBottom: '10px' }}>Assigned Properties (Click to Move)</label>
                  <div style={{ display: 'flex', gap: '10px', height: '180px' }}>
                    
                    <div style={{ flex: 1, border: `1px solid ${colors.muted}`, borderRadius: '4px', overflowY: 'auto', backgroundColor: isDarkMode ? '#111' : '#fff', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '8px', backgroundColor: 'rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', borderBottom: `1px solid ${colors.muted}` }}>
                        Available
                      </div>
                      <div style={{ flex: 1, padding: '5px' }}>
                        {camps.filter(c => !staffForm.assignedCamps.includes(c.id)).map(camp => (
                          <div 
                            key={camp.id} 
                            onClick={() => handleAssignCamp(camp.id)} 
                            style={{ padding: '8px 10px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #eee', color: colors.textDark, display: 'flex', justifyContent: 'space-between', transition: 'background 0.1s' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {camp.name} <span>&rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ flex: 1, border: `2px solid ${colors.primary}`, borderRadius: '4px', overflowY: 'auto', backgroundColor: isDarkMode ? '#111' : '#fff', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '8px', backgroundColor: colors.primary, color: 'white', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>
                        Assigned
                      </div>
                      <div style={{ flex: 1, padding: '5px' }}>
                        {camps.filter(c => staffForm.assignedCamps.includes(c.id)).map(camp => (
                          <div 
                            key={camp.id} 
                            onClick={() => handleUnassignCamp(camp.id)} 
                            style={{ padding: '8px 10px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #eee', color: colors.textDark, display: 'flex', justifyContent: 'space-between', transition: 'background 0.1s' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(193,83,27,0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <span>&larr;</span> {camp.name}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                <div>
                  <label style={labelStyle}>TRAILHEAD ID</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.05)', color: colors.textDark, border: `1px solid ${colors.muted}`, borderRadius: '4px', fontFamily: fonts.utility, fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center' }}>
                      {getRolePrefix(staffForm.role)}
                    </div>
                    <input 
                      type="text" 
                      value={staffForm.idSuffix} 
                      onChange={handleIdSuffixChange} 
                      placeholder="8 CHARACTERS" 
                      style={{ ...inputStyle, fontFamily: fonts.utility, textTransform: 'uppercase', flexGrow: 1 }} 
                    />
                    <button onClick={() => setStaffForm({ ...staffForm, idSuffix: generateRandomIdSuffix() })} style={{ padding: '0 12px', backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Generate Random ID">
                      <Dices size={20} />
                    </button>
                  </div>
                </div>

                {isCreatingStaff && (
                  <div>
                    <label style={labelStyle}>Generated Passphrase</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={staffForm.passphrase} 
                        style={{ ...inputStyle, fontFamily: fonts.utility, flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.02)', color: colors.primary, fontWeight: 'bold', fontSize: '14px' }} 
                      />
                      <button onClick={() => setStaffForm({ ...staffForm, passphrase: generatePassphrase() })} style={{ padding: '0 12px', backgroundColor: 'transparent', color: colors.textDark, border: `1px solid ${colors.muted}`, borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Regenerate Passphrase">
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>
                )}
                
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" value={staffForm.email} onChange={(e) => setStaffForm({...staffForm, email: e.target.value})} style={inputStyle} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={labelStyle}>Phone Number</label>
                  <input type="tel" value={staffForm.phone} onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})} style={inputStyle} />
                </div>

                {isEditingStaff ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <button 
                       onClick={handleStaffUpdate} 
                       disabled={isLoading || staffForm.idSuffix.length !== 8}
                       style={{ ...actionButtonStyle, backgroundColor: colors.primary, color: '#FFF', opacity: (isLoading || staffForm.idSuffix.length !== 8) ? 0.5 : 1 }}
                     >
                       <Check size={18} /> SAVE CHANGES
                     </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    <button 
                      onClick={() => handleStaffCreate('email')} 
                      disabled={isLoading || staffForm.idSuffix.length !== 8}
                      style={{ ...actionButtonStyle, backgroundColor: colors.primary, color: '#FFF', opacity: (isLoading || staffForm.idSuffix.length !== 8) ? 0.5 : 1 }}
                    >
                      <Mail size={18} /> Email
                    </button>
                    <button 
                      onClick={() => handleStaffCreate('sms')} 
                      disabled={isLoading || staffForm.idSuffix.length !== 8}
                      style={{ ...actionButtonStyle, backgroundColor: 'transparent', color: colors.textDark, border: `2px solid ${colors.textDark}`, opacity: (isLoading || staffForm.idSuffix.length !== 8) ? 0.5 : 1 }}
                    >
                      <Smartphone size={18} /> Text
                    </button>
                    <button 
                      onClick={() => handleStaffCreate('qr')} 
                      disabled={isLoading || staffForm.idSuffix.length !== 8}
                      style={{ ...actionButtonStyle, backgroundColor: colors.highlight, color: '#FFF', border: 'none', opacity: (isLoading || staffForm.idSuffix.length !== 8) ? 0.5 : 1 }}
                    >
                      <QrCode size={18} /> QR Code
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ backgroundColor: isDarkMode ? '#111' : '#fff', borderRadius: '4px', border: `1px solid ${colors.muted}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '15px 20px', borderBottom: `2px solid ${colors.muted}`, backgroundColor: 'rgba(0,0,0,0.02)', fontFamily: fonts.utility, fontSize: '11px', fontWeight: 'bold', color: colors.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>
              <div>Employee Name</div>
              <div>Trailhead ID</div>
              <div>Access Tier</div>
              <div>Status</div>
            </div>
            
            {activeStaff.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: colors.muted, fontFamily: fonts.body }}>
                No staff records found in the directory.
              </div>
            ) : (
              activeStaff.map((staff) => {
                const displayStr = staff.display_name || `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unknown User'
                const isSelected = selectedStaffId === staff.id
                
                return (
                  <div 
                    key={staff.id}
                    onClick={() => { setSelectedStaffId(staff.id); setIsCreatingStaff(false); setIsEditingStaff(false); }}
                    style={{ 
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', 
                      padding: '15px 20px', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(193, 83, 27, 0.1)' : 'transparent',
                      transition: 'background-color 0.1s', opacity: staff.is_active ? 1 : 0.6
                    }}
                  >
                    <div style={{ color: colors.textDark, fontWeight: 'bold', fontFamily: fonts.body, fontSize: '15px' }}>
                      {displayStr}
                    </div>
                    <div style={{ color: colors.muted, fontFamily: fonts.utility, fontSize: '13px' }}>
                      {staff.trailhead_id || 'NO-ID'}
                    </div>
                    <div>
                      <span style={{ backgroundColor: colors.highlight, color: '#FFF', padding: '4px 8px', borderRadius: '2px', fontFamily: fonts.utility, fontSize: '10px', textTransform: 'uppercase' }}>
                        {staff.access_tier ? staff.access_tier.replace('_', ' ') : 'USER'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: staff.is_active ? colors.primary : colors.error, fontFamily: fonts.utility, fontSize: '11px', fontWeight: 'bold' }}>
                        {staff.is_active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SubNavButton({ icon, label, active, onClick, colors, fonts }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
        backgroundColor: active ? colors.primary : colors.highlight,
        color: active ? '#FFF' : colors.muted,
        border: 'none', borderRadius: '20px', fontFamily: fonts.body,
        fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
        whiteSpace: 'nowrap', transition: 'all 0.2s'
      }}
    >
      {icon} {label}
    </button>
  )
}