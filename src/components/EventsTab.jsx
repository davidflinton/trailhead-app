export default function EventsTab({ activeCamp, colors }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center', color: colors.textDark }}>
      <h2 style={{ fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Camp Events</h2>
      <p style={{ color: colors.muted }}>
        The event calendar for {activeCamp?.name || 'this camp'} is under construction.
      </p>
    </div>
  )
}