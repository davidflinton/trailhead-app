import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Shield, User, Star } from 'lucide-react'

export default function AdminTab({ profile, campData, colors, fonts }) {
  const [directory, setDirectory] = useState([]); const [filter, setFilter] = useState('all'); const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { if (campData?.id) fetchDirectory() }, [campData])

  const fetchDirectory = async () => {
    setIsLoading(true)
    const { data: campers } = await supabase.from('campers').select('*').eq('camp_id', campData.id)
    const { data: campPersonnel } = await supabase.from('camp_personnel').select('*').eq('camp_id', campData.id)
    const { data: trailheadPersonnel } = await supabase.from('trailhead_personnel').select('*').eq('camp_id', campData.id)

    const formatCampers = (campers || []).map(c => ({ ...c, entityType: 'camper', displayRole: c.camp_role || 'Camper' }))
    const formatCampPersonnel = (campPersonnel || []).map(s => ({ ...s, entityType: 'camp_staff', displayRole: s.camp_role || 'Camp Staff' }))
    const formatTrailhead = (trailheadPersonnel || []).map(e => ({ ...e, entityType: 'hq_staff', displayRole: e.job_title || 'Trailhead HQ' }))

    const combined = [...formatCampers, ...formatCampPersonnel, ...formatTrailhead].sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
    setDirectory(combined); setIsLoading(false)
  }

  const filtered = directory.filter(user => {
    if (filter === 'staff') return user.entityType === 'camp_staff' || user.entityType === 'hq_staff'
    if (filter === 'campers') return user.entityType === 'camper'
    return true
  })

  const btnStyle = { flex: 1, padding: '10px', border: 'none', borderRadius: '4px', fontFamily: fonts.header, fontSize: '16px', cursor: 'pointer', letterSpacing: '1px' }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><Shield size={28} color={colors.primary} /><h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textLight, margin: 0, letterSpacing: '1px' }}>CAMP DIRECTORY</h2></div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setFilter('all')} style={{ ...btnStyle, backgroundColor: filter === 'all' ? colors.primary : colors.highlight, color: colors.textLight }}>ALL</button>
        <button onClick={() => setFilter('staff')} style={{ ...btnStyle, backgroundColor: filter === 'staff' ? colors.primary : colors.highlight, color: colors.textLight }}>STAFF</button>
        <button onClick={() => setFilter('campers')} style={{ ...btnStyle, backgroundColor: filter === 'campers' ? colors.primary : colors.highlight, color: colors.textLight }}>CAMPERS</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? <div style={{ color: colors.primary, fontFamily: fonts.utility, textAlign: 'center', padding: '20px' }}>Loading records...</div> : filtered.length === 0 ? <div style={{ backgroundColor: colors.highlight, color: colors.textLight, padding: '20px', borderRadius: '4px', textAlign: 'center', fontFamily: fonts.utility, fontSize: '12px' }}>No users found for this camp.</div> : filtered.map(user => {
          const isStaff = user.entityType !== 'camper'
          const displayStr = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User'
          const Icon = user.entityType === 'hq_staff' ? Star : (isStaff ? Shield : User)
          
          return (
            <div key={user.id} style={{ backgroundColor: colors.panel, padding: '15px', borderRadius: '4px', border: `2px solid #0B140E`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={20} color={isStaff ? colors.primary : colors.muted} />
                <div>
                  <div style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, letterSpacing: '1px' }}>{displayStr}</div>
                  <div style={{ fontFamily: fonts.utility, fontSize: '11px', color: colors.muted, textTransform: 'uppercase', marginTop: '2px' }}>ID: {user.trailhead_id || 'PENDING'}</div>
                </div>
              </div>
              <div style={{ backgroundColor: isStaff ? colors.primary : colors.highlight, color: colors.textLight, padding: '4px 8px', borderRadius: '2px', fontFamily: fonts.utility, fontSize: '10px', textTransform: 'uppercase', textAlign: 'center' }}>{user.displayRole}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}