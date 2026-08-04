export default function EventsTab({ activeCamp }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center', color: '#182821' }}>
      <h2 style={{ fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Camp Events</h2>
      <p style={{ color: '#a3b3a9' }}>
        The event calendar for {activeCamp?.name || 'this camp'} is under construction.
      </p>
    </div>
  )
}