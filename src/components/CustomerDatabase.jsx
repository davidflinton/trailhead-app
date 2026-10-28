import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Database, Users, User, Search, FileText, Upload, X, Save, Phone, Mail, MapPin, Briefcase, ChevronDown, ChevronUp } from 'lucide-react'

export default function CustomerDatabase({ colors, fonts }) {
  const [activeTab, setActiveTab] = useState('personnel')
  const [personnel, setPersonnel] = useState([])
  const [campers, setCampers] = useState([])
  const [campNamesById, setCampNamesById] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedRecordType, setSelectedRecordType] = useState(null)
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

    const { data: campsData, error: campsError } = await supabase
      .from('camps')
      .select('id, name')

    if (campsError) console.error('Error fetching camp names:', campsError.message)
    else setCampNamesById(Object.fromEntries((campsData || []).map((camp) => [camp.id, camp.name])))

    setIsLoading(false)
  }

  function getDisplayName(user) {
    const normalizeNameValue = (value) => typeof value === 'string' ? value.trim() : ''
    const isGenericPlaceholder = (value) => {
      const cleanValue = normalizeNameValue(value)
      if (!cleanValue) return true
      const genericPatterns = [
        /^imported\s+staff\s+member(?:\s*#?\d+)?$/i,
        /^imported\s+user(?:\s*#?\d+)?$/i,
        /^unknown\s+user$/i,
        /^user(?:\s*#?\d+)?$/i,
        /^n\/?a$/i,
        /^null$/i,
        /^undefined$/i
      ]
      return genericPatterns.some((pattern) => pattern.test(cleanValue))
    }

    const fullNameCandidate = [
      user.prefix,
      user.first_name,
      user.middle_name,
      user.last_name,
      user.suffix
    ].filter(Boolean).join(' ').trim()

    const nameCandidates = [
      user.display_name,
      user.full_name,
      user.name,
      user.preferred_name,
      fullNameCandidate,
      user.username,
      user.user_name,
      user.email ? user.email.split('@')[0] : ''
    ]

    const validName = nameCandidates.find((value) => {
      const normalized = normalizeNameValue(value)
      return normalized !== '' && !isGenericPlaceholder(normalized)
    })

    return normalizeNameValue(validName) || 'Unnamed Record'
  }

  function handleOpenDetails(user) {
    setSelectedUser(user)
    setSelectedRecordType(activeTab)
    setUserForm(user)
    setUserDocuments([
      { id: '1', name: 'Agreement_Form.pdf', size: '180 KB', date: '2026-06-12' },
      { id: '2', name: 'Emergency_Contact.pdf', size: '110 KB', date: '2026-06-12' }
    ])
  }

  async function handleSaveUser() {
    if (!selectedUser || !selectedRecordType) return
    const tableName = selectedRecordType === 'personnel' ? 'customer_personnel' : 'customer_campers'
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
      setSelectedRecordType(null)
    }
  }

  const records = activeTab === 'personnel' ? personnel : campers
  const getDisplayAssignment = (record) => {
    const campName = record.camp_id ? campNamesById[record.camp_id] : ''
    return activeTab === 'personnel'
      ? record.property_assignment || record.property_name || 'Unassigned'
      : campName || record.property_name || (record.camp_id ? 'Camp assignment' : 'Unassigned')
  }
  const getDisplayLocation = (record) => activeTab === 'personnel'
    ? record.cabin_assignment || record.site_or_cabin || ''
    : record.cabin_assignment || record.site_or_cabin || record.current_cabin || ''
  const getDisplayEmail = (record, recordType = activeTab) => {
    const candidates = recordType === 'personnel'
      ? [record.work_email, record.personal_email, record.email]
      : [record.personal_email, record.email, record.work_email]
    return candidates.find((email) => (
      typeof email === 'string'
      && email.trim() !== ''
      && !/^no-email@placeholder\.com$/i.test(email.trim())
    )) || ''
  }
  const getDisplayPhone = (record, recordType = activeTab) => {
    const candidates = recordType === 'personnel'
      ? [record.work_phone, record.personal_phone, record.phone]
      : [record.personal_phone, record.phone, record.work_phone]
    return candidates.find((phone) => typeof phone === 'string' && phone.trim() !== '') || ''
  }
  const getDisplayRole = (record) => (
    activeTab === 'personnel'
      ? record.system_role || record.role || record.position_title || 'Staff'
      : record.camp_role || record.camper_role || 'Camper'
  ).replaceAll('_', ' ')
  const isRecordActive = (record) => {
    const status = (record.employment_status || record.status || '').trim().toLowerCase()
    return record.active !== false && !['disabled', 'inactive', 'terminated'].includes(status)
  }
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const roleOptions = [...new Set(records.map(getDisplayRole))].sort((a, b) => a.localeCompare(b))
  const activeRecords = records.filter(isRecordActive).length
  const filteredRecords = records
    .filter(record => {
      const email = getDisplayEmail(record)
      const role = getDisplayRole(record)
      const values = [
        getDisplayName(record),
        record.username || '',
        record.user_name || '',
        record.name || '',
        record.trailhead_id || record.id || '',
        email,
        getDisplayPhone(record),
        getDisplayAssignment(record),
        record.department || '',
        record.position_title || '',
        getDisplayLocation(record),
        record.assigned_team || '',
        record.camp_id || '',
        role,
        record.employment_status || record.status || ''
      ]
      const matchesSearch = !normalizedSearch || values.some(value => String(value).toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? isRecordActive(record) : !isRecordActive(record))
      const matchesRole = roleFilter === 'all' || role === roleFilter
      return matchesSearch && matchesStatus && matchesRole
    })
    .sort((a, b) => {
      const valueFor = (record) => {
        if (sortConfig.key === 'name') return getDisplayName(record)
        if (sortConfig.key === 'role') return getDisplayRole(record)
        if (sortConfig.key === 'property') return getDisplayAssignment(record)
        if (sortConfig.key === 'status') return isRecordActive(record) ? 'Active' : 'Disabled'
        return record.trailhead_id || record.id || ''
      }
      const result = valueFor(a).localeCompare(valueFor(b), undefined, { numeric: true, sensitivity: 'base' })
      return sortConfig.direction === 'asc' ? result : -result
    })

  function toggleSort(key) {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const tabButtonStyle = (isActive) => ({
    flex: 1,
    padding: '12px',
    backgroundColor: isActive ? colors.primary : colors.highlight,
    color: isActive ? colors.textOnPrimary : colors.textDark,
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
  const inputStyle = { width: '100%', height: '40px', boxSizing: 'border-box', padding: '0 12px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: colors.panel, color: colors.textDark, fontFamily: fonts.body, fontSize: '14px', outline: 'none' }
  const sectionHeaderStyle = { fontFamily: fonts.header, fontSize: '18px', color: colors.primary, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px', letterSpacing: '0.5px' }
  const filterButtonStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 13px',
    backgroundColor: isActive ? colors.highlight : 'transparent',
    color: isActive ? colors.textDark : colors.muted,
    border: `1px solid ${isActive ? colors.primary : colors.border}`,
    borderRadius: '6px', cursor: 'pointer', fontFamily: fonts.utility,
    fontSize: '12px', fontWeight: isActive ? 'bold' : 'normal', whiteSpace: 'nowrap'
  })
  const sortButton = (label, key) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0, border: 'none', background: 'none', color: colors.muted, font: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit', cursor: 'pointer' }}
    >
      {label}
      {sortConfig.key === key && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
    </button>
  )

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', color: colors.textDark, fontFamily: fonts.body, position: 'relative' }}>
      <div style={{ marginBottom: '20px', color: colors.muted, fontSize: '12px', fontFamily: fonts.utility, letterSpacing: '0.04em' }}>
        DIRECTORY <span style={{ padding: '0 7px' }}>/</span> CUSTOMER RECORDS
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 6px 0', color: colors.textDark, letterSpacing: '-0.02em' }}>
            <Database color={colors.primary} size={25} /> Customer Directory
          </h1>
          <p style={{ color: colors.muted, fontSize: '14px', margin: 0 }}>
            Search and manage customer personnel and camper records.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.muted, fontSize: '13px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.primary }} />
          Directory synced
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total records', value: records.length, detail: activeTab === 'personnel' ? 'Customer personnel' : 'Customer campers' },
          { label: 'Active', value: activeRecords, detail: 'Current directory records' },
          { label: 'Disabled', value: records.length - activeRecords, detail: 'Inactive or terminated' }
        ].map(stat => (
          <div key={stat.label} style={{ padding: '16px 18px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '8px' }}>
            <div style={{ color: colors.muted, fontSize: '12px', marginBottom: '7px' }}>{stat.label}</div>
            <div style={{ fontSize: '24px', lineHeight: 1.1, fontWeight: '600', color: colors.textDark }}>{isLoading ? '—' : stat.value}</div>
            <div style={{ color: colors.muted, fontSize: '11px', marginTop: '5px' }}>{stat.detail}</div>
          </div>
        ))}
      </div>

      {actionMessage && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: actionMessage.type === 'success' ? colors.highlight : 'rgba(220, 38, 38, 0.15)', border: `1px solid ${actionMessage.type === 'success' ? colors.primary : colors.error}`, color: colors.textDark }}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '16px' }}>&times;</button>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <button onClick={() => { setActiveTab('personnel'); setRoleFilter('all') }} style={tabButtonStyle(activeTab === 'personnel')}>
          <Users size={18} /> Customer Personnel ({personnel.length})
        </button>
        <button onClick={() => { setActiveTab('campers'); setRoleFilter('all') }} style={tabButtonStyle(activeTab === 'campers')}>
          <User size={18} /> Customer Campers ({campers.length})
        </button>
      </div>

      <div style={{ backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.18)' }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} role="group" aria-label="Filter customer records by status">
              {[
                { key: 'all', label: 'All records', count: records.length },
                { key: 'active', label: 'Active', count: activeRecords },
                { key: 'disabled', label: 'Disabled', count: records.length - activeRecords }
              ].map(filter => (
                <button key={filter.key} type="button" aria-pressed={statusFilter === filter.key} onClick={() => setStatusFilter(filter.key)} style={filterButtonStyle(statusFilter === filter.key)}>
                  {filter.label}<span style={{ color: statusFilter === filter.key ? colors.primary : colors.muted }}>{filter.count}</span>
                </button>
              ))}
            </div>
            <span style={{ color: colors.muted, fontSize: '12px' }}>
              {isLoading ? 'Loading directory…' : `${filteredRecords.length} of ${records.length} records`}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
              <Search size={17} color={colors.muted} style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                id="customer-directory-search"
                name="customerDirectorySearch"
                type="search"
                placeholder="Search name, email, ID, property, or role"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                style={{ ...inputStyle, paddingLeft: '38px', borderRadius: '6px' }}
              />
            </div>
            <select
              aria-label="Filter customer records by role"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '180px', cursor: 'pointer' }}
            >
              <option value="all">All roles</option>
              {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto', minHeight: '300px' }}>
          <table style={{ width: '100%', tableLayout: 'fixed', textAlign: 'left', borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: '24%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '21%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: colors.background }}>
                <th style={{ padding: '10px 8px', overflow: 'hidden' }}>{sortButton('Name', 'name')}</th>
                <th style={{ padding: '10px 8px', overflow: 'hidden' }}>{sortButton('Trailhead ID', 'id')}</th>
                <th style={{ padding: '10px 8px', overflow: 'hidden' }}>{sortButton('Role', 'role')}</th>
                <th style={{ padding: '10px 8px', overflow: 'hidden' }}>{sortButton(activeTab === 'personnel' ? 'Property' : 'Camp', 'property')}</th>
                <th style={{ padding: '10px 8px', overflow: 'hidden' }}>{sortButton('Status', 'status')}</th>
                <th style={{ padding: '10px 4px', textAlign: 'right', overflow: 'hidden' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: colors.muted }}>Loading customer records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: colors.muted }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '6px' }}>No records match these filters</div>
                    <div style={{ fontSize: '13px' }}>Try another search term or clear a filter.</div>
                    <button
                      type="button"
                      onClick={() => { setSearchTerm(''); setStatusFilter('all'); setRoleFilter('all') }}
                      style={{ marginTop: '14px', padding: '8px 12px', border: `1px solid ${colors.primary}`, borderRadius: '6px', background: 'transparent', color: colors.textDark, cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px' }}
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : filteredRecords.map(record => {
                const displayName = getDisplayName(record)
                const displayId = record.trailhead_id || record.id?.substring(0, 8) || 'N/A'
                const displayRole = getDisplayRole(record)
                const isActive = isRecordActive(record)
                const property = getDisplayAssignment(record)
                const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'
                const singleLineStyle = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

                return (
                  <tr key={`${activeTab}-${record.id}`} style={{ borderBottom: `1px solid ${colors.border}`, transition: 'background-color 0.15s' }}>
                    <td style={{ padding: '8px', overflow: 'hidden' }}>
                      <button type="button" onClick={() => handleOpenDetails(record)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minWidth: 0, padding: 0, border: 'none', background: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
                        <span aria-hidden="true" style={{ width: '38px', height: '38px', flex: '0 0 38px', display: 'grid', placeItems: 'center', borderRadius: '50%', backgroundColor: colors.highlight, color: colors.textDark, fontSize: '13px', fontWeight: 'bold' }}>{initials}</span>
                        <span style={{ minWidth: 0, fontSize: '13px', fontWeight: '600', color: colors.textDark, ...singleLineStyle }}>{displayName}</span>
                      </button>
                    </td>
                    <td style={{ padding: '8px', color: colors.muted, fontFamily: 'monospace', fontSize: '13px', ...singleLineStyle }} title={displayId}>{displayId}</td>
                    <td style={{ padding: '8px', color: colors.textDark, fontSize: '13px', fontWeight: '600', textTransform: 'capitalize', ...singleLineStyle }} title={displayRole}>{displayRole}</td>
                    <td style={{ padding: '8px', color: colors.textDark, fontSize: '13px', ...singleLineStyle }} title={property}>{property}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 9px', fontSize: '11px', borderRadius: '9999px', fontWeight: '600', backgroundColor: isActive ? colors.highlight : 'rgba(220, 38, 38, 0.15)', color: isActive ? colors.primary : colors.error, border: `1px solid ${isActive ? colors.primary : colors.error}` }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? colors.primary : colors.error }} />
                        {isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '4px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(record)}
                        style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', backgroundColor: colors.highlight, color: colors.textDark, cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', fontWeight: '600' }}
                        aria-label={`Edit ${displayName}`}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && records.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.border}`, color: colors.muted, fontSize: '12px' }}>
            Showing {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
          </div>
        )}
      </div>

      {/* FULL RECORD DETAILS & DOCUMENTS MODAL */}
      {selectedUser && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelectedUser(null); setSelectedRecordType(null) } }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div role="dialog" aria-modal="true" aria-labelledby="customer-record-title" style={{ backgroundColor: colors.sidebar, border: `1px solid ${colors.border}`, borderRadius: '12px', maxWidth: '960px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', color: colors.textDark, boxSizing: 'border-box' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, paddingBottom: '15px', marginBottom: '25px' }}>
              <div>
                <div style={{ color: colors.muted, fontSize: '11px', fontFamily: fonts.utility, letterSpacing: '0.06em', marginBottom: '5px' }}>DIRECTORY <span style={{ padding: '0 5px' }}>/</span> CUSTOMER PROFILE</div>
                <h3 id="customer-record-title" style={{ fontFamily: fonts.header, fontSize: '20px', margin: 0, color: colors.textDark, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeTab === 'personnel' ? 'Customer personnel details' : 'Customer camper details'}
                </h3>
              </div>
              <button type="button" aria-label="Close customer profile" onClick={() => { setSelectedUser(null); setSelectedRecordType(null) }} style={{ display: 'grid', placeItems: 'center', width: '36px', height: '36px', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.muted, cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', padding: '18px', marginBottom: '24px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '8px' }}>
              <span aria-hidden="true" style={{ width: '58px', height: '58px', flex: '0 0 58px', display: 'grid', placeItems: 'center', borderRadius: '50%', backgroundColor: colors.highlight, color: colors.textDark, fontSize: '18px', fontWeight: 'bold' }}>
                {getDisplayName(selectedUser).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'}
              </span>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '5px' }}>
                  <strong style={{ fontSize: '20px', color: colors.textDark }}>{getDisplayName(selectedUser)}</strong>
                  <span style={{ padding: '4px 8px', borderRadius: '9999px', backgroundColor: isRecordActive(selectedUser) ? colors.highlight : 'rgba(220, 38, 38, 0.15)', border: `1px solid ${isRecordActive(selectedUser) ? colors.primary : colors.error}`, color: isRecordActive(selectedUser) ? colors.primary : colors.error, fontSize: '11px', fontWeight: '600' }}>
                    {isRecordActive(selectedUser) ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div style={{ color: colors.muted, fontSize: '13px', overflowWrap: 'anywhere' }}>{getDisplayEmail(selectedUser, selectedRecordType) || 'No email provided'}</div>
                <div style={{ color: colors.muted, fontSize: '12px', marginTop: '5px', textTransform: 'capitalize' }}>
                  {getDisplayRole(selectedUser)} <span style={{ padding: '0 5px' }}>·</span> ID: {selectedUser.trailhead_id || selectedUser.id?.substring(0, 8) || 'N/A'}
                </div>
              </div>
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

                  {selectedRecordType === 'campers' && (
                    <>
                      <div style={fieldContainerStyle}>
                        <label style={labelStyle}>PREFERRED NAME</label>
                        <input type="text" value={userForm.preferred_name || ''} onChange={(e) => setUserForm({...userForm, preferred_name: e.target.value})} style={inputStyle} />
                      </div>
                      <div style={fieldContainerStyle}>
                        <label style={labelStyle}>DATE OF BIRTH</label>
                        <input type="date" value={userForm.date_of_birth || ''} onChange={(e) => setUserForm({...userForm, date_of_birth: e.target.value})} style={inputStyle} />
                      </div>
                      <div style={fieldContainerStyle}>
                        <label style={labelStyle}>PRONOUNS</label>
                        <input type="text" value={userForm.pronouns || ''} onChange={(e) => setUserForm({...userForm, pronouns: e.target.value})} style={inputStyle} />
                      </div>
                    </>
                  )}

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

                  {selectedRecordType === 'personnel' && (
                    <div style={fieldContainerStyle}>
                      <label style={labelStyle}>WORK PHONE</label>
                      <input type="text" value={userForm.work_phone || ''} onChange={(e) => setUserForm({...userForm, work_phone: e.target.value})} style={inputStyle} />
                    </div>
                  )}

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>PERSONAL EMAIL</label>
                    <input type="email" value={userForm.personal_email || ''} onChange={(e) => setUserForm({...userForm, personal_email: e.target.value})} style={inputStyle} />
                  </div>

                  {selectedRecordType === 'personnel' && (
                    <div style={fieldContainerStyle}>
                      <label style={labelStyle}>WORK EMAIL</label>
                      <input type="email" value={userForm.work_email || ''} onChange={(e) => setUserForm({...userForm, work_email: e.target.value})} style={inputStyle} />
                    </div>
                  )}

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

                  {selectedRecordType === 'campers' && (
                    <div style={fieldContainerStyle}>
                      <label style={labelStyle}>PRIMARY CONTACT RELATIONSHIP</label>
                      <input type="text" value={userForm.primary_emergency_contact_relationship || ''} onChange={(e) => setUserForm({...userForm, primary_emergency_contact_relationship: e.target.value})} style={inputStyle} />
                    </div>
                  )}

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>SECONDARY CONTACT NAME</label>
                    <input
                      type="text"
                      value={selectedRecordType === 'campers' ? userForm.emergency_contact_2_name || '' : userForm.secondary_emergency_contact_name || ''}
                      onChange={(e) => setUserForm({
                        ...userForm,
                        [selectedRecordType === 'campers' ? 'emergency_contact_2_name' : 'secondary_emergency_contact_name']: e.target.value
                      })}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label style={labelStyle}>SECONDARY CONTACT PHONE</label>
                    <input
                      type="text"
                      value={selectedRecordType === 'campers' ? userForm.emergency_contact_2_phone || '' : userForm.secondary_emergency_contact_phone || ''}
                      onChange={(e) => setUserForm({
                        ...userForm,
                        [selectedRecordType === 'campers' ? 'emergency_contact_2_phone' : 'secondary_emergency_contact_phone']: e.target.value
                      })}
                      style={inputStyle}
                    />
                  </div>

                  {selectedRecordType === 'campers' && (
                    <>
                      <div style={fieldContainerStyle}>
                        <label style={labelStyle}>THIRD CONTACT NAME</label>
                        <input type="text" value={userForm.emergency_contact_3_name || ''} onChange={(e) => setUserForm({...userForm, emergency_contact_3_name: e.target.value})} style={inputStyle} />
                      </div>
                      <div style={fieldContainerStyle}>
                        <label style={labelStyle}>THIRD CONTACT PHONE</label>
                        <input type="text" value={userForm.emergency_contact_3_phone || ''} onChange={(e) => setUserForm({...userForm, emergency_contact_3_phone: e.target.value})} style={inputStyle} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SECTION 4: EMPLOYMENT & SYSTEM ROLES */}
              <div>
                <h4 style={sectionHeaderStyle}>
                  <Briefcase size={18} />
                  {selectedRecordType === 'personnel' ? 'Employment & System Roles' : 'Camp Profile'}
                </h4>
                {selectedRecordType === 'personnel' ? (
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
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                    <div style={fieldContainerStyle}>
                      <label style={labelStyle}>CAMP ROLE</label>
                      <input type="text" value={userForm.camp_role || ''} onChange={(e) => setUserForm({...userForm, camp_role: e.target.value})} style={inputStyle} />
                    </div>
                    <div style={fieldContainerStyle}>
                      <label style={labelStyle}>STATUS</label>
                      <input type="text" value={userForm.employment_status || ''} onChange={(e) => setUserForm({...userForm, employment_status: e.target.value})} style={inputStyle} />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: PROPERTY & LOCATION ASSIGNMENTS */}
              <div>
                <h4 style={sectionHeaderStyle}><MapPin size={18} /> {selectedRecordType === 'personnel' ? 'Property & Location Assignments' : 'Camp & Cabin Assignment'}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  {selectedRecordType === 'personnel' ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div style={fieldContainerStyle}>
                        <label style={labelStyle}>CAMP</label>
                        <select
                          value={userForm.camp_id || ''}
                          onChange={(e) => setUserForm({...userForm, camp_id: e.target.value || null})}
                          style={inputStyle}
                        >
                          <option value="">Unassigned</option>
                          {Object.entries(campNamesById).map(([campId, campName]) => (
                            <option key={campId} value={campId}>{campName}</option>
                          ))}
                        </select>
                      </div>
                      <div style={fieldContainerStyle}>
                        <label style={labelStyle}>CABIN / SITE</label>
                        <input type="text" value={userForm.site_or_cabin || ''} onChange={(e) => setUserForm({...userForm, site_or_cabin: e.target.value})} style={inputStyle} />
                      </div>
                      <div style={fieldContainerStyle}>
                        <label style={labelStyle}>TEAM</label>
                        <input type="text" value={userForm.assigned_team || ''} onChange={(e) => setUserForm({...userForm, assigned_team: e.target.value})} style={inputStyle} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {selectedRecordType === 'campers' && (
                <div>
                  <h4 style={sectionHeaderStyle}><FileText size={18} /> Camper Notes & Photo</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                    <div style={fieldContainerStyle}>
                      <label style={labelStyle}>PHOTO URL</label>
                      <input type="url" value={userForm.photo_url || ''} onChange={(e) => setUserForm({...userForm, photo_url: e.target.value})} style={inputStyle} />
                    </div>
                    <div style={{ ...fieldContainerStyle, gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>MEDICAL NOTES</label>
                      <textarea value={userForm.medical_notes || ''} onChange={(e) => setUserForm({...userForm, medical_notes: e.target.value})} style={{ ...inputStyle, minHeight: '90px', height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* SHAREPOINT-STYLE USER DOCUMENTS REPOSITORY */}
            <div style={{ borderTop: `2px solid ${colors.border}`, paddingTop: '20px', marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ fontFamily: fonts.header, fontSize: '18px', margin: 0, color: colors.textDark, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={18} color={colors.primary} /> User Documents & Repository
                </h4>
                <label style={{ backgroundColor: colors.highlight, color: colors.textDark, padding: '8px 14px', borderRadius: '6px', fontFamily: fonts.utility, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={14} /> Upload Document
                  <input type="file" style={{ display: 'none' }} onChange={(e) => {
                    if (e.target.files[0]) {
                      const newDoc = { id: Date.now().toString(), name: e.target.files[0].name, size: '142 KB', date: new Date().toISOString().split('T')[0] }
                      setUserDocuments([...userDocuments, newDoc])
                    }
                  }} />
                </label>
              </div>

              <div style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', minHeight: '100px' }}>
                {userDocuments.length === 0 ? (
                  <div style={{ textAlign: 'center', color: colors.muted, fontSize: '13px', padding: '20px', fontFamily: fonts.utility }}>No documents uploaded for this entry yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userDocuments.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '6px' }}>
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
              <button onClick={() => { setSelectedUser(null); setSelectedRecordType(null) }} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: colors.textDark, border: `1px solid ${colors.muted}`, borderRadius: '6px', fontFamily: fonts.header, fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveUser} style={{ padding: '10px 24px', backgroundColor: colors.primary, color: colors.textOnPrimary, border: 'none', borderRadius: '6px', fontFamily: fonts.header, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={16} /> Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}