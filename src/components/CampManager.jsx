import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function CampManager({ setCampData, setActiveTab, colors, fonts }) {
  const [campsList, setCampsList] = useState([])
  const [isFetchingCamps, setIsFetchingCamps] = useState(false)

  useEffect(() => {
    fetchCamps()
  }, [])

  const fetchCamps = async () => {
    setIsFetchingCamps(true)
    try {
      const { data, error } = await supabase
        .from('camps')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCampsList(data || [])
    } catch (error) {
      console.error("Failed to load camps:", error.message)
    } finally {
      setIsFetchingCamps(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textLight, marginTop: 0, letterSpacing: '1px' }}>MANAGE CAMPS</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {isFetchingCamps ? (
          <div style={{ color: colors.muted, textAlign: 'center', padding: '20px', fontFamily: fonts.utility }}>Loading camps...</div>
        ) : campsList.length === 0 ? (
          <div style={{ backgroundColor: colors.highlight, color: colors.textLight, padding: '20px', borderRadius: '4px', textAlign: 'center', fontFamily: fonts.utility, fontSize: '12px' }}>
            No camps found in the database.
          </div>
        ) : (
          campsList.map((camp) => (
            <div key={camp.id} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '4px', border: `2px solid #0B140E`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: fonts.header, fontSize: '24px', color: colors.textDark, letterSpacing: '1px' }}>{camp.name}</div>
                <div style={{ fontFamily: fonts.utility, fontSize: '12px', color: colors.muted, textTransform: 'uppercase', marginTop: '4px' }}>
                  Type: {camp.type?.replace('_', ' ')}
                </div>
              </div>
              <button 
                onClick={() => {
                  setCampData(camp)
                  setActiveTab('news')
                }} 
                style={{ padding: '10px 20px', backgroundColor: colors.primary, color: colors.textLight, border: 'none', borderRadius: '4px', fontFamily: fonts.header, fontSize: '18px', letterSpacing: '1px', cursor: 'pointer' }}
              >
                ENTER CAMP
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}