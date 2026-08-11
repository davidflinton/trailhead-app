import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Database, Users, User, Search } from 'lucide-react'

export default function CustomerDatabase({ colors, fonts, isDarkMode }) {
  const [activeTab, setActiveTab] = useState('personnel')
  const [personnel, setPersonnel] = useState([])
  const [campers, setCampers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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

  const filteredPersonnel = personnel.filter(p => {
    const rawName = (p.name && p.name !== 'Imported Staff Member') ? p.name : ''
    const constructedName = `${p.first_name || ''} ${p.last_name || ''}`.trim()
    const fullName = constructedName || rawName || p.username || ''
    const email = p.email || ''
    const property = p.property_name || ''
    const term = searchTerm.toLowerCase()
    return fullName.toLowerCase().includes(term) || email.toLowerCase().includes(term) || property.toLowerCase().includes(term)
  })

  const filteredCampers = campers.filter(c => {
    const constructedName = `${c.first_name || ''} ${c.last_name || ''}`.trim()
    const fullName = constructedName || c.name || ''
    const property = c.property_name || ''
    const cabin = c.site_or_cabin || c.current_cabin || ''
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

  return (
    <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, color: colors.textDark, fontFamily: fonts.body }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', mdFlexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: fonts.header, fontSize: '32px', margin: '0 0 5px 0', color: colors.textDark, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database color={colors.primary} size={28} /> CUSTOMER DATABASE
          </h2>
          <p style={{ color: colors.muted, margin: 0, fontSize: '14px' }}>
            Centralized master repository for all customer personnel and camper records across properties.
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
                <th style={{ padding: '14px 16px' }}>Name / Identity</th>
                <th style={{ padding: '14px 16px' }}>Property / Camp</th>
                <th style={{ padding: '14px 16px' }}>Contact / Email</th>
                <th style={{ padding: '14px 16px' }}>Role / Cabin</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Status</th>
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
                    const constructedName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    const displayName = constructedName || (user.name !== 'Imported Staff Member' ? user.name : '') || 'Unnamed Personnel'
                    const displayProperty = user.property_name || 'Global / Unassigned'
                    const displayEmail = user.email || 'No email provided'
                    const displayRole = user.role || 'Staff'

                    return (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 'bold', color: colors.textDark }}>{displayName}</div>
                          <div style={{ fontSize: '11px', color: colors.muted, fontFamily: fonts.utility }}>ID: {user.trailhead_id || user.id.substring(0,8)}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: colors.textDark }}>{displayProperty}</td>
                        <td style={{ padding: '14px 16px', color: colors.muted, fontSize: '14px' }}>{displayEmail}</td>
                        <td style={{ padding: '14px 16px', color: colors.textDark, textTransform: 'capitalize' }}>{displayRole}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px', fontWeight: 'bold', backgroundColor: user.active !== false ? 'rgba(20, 83, 45, 0.2)' : 'rgba(220, 38, 38, 0.2)', color: user.active !== false ? '#22c55e' : '#ef4444', fontFamily: fonts.utility }}>
                            {user.active !== false ? 'ACTIVE' : 'DISABLED'}
                          </span>
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
                    const constructedName = `${camper.first_name || ''} ${camper.last_name || ''}`.trim()
                    const fullName = constructedName || camper.name || 'Unnamed Camper'
                    const displayCamp = camper.property_name || 'Assigned Camp'
                    const displayContact = camper.email || camper.phone || 'No contact info'
                    const displayCabin = camper.site_or_cabin || camper.current_cabin || 'Unassigned'

                    return (
                      <tr key={camper.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 'bold', color: colors.textDark }}>{fullName}</div>
                          <div style={{ fontSize: '11px', color: colors.muted, fontFamily: fonts.utility }}>ID: {camper.id.substring(0,8)}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: colors.textDark }}>{displayCamp}</td>
                        <td style={{ padding: '14px 16px', color: colors.muted, fontSize: '14px' }}>{displayContact}</td>
                        <td style={{ padding: '14px 16px', color: colors.textDark }}>Site/Cabin: {displayCabin}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px', fontWeight: 'bold', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', fontFamily: fonts.utility }}>
                            CAMPER
                          </span>
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
    </div>
  )
}