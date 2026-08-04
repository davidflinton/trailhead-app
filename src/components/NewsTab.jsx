export default function NewsTab({ activeCamp }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center', color: '#182821' }}>
      <h2 style={{ fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Camp News</h2>
      <p style={{ color: '#a3b3a9' }}>
        The news feed for {activeCamp?.name || 'this camp'} is under construction.
      </p>
    </div>
  )
}