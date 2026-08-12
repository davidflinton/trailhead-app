import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Database, Users, User, Search, MoreVertical, FileText, Upload, X, Save, Shield, Phone, Mail, MapPin, Briefcase } from 'lucide-react'

export default function CustomerDatabase({ colors, fonts, isDarkMode }) {
  const [activeTab, setActiveTab] = useState('personnel')
  const [personnel, setPersonnel] = useState([])
  const [campers, setCampers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userForm, setUserForm] = useState({})
  const [userDocuments, setUserDocuments] = useState([])
  const [actionMessage, setActionMessage] = useState(null)

  useEffect(() => {
    fetchCustomerData()
  }, [])

  async function fetchCustomerData() {
    setIsLoading(true)
    const { data: personnelData, error: personnelError } = await supabase
      .from('customer_personnel')
      .select('*')
      .order('created_at', { ascending: false })

    if (personnelError) console.error("Error fetching customer personnel:", personnelError.message)
    else setPersonnel(personnelData || [])

    const { data: campersData, error: campersError } = await supabase
      .from('customer_campers')
      .select('*')
      .order('created_at', { ascending: false })

    if (campersError) console.error("Error fetching customer campers:", campersError.message)
    else setCampers(campersData || [])

    setIsLoading(false)
  }

  function getDisplayName(user) {
    if (user.display_name && user.display_name.trim() !== '') {
      return user.display_name;
    }
    const standardName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    if (standardName) return standardName;
    return user.name || 'Unnamed Record';
  }

  function handleOpenDetails(user) {
    setSelectedUser(user)
    setUserForm(user)
    setActiveMenuId(null)
    setUserDocuments([
      { id: '1', name: 'Agreement_Form.pdf', size: '180 KB', date: '2026-06-12' },
      { id: '2', name: 'Emergency_Contact.pdf', size: '110 KB', date: '2026-06-12' }
    ])
  }

  async function handleSaveUser() {
    if (!selectedUser) return
    const tableName = activeTab === 'personnel' ? 'customer_personnel' : 'customer_campers'
    const { error } = await supabase
      .from(tableName)
      .update(userForm)
      .eq('id', selectedUser.id)

    if (error) {
      setActionMessage({ type: 'error', text: 'Failed to update record: ' + error.message })
    } else {
      setActionMessage({ type: 'success', text: 'Record updated successfully.' })
      fetchCustomerData()
      setSelectedUser(null)
    }
  }

  const filteredPersonnel = personnel.filter(p => {
    const fullName = getDisplayName(p)
    const email = p.work_email || p.personal_email || p.email || ''
    const property = p.property_assignment || p.property_name || ''
    const term = searchTerm.toLowerCase()
    return fullName.toLowerCase().includes(term) || email.toLowerCase().includes(term) || property.toLowerCase().includes(term)
  })

  const filteredCampers = campers.filter(c => {
    const fullName = getDisplayName(c)
    const property = c.property_assignment || c.property_name || ''
    const cabin = c.cabin_assignment || c.site_or_cabin || ''
    const term = searchTerm.toLowerCase()
    return fullName.toLowerCase().includes(term) || property.toLowerCase().includes(term) || cabin.toLowerCase().includes(term)
  })

  const tabButtonStyle = (isActive) => ({
    flex: 1,
    padding: '12px',
    backgroundColor: isActive ? colors.primary : (isDarkMode ? '#0F1D14' : '#F8F8F8'),
    color: isActive ? '#FFF' : colors.textDark,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    fontFamily: fonts.header,
    fontSize: '16px',
    cursor: 'pointer',
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  })

  // Reusable Form Field Style Helpers
  const fieldContainerStyle = { display: 'flex', flexDirection: 'column', gap: '6px' }
  const labelStyle = { display: 'block', fontSize: '11px', fontFamily: fonts.utility, color: colors.muted, fontWeight: 'bold', letterSpacing: '0.5px' }
  const inputStyle = { width: '100%', height: '40px', boxSizing: 'border-box', padding: '0 12px', borderRadius: '6px', border: `1px solid ${colors.muted}`, backgroundColor: isDarkMode ? '#111' : '#FFF', color: colors.textDark, fontFamily: fonts.body, fontSize: '14px', outline: 'none' }
  const sectionHeaderStyle = { fontFamily: fonts.header, fontSize: '18px', color: colors.primary, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px', letterSpacing: '0.5px' }

  return (
    <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, color: colors.textDark, fontFamily: fonts.body, position: 'relative' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: fonts.header, fontSize: '32px', margin: '0 0 5px 0', color: colors.textDark, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database color={colors.primary} size={28} /> CUSTOMER DATABASE
          </h2>
          <p style={{ color: colors.muted, margin: 0, fontSize: '14px' }}>
            Centralized master repository utilizing uniform identity and directory fields across all records.
          </p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={18} color={colors.muted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input 
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 10px 10px 40px', borderRadius: '8px', border: `1px solid ${colors.muted}`, backgroundColor: isDarkMode ? '#111' : 'white', color: colors.textDark, fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>

      {actionMessage && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: actionMessage.type === 'success' ? 'rgba(20, 83, 45, 0.4)' : 'rgba(220, 38, 38, 0.4)', border: `1px solid ${actionMessage.type === 'success' ? '#14532d' : '#dc2626'}`, color: '#F1E8D0' }}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', color: '#8A9A8F', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '15px', marginBottom: '24px' }}>
        <button onClick={() => setActiveTab('personnel')} style={tabButtonStyle(activeTab === 'personnel')}>
          <Users size={18} /> Customer Personnel ({personnel.length})
        </button>
        <button onClick={() => setActiveTab('campers')} style={tabButtonStyle(activeTab === 'campers')}>
          <User size={18} /> Customer Campers ({campers.length})
        </button>
      </div>

      <div style={{ backgroundColor: isDarkMode ? '#070C08' : 'white', border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', minHeight: '350px' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}`, color: colors.muted, fontSize: '12px', textTransform: 'uppercase', fontFamily: fonts.utility, backgroundColor: isDarkMode ? '#0F1D14' : '#F2F2F2' }}>
                <th style={{ padding: '14px 16px' }}>Display Name / Identity</th>
                <th style={{ padding: '14px 16px' }}>Property Assignment</th>
                <th style={{ padding: '14px 16px' }}>Contact / Emails</th>
                <th style={{ padding: '14px 16px' }}>Role / Status / Location</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: colors.muted, fontFamily: fonts.utility }}>Loading database records...</td>
                </tr>
              ) : activeTab === 'personnel' ? (
                filteredPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: colors.muted }}>No customer personnel records found.</td>
                  </tr>
                ) : (
                  filteredPersonnel.map(user => {
                    const displayName = getDisplayName(user);
                    const displayProperty = user.property_assignment || user.property_name || 'Unassigned'
                    const displayEmail = user.work_email || user.personal_email || user.email || 'No email provided'
                    const displayRole = user.system_role || user.role || 'Staff'

                    return (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 'bold', color: colors.textDark }}>{displayName}</div>
                          <div style={{ fontSize: '11px', color: colors.muted, fontFamily: fonts.utility }}>ID: {user.trailhead_id || user.id.substring(0,8)}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: colors.textDark }}>{displayProperty}</td>
                        <td style={{ padding: '14px 16px', color: colors.muted, fontSize: '14px' }}>{displayEmail}</td>
                        <td style={{ padding: '14px 16px', color: colors.textDark }}>
                          <div style={{ textTransform: 'capitalize' }}>{displayRole.replace('_', ' ')}</div>
                          <div style={{ fontSize: '11px', color: colors.muted, fontFamily: fonts.utility }}>Dept: {user.department || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)}
                            style={{ padding: '6px', background: 'none', border: 'none', borderRadius: '8px', color: colors.muted, cursor: 'pointer' }}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {activeMenuId === user.id && (
                            <div style={{ position: 'absolute', right: '24px', top: '48px', width: '160px', backgroundColor: isDarkMode ? '#070C08' : '#FFF', border: `1px solid ${colors.border}`, borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', padding: '6px 0', zIndex: 50, textAlign: 'left' }}>
                              <button
                                onClick={() => handleOpenDetails(user)}
                                style={{ width: '100%', padding: '8px 16px', fontSize: '13px', color: colors.textDark, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                              >
                                <FileText size={14} color={colors.primary} /> View Details
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )
              ) : (
                filteredCampers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: colors.muted }}>No camper records found.</td>
                  </tr>
                ) : (
                  filteredCampers.map(camper => {
                    const fullName = getDisplayName(camper);
                    const displayCamp = camper.property_assignment || camper.property_name || 'Assigned Camp'
                    const displayContact = camper.personal_email || camper.email || camper.personal_phone || 'No contact info'
                    const locationInfo = `Cabin: ${camper.cabin_assignment || camper.site_or_cabin || 'Unassigned'}`

                    return (
                      <tr key={camper.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 'bold', color: colors.textDark }}>{fullName}</div>
                          <div style={{ fontSize: '11px', color: colors.muted, fontFamily: fonts.utility }}>ID: {camper.trailhead_id || camper.id.substring(0,8)}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: colors.textDark }}>{displayCamp}</td>
                        <td style={{ padding: '14px 16px', color: colors.muted, fontSize: '14px' }}>{displayContact}</td>
                        <td style={{ padding: '14px 16px', color: colors.textDark, fontSize: '13px' }}>{locationInfo}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === camper.id ? null : camper.id)}
                            style={{ padding: '6px', background: 'none', border: 'none', borderRadius: '8px', color: colors.muted, cursor: 'pointer' }}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {activeMenuId === camper.id && (
                            <div style={{ position: 'absolute', right: '24px', top: '48px', width: '160px', backgroundColor: isDarkMode ? '#070C08' : '#FFF', border: `1px solid ${colors.border}`, borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', padding: '6px 0', zIndex: 50, textAlign: 'left' }}>
                              <button
                                onClick={() => handleOpenDetails(camper)}
                                style={{ width: '100%', padding: '8px 16px', fontSize: '13px', color: colors.textDark, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                              >
                                <FileText size={14} color={colors.primary} /> View Details
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL RECORD DETAILS & DOCUMENTS MODAL */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: isDarkMode ? '#070C08' : '#FFF', border: `2px solid ${colors.primary}`, borderRadius: '16px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', color: colors.textDark, boxSizing: 'border-box' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, paddingBottom: '15px', marginBottom: '25px' }}>
              <h3 style={{ fontFamily: fonts.header, fontSize: '24px', margin: 0, color: colors.textDark, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText color={colors.primary} /> Record Profile & Directory Details
              </h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* FORM SECTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* SECTION 1: IDENTITY & NAMES */}
              <div>
                <h4 style={sectionHeaderStyle}><User size={18} /> Identity & Names</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                  
                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PREFIX</label>
                    <select value={userForm.prefix || ''} onChange={(e) => setUserForm({...userForm, prefix: e.target.value})} style={inputStyle}>
                      <option value="">Select Prefix</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Rev.">Rev.</option>
                    </select>
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>FIRST NAME</label>
                    <input type="text" value={userForm.first_name || ''} onChange={(e) => setUserForm({...userForm, first_name: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>MIDDLE NAME</label>
                    <input type="text" value={userForm.middle_name || ''} onChange={(e) => setUserForm({...userForm, middle_name: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>LAST NAME</label>
                    <input type="text" value={userForm.last_name || ''} onChange={(e) => setUserForm({...userForm, last_name: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>SUFFIX</label>
                    <select value={userForm.suffix || ''} onChange={(e) => setUserForm({...userForm, suffix: e.target.value})} style={inputStyle}>
                      <option value="">Select Suffix</option>
                      <option value="Jr.">Jr.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                      <option value="Ph. D.">Ph. D.</option>
                      <option value="M.D.">M.D.</option>
                      <option value="D.D.S.">D.D.S.</option>
                      <option value="Esq.">Esq.</option>
                    </select>
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>DISPLAY NAME</label>
                    <input type="text" value={userForm.display_name || ''} onChange={(e) => setUserForm({...userForm, display_name: e.target.value})} style={inputStyle} placeholder="Auto: First Last" />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>TRAILHEAD ID</label>
                    <input type="text" value={userForm.trailhead_id || ''} onChange={(e) => setUserForm({...userForm, trailhead_id: e.target.value})} style={inputStyle} />
                  </div>

                </div>
              </div>

              {/* SECTION 2: CONTACT INFORMATION */}
              <div>
                <h4 style={sectionHeaderStyle}><Mail size={18} /> Contact Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  
                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PERSONAL PHONE</label>
                    <input type="text" value={userForm.personal_phone || ''} onChange={(e) => setUserForm({...userForm, personal_phone: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>WORK PHONE</label>
                    <input type="text" value={userForm.work_phone || ''} onChange={(e) => setUserForm({...userForm, work_phone: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PERSONAL EMAIL</label>
                    <input type="email" value={userForm.personal_email || ''} onChange={(e) => setUserForm({...userForm, personal_email: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>WORK EMAIL</label>
                    <input type="email" value={userForm.work_email || ''} onChange={(e) => setUserForm({...userForm, work_email: e.target.value})} style={inputStyle} />
                  </div>

                </div>
              </div>

              {/* SECTION 3: EMERGENCY CONTACTS */}
              <div>
                <h4 style={sectionHeaderStyle}><Phone size={18} /> Emergency Contacts</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  
                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PRIMARY CONTACT NAME</label>
                    <input type="text" value={userForm.primary_emergency_contact_name || ''} onChange={(e) => setUserForm({...userForm, primary_emergency_contact_name: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PRIMARY CONTACT PHONE</label>
                    <input type="text" value={userForm.primary_emergency_contact_phone || ''} onChange={(e) => setUserForm({...userForm, primary_emergency_contact_phone: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>SECONDARY CONTACT NAME</label>
                    <input type="text" value={userForm.secondary_emergency_contact_name || ''} onChange={(e) => setUserForm({...userForm, secondary_emergency_contact_name: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>SECONDARY CONTACT PHONE</label>
                    <input type="text" value={userForm.secondary_emergency_contact_phone || ''} onChange={(e) => setUserForm({...userForm, secondary_emergency_contact_phone: e.target.value})} style={inputStyle} />
                  </div>

                </div>
              </div>

              {/* SECTION 4: EMPLOYMENT & SYSTEM ROLES */}
              <div>
                <h4 style={sectionHeaderStyle}><Briefcase size={18} /> Employment & System Roles</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  
                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>START DATE</label>
                    <input type="date" value={userForm.start_date || ''} onChange={(e) => setUserForm({...userForm, start_date: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>EMPLOYMENT TYPE</label>
                    <select value={userForm.employment_type || ''} onChange={(e) => setUserForm({...userForm, employment_type: e.target.value})} style={inputStyle}>
                      <option value="">Select Type</option>
                      <option value="FT">FT</option>
                      <option value="PT">PT</option>
                      <option value="Contract">Contract</option>
                      <option value="Seasonal">Seasonal</option>
                      <option value="Volunteer">Volunteer</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>EMPLOYMENT STATUS</label>
                    <select value={userForm.employment_status || ''} onChange={(e) => setUserForm({...userForm, employment_status: e.target.value})} style={inputStyle}>
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Disabled">Disabled</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>SYSTEM ROLE</label>
                    <select value={userForm.system_role || ''} onChange={(e) => setUserForm({...userForm, system_role: e.target.value})} style={inputStyle}>
                      <option value="">Select Role</option>
                      <option value="Global Superadmin">Global Superadmin</option>
                      <option value="Global Admin">Global Admin</option>
                      <option value="Camp Superadmin">Camp Superadmin</option>
                      <option value="Camp Admin">Camp Admin</option>
                      <option value="Camp Staff">Camp Staff</option>
                      <option value="Camp Volunteer">Camp Volunteer</option>
                      <option value="Camper">Camper</option>
                      <option value="Youth Camper">Youth Camper</option>
                    </select>
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>POSITION TITLE</label>
                    <input type="text" value={userForm.position_title || ''} onChange={(e) => setUserForm({...userForm, position_title: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>DEPARTMENT</label>
                    <input type="text" value={userForm.department || ''} onChange={(e) => setUserForm({...userForm, department: e.target.value})} style={inputStyle} />
                  </div>

                </div>
              </div>

              {/* SECTION 5: PROPERTY & LOCATION ASSIGNMENTS */}
              <div>
                <h4 style={sectionHeaderStyle}><MapPin size={18} /> Property & Location Assignments</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  
                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PROPERTY ASSIGNMENT</label>
                    <input type="text" value={userForm.property_assignment || ''} onChange={(e) => setUserForm({...userForm, property_assignment: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>CABIN ASSIGNMENT</label>
                    <input type="text" value={userForm.cabin_assignment || ''} onChange={(e) => setUserForm({...userForm, cabin_assignment: e.target.value})} style={inputStyle} />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>LOT ASSIGNMENT</label>
                    <input type="text" value={userForm.lot_assignment || ''} onChange={(e) => setUserForm({...userForm, lot_assignment: e.target.value})} style={inputStyle} />
                  </div>

                </div>
              </div>

            </div>

            {/* SHAREPOINT-STYLE USER DOCUMENTS REPOSITORY */}
            <div style={{ borderTop: `2px solid ${colors.border}`, paddingTop: '20px', marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ fontFamily: fonts.header, fontSize: '18px', margin: 0, color: colors.textDark, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={18} color={colors.primary} /> User Documents & Repository
                </h4>
                <label style={{ backgroundColor: colors.highlight, color: '#FFF', padding: '8px 14px', borderRadius: '6px', fontFamily: fonts.utility, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={14} /> Upload Document
                  <input type="file" style={{ display: 'none' }} onChange={(e) => {
                    if (e.target.files[0]) {
                      const newDoc = { id: Date.now().toString(), name: e.target.files[0].name, size: '142 KB', date: new Date().toISOString().split('T')[0] }
                      setUserDocuments([...userDocuments, newDoc])
                    }
                  }} />
                </label>
              </div>

              <div style={{ backgroundColor: isDarkMode ? '#111' : '#F9F9F9', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', minHeight: '100px' }}>
                {userDocuments.length === 0 ? (
                  <div style={{ textAlign: 'center', color: colors.muted, fontSize: '13px', padding: '20px', fontFamily: fonts.utility }}>No documents uploaded for this entry yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userDocuments.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: isDarkMode ? '#16281D' : '#FFF', border: `1px solid ${colors.border}`, borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={16} color={colors.primary} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: colors.textDark }}>{doc.name}</div>
                            <div style={{ fontSize: '11px', color: colors.muted, fontFamily: fonts.utility }}>Size: {doc.size} | Uploaded: {doc.date}</div>
                          </div>
                        </div>
                        <button onClick={() => setUserDocuments(userDocuments.filter(d => d.id !== doc.id))} style={{ background: 'none', border: 'none', color: colors.error, cursor: 'pointer', fontSize: '12px', fontFamily: fonts.utility }}>Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px', borderTop: `1px solid ${colors.border}`, paddingTop: '20px' }}>
              <button onClick={() => setSelectedUser(null)} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: colors.textDark, border: `1px solid ${colors.muted}`, borderRadius: '6px', fontFamily: fonts.header, fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveUser} style={{ padding: '10px 24px', backgroundColor: colors.primary, color: '#FFF', border: 'none', borderRadius: '6px', fontFamily: fonts.header, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={16} /> Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}