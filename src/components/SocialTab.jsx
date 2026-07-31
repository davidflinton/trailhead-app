import { Camera, User } from 'lucide-react'

export default function SocialTab({ campBranding, inputStyle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Social Feed</h1>
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #d1ccc0', display: 'flex', gap: '10px' }}>
        <input type="text" placeholder="Share a camp moment or photo..." style={{ ...inputStyle, flexGrow: 1 }} />
        <button style={{ padding: '10px 15px', backgroundColor: campBranding.secondaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Camera size={18} /> Post
        </button>
      </div>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #d1ccc0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#efebe0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color={campBranding.secondaryColor} />
          </div>
          <div>
            <strong style={{ display: 'block', color: '#182821' }}>Sam [Cabin 3]</strong>
            <span style={{ fontSize: '12px', color: '#a3b3a9' }}>1 hour ago</span>
          </div>
        </div>
        <p style={{ margin: '0 0 15px 0', color: '#182821', lineHeight: '1.5' }}>We just destroyed the obstacle course! Blue team is going down today.</p>
        <div style={{ height: '200px', backgroundColor: '#f9f8f6', border: '1px dashed #d1ccc0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a3b3a9', fontWeight: 'bold' }}>
          [ Photo Placeholder ]
        </div>
      </div>
    </div>
  )
}