import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Search, Filter, Calendar, Users, MessageSquare, ArrowRight, Activity, MapPin } from 'lucide-react'

export default function Lobby({ profile, setCampData, setActiveTab }) {
  const [camps, setCamps] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const colors = { background: '#16281D', sidebar: '#0F1D14', panel: '#F1E8D0', textDark: '#24201A', textLight: '#F1E8D0', primary: '#C1531B', muted: '#6B6250', highlight: '#1E3524', border: '#0B140E' }
  const fonts = { header: "'Staatliches', sans-serif", body: "'Karla', sans-serif", utility: "'JetBrains Mono', monospace" }

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from('camps').select('*').order('name')
    if (data) setCamps(data)
    if (error) console.error("Error fetching properties:", error.message)
    setIsLoading(false)
  }

  const filteredCamps = camps.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))

  const handleSelect = (camp) => {
    setCampData(camp)
    setActiveTab('news')
  }

  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh', padding: '30px 40px', fontFamily: fonts.body }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* PMS Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontFamily: fonts.header, fontSize: '36px', color: colors.textLight, margin: '0 0 5px 0', letterSpacing: '2px' }}>
              GLOBAL OPERATIONS DASHBOARD
            </h1>
            <p style={{ color: colors.primary, margin: 0, fontSize: '16px', fontFamily: fonts.utility, textTransform: 'uppercase' }}>
              Multi-Property Overview & CRM
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ backgroundColor: colors.sidebar, padding: '15px 20px', borderRadius: '4px', border: `1px solid ${colors.highlight}`, minWidth: '150px' }}>
              <div style={{ color: colors.muted, fontSize: '12px', fontFamily: fonts.utility, marginBottom: '5px' }}>TOTAL PROPERTIES</div>
              <div style={{ color: colors.textLight, fontSize: '28px', fontFamily: fonts.header }}>{camps.length}</div>
            </div>
            <div style={{ backgroundColor: colors.sidebar, padding: '15px 20px', borderRadius: '4px', border: `1px solid ${colors.highlight}`, minWidth: '150px' }}>
              <div style={{ color: colors.muted, fontSize: '12px', fontFamily: fonts.utility, marginBottom: '5px' }}>NETWORK ALERTS</div>
              <div style={{ color: colors.primary, fontSize: '28px', fontFamily: fonts.header }}>0</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: colors.sidebar, padding: '15px', borderRadius: '4px', border: `1px solid ${colors.highlight}` }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color={colors.muted} style={{ position: 'absolute', left: '15px', top: '12px' }} />
            <input 
              type="text" 
              placeholder="Search properties by name or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 45px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: '#0A120D', color: colors.textLight, fontSize: '14px', outline: 'none', fontFamily: fonts.body }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', backgroundColor: colors.highlight, color: colors.textLight, border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '13px' }}>
            <Filter size={16} /> FILTER
          </button>
        </div>

        {/* Data Table */}
        <div style={{ backgroundColor: colors.panel, borderRadius: '4px', border: `2px solid ${colors.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: colors.sidebar, borderBottom: `2px solid ${colors.highlight}` }}>
                <th style={{ padding: '15px 20px', color: colors.muted, fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'normal' }}>PROPERTY NAME</th>
                <th style={{ padding: '15px 20px', color: colors.muted, fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'normal' }}>TYPE</th>
                <th style={{ padding: '15px 20px', color: colors.muted, fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'normal' }}>OCCUPANCY</th>
                <th style={{ padding: '15px 20px', color: colors.muted, fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'normal' }}>ARRIVALS (TODAY)</th>
                <th style={{ padding: '15px 20px', color: colors.muted, fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'normal' }}>UNREAD MSGS</th>
                <th style={{ padding: '15px 20px', color: colors.muted, fontFamily: fonts.utility, fontSize: '12px', fontWeight: 'normal', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: colors.primary, fontFamily: fonts.utility }}>Loading database records...</td>
                </tr>
              ) : filteredCamps.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: colors.muted, fontFamily: fonts.utility }}>No properties match your search.</td>
                </tr>
              ) : (
                filteredCamps.map((camp, idx) => (
                  <tr key={camp.id} style={{ borderBottom: idx === filteredCamps.length - 1 ? 'none' : `1px solid #D6CEBA`, transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5DCC0'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ color: colors.textDark, fontFamily: fonts.header, fontSize: '20px', letterSpacing: '1px' }}>{camp.name}</div>
                      <div style={{ color: colors.muted, fontFamily: fonts.utility, fontSize: '11px', marginTop: '2px' }}>ID: {camp.id.split('-')[0].toUpperCase()}</div>
                    </td>
                    
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#D6CEBA', padding: '4px 8px', borderRadius: '2px', fontSize: '11px', fontFamily: fonts.utility, textTransform: 'uppercase', color: colors.textDark }}>
                        <MapPin size={12} /> {camp.type ? camp.type.replace('_', ' ') : 'Standard'}
                      </span>
                    </td>
                    
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textDark }}>
                        <Activity size={16} color={colors.primary} />
                        <span style={{ fontFamily: fonts.utility, fontSize: '14px' }}>--- %</span>
                      </div>
                    </td>
                    
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textDark }}>
                        <Calendar size={16} color={colors.muted} />
                        <span style={{ fontFamily: fonts.utility, fontSize: '14px' }}>0</span>
                      </div>
                    </td>
                    
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textDark }}>
                        <MessageSquare size={16} color={colors.muted} />
                        <span style={{ fontFamily: fonts.utility, fontSize: '14px' }}>0</span>
                      </div>
                    </td>
                    
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleSelect(camp)}
                        style={{ backgroundColor: colors.primary, color: colors.textLight, border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        MANAGE <ArrowRight size={14} />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}