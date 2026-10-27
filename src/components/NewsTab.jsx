export default function NewsTab({ activeCamp, colors }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center', color: colors.textDark }}>
      <h2 style={{ fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Camp News</h2>
      <p style={{ color: colors.muted }}>
        The news feed for {activeCamp?.name || 'this camp'} is under construction.
      </p>
    </div>
  )
}