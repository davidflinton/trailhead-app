export default function RequestsTab({ colors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ margin: 0, color: colors.textDark, fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Help & Requests</h1>
      <button style={{ padding: '15px', backgroundColor: colors.primary, color: colors.textOnPrimary, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}>
        Submit Maintenance Ticket
      </button>
      <button style={{ padding: '15px', backgroundColor: colors.panel, color: colors.textDark, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}>
        Leave a Suggestion
      </button>
    </div>
  )
}