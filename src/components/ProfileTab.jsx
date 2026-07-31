import { User } from 'lucide-react'

export default function ProfileTab({ session, campBranding }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>My Profile</h1>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #d1ccc0', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#efebe0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
          <User size={40} color={campBranding.secondaryColor} />
        </div>
        <h2 style={{ margin: '0 0 5px 0', color: '#182821' }}>{session.name}</h2>
        <p style={{ margin: '0 0 25px 0', color: '#a3b3a9', fontWeight: 'bold' }}>{session.role} • {session.team}</p>
        <div style={{ backgroundColor: '#fdf6e3', padding: '15px', borderRadius: '6px', border: '1px solid #d1ccc0', display: 'inline-block' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#a3b3a9', textTransform: 'uppercase', fontWeight: 'bold' }}>My Camp ID</p>
          <p style={{ margin: 0, fontSize: '24px', fontFamily: "'Oswald', sans-serif", color: '#182821', letterSpacing: '2px' }}>{session.trailheadId || "XXXXXXXXX"}</p>
        </div>
      </div>
      <button style={{ padding: '15px', backgroundColor: '#14532d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}>
        Update Medical Info
      </button>
    </div>
  )
}