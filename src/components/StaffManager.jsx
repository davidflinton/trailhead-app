import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Mail, Smartphone, Dices, RefreshCw, LayoutDashboard, UserPlus, List } from 'lucide-react'

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
  const [staffSubTab, setStaffSubTab] = useState('dashboard')
  const [activeStaff, setActiveStaff] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState(null)

  const [staffForm, setStaffForm] = useState({
    prefix: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    displayName: '',
    preferredGender: '',
    spokenLanguages: '',
    idSuffix: generateRandomIdSuffix(),
    email: '',
    phone: '',
    role: 'QA Tester',
    passphrase: generatePassphrase()
  })

  useEffect(() => {
    fetchStaffDirectory()
  }, [])

  const fetchStaffDirectory = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('access_tier', ['global_superadmin', 'global_admin', 'QA Tester'])
      
      if (error) throw error
      setActiveStaff(data || [])
    } catch (error) {
      console.error("Failed to load staff:", error.message)
    }
  }

  const handleIdSuffixChange = (e) => {
    const charMap = { 'B': '8', 'G': '6', 'I': '1', 'O': '0', 'S': '5', 'Z': '2' }
    let raw = e.target.value.toUpperCase()
    let corrected = raw.replace(/[BGIOSZ]/g, match => charMap[match])
    corrected = corrected.replace(/[^0-9ACDEFHJKLMNPQRTUVWXY]/g, '')
    setStaffForm({ ...staffForm, idSuffix: corrected.substring(0, 8) })
  }

  const handleStaffCreate = async (method) => {
    setIsLoading(true)
    setFeedbackMsg(null)

    const fullTrailheadId = `${getRolePrefix(staffForm.role)}${staffForm.idSuffix}`
    const authEmail = `${fullTrailheadId.toLowerCase()}@trailhead.local`

    try {
      // Calling the new Edge Function to bypass the forced logout
      const { data: authData, error: authError } = await supabase.functions.invoke('create-admin-user', {
        body: { email: authEmail, password: staffForm.passphrase }
      })

      if (authError) throw authError
      const newUserId = authData.user.id

      const { error: profileError } = await supabase
        .from('profiles')
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
      
      setStaffForm({ 
        prefix: '', firstName: '', middleName: '', lastName: '', suffix: '', 
        displayName: '', preferredGender: '', spokenLanguages: '', 
        idSuffix: generateRandomIdSuffix(), email: '', phone: '', 
        role: 'QA Tester', passphrase: generatePassphrase() 
      })
      fetchStaffDirectory()

    } catch (error) {
      setFeedbackMsg(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const labelStyle = { display: 'block', color: colors.muted, fontFamily: fonts.body, fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '4px', backgroundColor: '#fff', color: colors.textDark, border: `1px solid ${colors.muted}`, boxSizing: 'border-box', outline: 'none', fontFamily: fonts.body, fontSize: '15px' }
  const actionButtonStyle = { width: '100%', padding: '12px', border: 'none', borderRadius: '4px', fontFamily: fonts.body, fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px' }}>
        <SubNavButton icon={<LayoutDashboard size={18} />} label="Dashboard" active={staffSubTab === 'dashboard'} onClick={() => setStaffSubTab('dashboard')} colors={colors} fonts={fonts} />
        <SubNavButton icon={<UserPlus size={18} />} label="Create" active={staffSubTab === 'create'} onClick={() => setStaffSubTab('create')} colors={colors} fonts={fonts} />
        <SubNavButton icon={<List size={18} />} label="Roster" active={staffSubTab === 'roster'} onClick={() => setStaffSubTab('roster')} colors={colors} fonts={fonts} />
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

      {staffSubTab === 'create' && (
        <div>
          <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textLight, marginTop: 0, letterSpacing: '1px' }}>CREATE STAFF</h2>
          
          <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '4px', border: `2px solid #0B140E`, boxShadow: '4px 4px 0px #0B140E' }}>
            
            {feedbackMsg && (
              <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: feedbackMsg.includes('Error') ? colors.error : '#8A6D3B', color: colors.textDark, fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'bold', borderRadius: '4px' }}>
                {feedbackMsg}
              </div>
            )}

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

              <div>
                <label style={labelStyle}>System Role</label>
                <select value={staffForm.role} onChange={(e) => setStaffForm({...staffForm, role: e.target.value})} style={inputStyle}>
                  <option value="QA Tester">QA Tester</option>
                  <option value="Global Admin">Global Admin</option>
                  <option value="Global Superadmin">Global Superadmin</option>
                </select>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {staffSubTab === 'roster' && (
        <div>
          <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textLight, marginTop: 0, letterSpacing: '1px' }}>ACTIVE ROSTER</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeStaff.length === 0 ? (
              <div style={{ backgroundColor: colors.highlight, color: colors.textLight, padding: '20px', borderRadius: '4px', textAlign: 'center', fontFamily: fonts.utility, fontSize: '12px' }}>
                No staff records found in the database.
              </div>
            ) : (
              activeStaff.map((staff) => {
                const displayStr = staff.display_name || `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unknown User'
                return (
                  <StaffCard 
                    key={staff.id}
                    name={displayStr} 
                    id={staff.trailhead_id || 'NO-ID'} 
                    role={staff.access_tier} 
                    colors={colors} 
                    fonts={fonts} 
                  />
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

function StaffCard({ name, id, role, colors, fonts }) {
  return (
    <div style={{ backgroundColor: colors.panel, padding: '15px', borderRadius: '4px', border: `2px solid #0B140E`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, letterSpacing: '1px' }}>{name}</div>
        <div style={{ fontFamily: fonts.utility, fontSize: '11px', color: colors.muted, textTransform: 'uppercase', marginTop: '2px' }}>
          ID: {id}
        </div>
      </div>
      <div style={{ backgroundColor: colors.highlight, color: colors.textLight, padding: '4px 8px', borderRadius: '2px', fontFamily: fonts.utility, fontSize: '10px', textTransform: 'uppercase', textAlign: 'center' }}>
        {role}
      </div>
    </div>
  )
}