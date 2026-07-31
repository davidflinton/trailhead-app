export default function ChallengesTab({ isCampAdminLogin, campBranding }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: '0', color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Challenges & Score</h1>
        {isCampAdminLogin && (
          <button style={{ padding: '8px 12px', backgroundColor: '#14532d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            + New Challenge
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
        <div style={{ minWidth: '120px', backgroundColor: '#182821', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#a3b3a9', textTransform: 'uppercase', fontWeight: 'bold' }}>Blue Team</span>
          <div style={{ fontSize: '28px', fontFamily: "'Oswald', sans-serif", marginTop: '5px' }}>1,250</div>
        </div>
        <div style={{ minWidth: '120px', backgroundColor: '#dc2626', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 'bold' }}>Red Team</span>
          <div style={{ fontSize: '28px', fontFamily: "'Oswald', sans-serif", marginTop: '5px' }}>1,100</div>
        </div>
        <div style={{ minWidth: '120px', backgroundColor: '#14532d', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#86efac', textTransform: 'uppercase', fontWeight: 'bold' }}>Green Team</span>
          <div style={{ fontSize: '28px', fontFamily: "'Oswald', sans-serif", marginTop: '5px' }}>980</div>
        </div>
      </div>

      <div>
          <h3 style={{ borderBottom: '2px solid #d1ccc0', paddingBottom: '5px', color: campBranding.secondaryColor, textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif", marginBottom: '15px' }}>Daily Challenges</h3>
          
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #d1ccc0', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ paddingRight: '15px' }}>
              <span style={{ display: 'inline-block', fontSize: '10px', backgroundColor: '#efebe0', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: campBranding.secondaryColor, marginBottom: '8px' }}>INDIVIDUAL</span>
              <strong style={{ display: 'block', color: '#182821' }}>Find the Golden Pinecone</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#a3b3a9' }}>Snap a pic of the hidden pinecone near the mess hall.</p>
            </div>
            <button style={{ padding: '8px 15px', backgroundColor: campBranding.secondaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap' }}>
              Upload Pic
            </button>
          </div>
      </div>

      <div>
          <h3 style={{ borderBottom: '2px solid #d1ccc0', paddingBottom: '5px', color: campBranding.secondaryColor, textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif", marginBottom: '15px' }}>Weekly Challenges</h3>
          
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #d1ccc0', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ paddingRight: '15px' }}>
              <span style={{ display: 'inline-block', fontSize: '10px', backgroundColor: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#4f46e5', marginBottom: '8px' }}>TEAM</span>
              <strong style={{ display: 'block', color: '#182821' }}>Build the Ultimate Fort</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#a3b3a9' }}>Highest rated team fort wins 500 points. Staff will judge on Friday.</p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#a3b3a9', whiteSpace: 'nowrap' }}>In Progress</span>
          </div>
      </div>
    </div>
  )
}