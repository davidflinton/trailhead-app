export default function TeamTab({ session, teams = [], selectStyle, colors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: colors.textDark, fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Team Hub</h1>
        {['Camp Director', 'Asst. Camp Director', 'Creator'].includes(session?.role) && (
          <select style={{ ...selectStyle, width: 'auto', height: '36px', padding: '4px 10px' }}>
            <option>View: All Teams</option>
            {teams.map(t => <option key={t.id} value={t.name}>View: {t.name}</option>)}
          </select>
        )}
      </div>
      <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: colors.primary }}>Strategy: Capture the Flag</h3>
            <span style={{ fontSize: '12px', color: colors.textDark, fontWeight: 'bold' }}>Private Team Comms</span>
          </div>
          {['Counselor', 'Team Leader', 'Asst. Team Leader'].includes(session?.role) && (
             <button style={{ background: colors.highlight, border: `1px solid ${colors.border}`, padding: '6px 12px', borderRadius: '4px', color: colors.textDark, fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>New Team Post</button>
          )}
        </div>
        <p style={{ margin: 0, color: colors.textDark, lineHeight: '1.5' }}>Listen up team! Today at 2PM we are going straight for the ridge.</p>
      </div>
    </div>
  )
}