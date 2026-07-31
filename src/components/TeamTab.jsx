export default function TeamTab({ session, teams, selectStyle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Team Hub</h1>
        {['Camp Director', 'Asst. Camp Director', 'Creator'].includes(session.role) && (
          <select style={{ ...selectStyle, width: 'auto', height: '36px', padding: '4px 10px' }}>
            <option>View: All Teams</option>
            {teams.map(t => <option key={t.id} value={t.name}>View: {t.name}</option>)}
          </select>
        )}
      </div>
      <div style={{ backgroundColor: 'rgba(20, 83, 45, 0.1)', padding: '20px', borderRadius: '8px', border: '1px solid #14532d' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: '#14532d' }}>Strategy: Capture the Flag</h3>
            <span style={{ fontSize: '12px', color: '#182821', fontWeight: 'bold' }}>Private Team Comms</span>
          </div>
          {['Counselor', 'Team Leader', 'Asst. Team Leader'].includes(session.role) && (
             <button style={{ background: 'white', border: '1px solid #14532d', padding: '6px 12px', borderRadius: '4px', color: '#14532d', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>New Team Post</button>
          )}
        </div>
        <p style={{ margin: 0, color: '#182821', lineHeight: '1.5' }}>Listen up team! Today at 2PM we are going straight for the ridge.</p>
      </div>
    </div>
  )
}