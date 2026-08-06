import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Mail, Smartphone, Dices, RefreshCw, LayoutDashboard, List, UserPlus, Edit2, Check, X } from 'lucide-react'

// Word dictionary for passphrase generation
const words = ['cow', 'truck', 'sing', 'water', 'diner', 'wolf', 'bear', 'tent', 'pine', 'camp', 'fire', 'wood', 'lake', 'moon', 'star', 'leaf', 'rock', 'path', 'trail', 'fish', 'bird', 'hawk', 'deer', 'frog', 'toad', 'moss', 'fern', 'dirt', 'mud', 'sand', 'sun', 'sky', 'cloud', 'rain', 'snow', 'wind', 'storm', 'cold', 'warm', 'hot', 'cool', 'base', 'peak', 'hill', 'ridge', 'creek', 'river', 'pond', 'bog']

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

export default function StaffManager({ colors, fonts }) {
  const [staffSubTab, setStaffSubTab] = useState('directory')
  const [activeStaff, setActiveStaff] = useState([])
  const [camps, setCamps] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState(null)
  
  // Directory Action State
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [isCreatingStaff, setIsCreatingStaff] = useState(false)
  const [isEditingStaff, setIsEditingStaff] = useState(false)

  const defaultStaffForm = {
    prefix: '', firstName: '', middleName: '', lastName: '', suffix: '', 
    displayName: '', preferredGender: '', spokenLanguages: '', 
    idSuffix: generateRandomIdSuffix(), email: '', phone: '', 
    role: 'QA Tester', passphrase: generatePassphrase(),
    position: '', startDate: '', assignedCamps: []
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
          preferred_gender: staffForm.preferredGender || null,
          spoken_languages: staffForm.spokenLanguages || null,
          position: staffForm.position || null,
          start_date: staffForm.startDate || null,
          assigned_camps: staffForm.assignedCamps,
          trailhead_id: fullTrailheadId,
          access_tier: staffForm.role === 'Global Superadmin' ? 'global_superadmin' : 
                       staffForm.role === 'Global Admin' ? 'global_admin' : 'QA Tester'
        }])

      if (profileError) throw profileError

      const { error: employeeError } = await supabase
        .from('employees')
        .insert([{
          profile_id: newUserId,
          email: staffForm.email,
          phone: staffForm.phone,
          role: staffForm.role
        }])

      if (employeeError) throw employeeError

      setFeedbackMsg(`Success. Account ${fullTrailheadId} created. Setup link sent via ${method.toUpperCase()}.`)
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
          preferred_gender: staffForm.preferredGender || null,
          spoken_languages: staffForm.spokenLanguages || null,
          position: staffForm.position || null,
          start_date: staffForm.startDate || null,
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
      preferredGender: selected.preferred_gender || '',
      spokenLanguages: selected.spoken_languages || '',
      position: selected.position || '',
      startDate: selected.start_date || '',
      assignedCamps: selected.assigned_camps || [],
      idSuffix: currentSuffix,
      email: '', 
      phone: '', 
      role: parsedRole,
      passphrase: generatePassphrase()
    })
    setIsCreatingStaff(false)
    setIsEditingStaff(true)
  }

  const labelStyle = { display: 'block', color: colors.muted, fontFamily: fonts.body, fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '4px', backgroundColor: '#fff', color: colors.textDark, border: `1px solid ${colors.muted}`, boxSizing: 'border-box', outline: 'none', fontFamily: fonts.body, fontSize: '15px' }
  const actionButtonStyle = { width: '100%', padding: '12px', border: 'none', borderRadius: '4px', fontFamily: fonts.body, fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px' }}>
        <SubNavButton icon={<List size={18} />} label="Directory" active={staffSubTab === 'directory'} onClick={() => setStaffSubTab('directory')} colors={colors} fonts={fonts} />
        <SubNavButton icon={<LayoutDashboard size={18} />} label="Dashboard" active={staffSubTab === 'dashboard'} onClick={() => setStaffSubTab('dashboard')} colors={colors} fonts={fonts} />
      </div>

      {staffSubTab === 'dashboard' && (
        <div>
          <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textLight, marginTop: 0, letterSpacing: '1px' }}>STAFF DASHBOARD</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '4px', border: `2px solid #0B140E`, boxShadow: '4px 4px 0px #0B140E' }}>
              <h3 style={{ margin: '0 0 10px 0', color: colors.textDark, fontFamily: fonts.header, fontSize: '24px' }}>NOTIFICATIONS</h3>
              <p style={{ color: colors.muted, fontSize: '14px', margin: 0 }}>No new system alerts at this time.</p>
            </div>
            <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '4px', border: `2px solid #0B140E`, boxShadow: '4px 4px 0px #0B140E' }}>
              <h3 style={{ margin: '0 0 10px 0', color: colors.textDark, fontFamily: fonts.header, fontSize: '24px' }}>REPORTS</h3>
              <p style={{ color: colors.muted, fontSize: '14px', margin: 0 }}>Staff performance and activity summaries will generate here.</p>
            </div>
          </div>
        </div>
      )}

      {staffSubTab === 'directory' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textLight, margin: '0 0 5px 0', letterSpacing: '1px' }}>STAFF DIRECTORY</h2>
              <p style={{ color: colors.muted, margin: 0, fontSize: '14px' }}>Manage system accounts and access tiers.</p>
            </div>
            <button 
              onClick={() => { resetStaffForm(); setIsCreatingStaff(true); }}
              style={{ backgroundColor: colors.highlight, color: colors.textLight, border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={16} /> ADD STAFF
            </button>
          </div>

          {feedbackMsg && (
            <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: feedbackMsg.includes('Error') ? colors.error : '#8A6D3B', color: colors.textDark, fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'bold', borderRadius: '4px' }}>
              {feedbackMsg}
            </div>
          )}

          {/* ACTION BAR WHEN ROW IS SELECTED */}
          {selectedStaffId && !isCreatingStaff && !isEditingStaff && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '4px', border: `1px solid ${colors.muted}` }}>
              <button 
                onClick={openEditForm} 
                style={{ backgroundColor: colors.primary, color: colors.textLight, border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit2 size={16} /> EDIT ACCOUNT
              </button>
              <button 
                onClick={() => setSelectedStaffId(null)} 
                style={{ backgroundColor: 'transparent', color: colors.textLight, border: `1px solid ${colors.muted}`, padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <X size={16} /> DESELECT
              </button>
            </div>
          )}

          {/* ADD / EDIT FORM */}
          {(isCreatingStaff || isEditingStaff) && (
            <div style={{ backgroundColor: colors.panel, padding: '25px', borderRadius: '4px', border: `2px solid ${colors.primary}`, boxShadow: '4px 4px 0px #0B140E', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, margin: 0 }}>
                  {isEditingStaff ? 'EDIT STAFF ACCOUNT' : 'CREATE NEW STAFF ACCOUNT'}
                </h3>
                <button onClick={resetStaffForm} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}><X size={20}/></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
                <div style={{ padding: '15px', border: `1px solid ${colors.muted}`, borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                  <label style={{ ...labelStyle, fontSize: '11px', textTransform: 'uppercase', marginBottom: '10px' }}>Identity Information</label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={labelStyle}>Prefix</label>
                      <input type="text" placeholder="Mr, Dr, etc." value={staffForm.prefix} onChange={(e) => setStaffForm({...staffForm, prefix: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>First Name</label>
                      <input type="text" value={staffForm.firstName} onChange={(e) => setStaffForm({...staffForm, firstName: e.target.value})} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={labelStyle}>Middle Name</label>
                      <input type="text" value={staffForm.middleName} onChange={(e) => setStaffForm({...staffForm, middleName: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input type="text" value={staffForm.lastName} onChange={(e) => setStaffForm({...staffForm, lastName: e.target.value})} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={labelStyle}>Suffix</label>
                      <input type="text" placeholder="Jr, III, etc." value={staffForm.suffix} onChange={(e) => setStaffForm({...staffForm, suffix: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Display Name</label>
                      <input type="text" placeholder="Optional" value={staffForm.displayName} onChange={(e) => setStaffForm({...staffForm, displayName: e.target.value})} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Preferred Gender</label>
                      <input type="text" placeholder="Open entry" value={staffForm.preferredGender} onChange={(e) => setStaffForm({...staffForm, preferredGender: e.target.value})} style={inputStyle} />
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

                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input type="date" value={staffForm.startDate} onChange={(e) => setStaffForm({...staffForm, startDate: e.target.value})} style={inputStyle} />
                </div>

                {/* DUAL LIST SELECTOR FOR CAMPS */}
                <div style={{ padding: '15px', border: `1px solid ${colors.muted}`, borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                  <label style={{ ...labelStyle, fontSize: '11px', textTransform: 'uppercase', marginBottom: '10px' }}>Assigned Properties (Click to Move)</label>
                  <div style={{ display: 'flex', gap: '10px', height: '180px' }}>
                    
                    <div style={{ flex: 1, border: `1px solid ${colors.muted}`, borderRadius: '4px', overflowY: 'auto', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '8px', backgroundColor: 'rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', borderBottom: `1px solid ${colors.muted}` }}>
                        Available
                      </div>
                      <div style={{ flex: 1, padding: '5px' }}>
                        {camps.filter(c => !staffForm.assignedCamps.includes(c.id)).map(camp => (
                          <div 
                            key={camp.id} 
                            onClick={() => handleAssignCamp(camp.id)} 
                            style={{ padding: '8px 10px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #eee', color: colors.textDark, display: 'flex', justifyContent: 'space-between', transition: 'background 0.1s' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {camp.name} <span>&rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ flex: 1, border: `2px solid ${colors.primary}`, borderRadius: '4px', overflowY: 'auto', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
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
                  <>
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

                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input type="email" value={staffForm.email} onChange={(e) => setStaffForm({...staffForm, email: e.target.value})} style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={labelStyle}>Phone Number</label>
                      <input type="tel" value={staffForm.phone} onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})} style={inputStyle} />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {isEditingStaff ? (
                     <button 
                       onClick={handleStaffUpdate} 
                       disabled={isLoading || staffForm.idSuffix.length !== 8}
                       style={{ ...actionButtonStyle, backgroundColor: colors.primary, color: colors.textLight, opacity: (isLoading || staffForm.idSuffix.length !== 8) ? 0.5 : 1 }}
                     >
                       <Check size={18} /> SAVE CHANGES
                     </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleStaffCreate('email')} 
                        disabled={isLoading || staffForm.idSuffix.length !== 8}
                        style={{ ...actionButtonStyle, backgroundColor: colors.primary, color: colors.textLight, opacity: (isLoading || staffForm.idSuffix.length !== 8) ? 0.5 : 1 }}
                      >
                        <Mail size={18} /> Send via Email
                      </button>
                      <button 
                        onClick={() => handleStaffCreate('sms')} 
                        disabled={isLoading || staffForm.idSuffix.length !== 8}
                        style={{ ...actionButtonStyle, backgroundColor: 'transparent', color: colors.textDark, border: `2px solid ${colors.textDark}`, opacity: (isLoading || staffForm.idSuffix.length !== 8) ? 0.5 : 1 }}
                      >
                        <Smartphone size={18} /> Send via Text
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DIRECTORY TABLE / LIST */}
          <div style={{ backgroundColor: 'white', borderRadius: '4px', border: `1px solid ${colors.muted}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '15px 20px', borderBottom: `2px solid ${colors.muted}`, backgroundColor: 'rgba(0,0,0,0.02)', fontFamily: fonts.utility, fontSize: '11px', fontWeight: 'bold', color: colors.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>
              <div>Employee Name</div>
              <div>Trailhead ID</div>
              <div>Access Tier</div>
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
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', 
                      padding: '15px 20px', borderBottom: `1px solid #eee`, cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(193, 83, 27, 0.1)' : 'white',
                      transition: 'background-color 0.1s'
                    }}
                  >
                    <div style={{ color: colors.textDark, fontWeight: 'bold', fontFamily: fonts.body, fontSize: '15px' }}>
                      {displayStr}
                    </div>
                    <div style={{ color: colors.muted, fontFamily: fonts.utility, fontSize: '13px' }}>
                      {staff.trailhead_id || 'NO-ID'}
                    </div>
                    <div>
                      <span style={{ backgroundColor: colors.highlight, color: colors.textLight, padding: '4px 8px', borderRadius: '2px', fontFamily: fonts.utility, fontSize: '10px', textTransform: 'uppercase' }}>
                        {staff.access_tier ? staff.access_tier.replace('_', ' ') : 'USER'}
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
        color: active ? colors.textLight : colors.muted,
        border: 'none', borderRadius: '20px', fontFamily: fonts.body,
        fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
        whiteSpace: 'nowrap', transition: 'all 0.2s'
      }}
    >
      {icon} {label}
    </button>
  )
}