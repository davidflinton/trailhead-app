export default function RequestsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Help & Requests</h1>
      <button style={{ padding: '15px', backgroundColor: '#14532d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}>
        Submit Maintenance Ticket
      </button>
      <button style={{ padding: '15px', backgroundColor: 'white', color: '#182821', border: '1px solid #d1ccc0', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}>
        Leave a Suggestion
      </button>
    </div>
  )
}