import FeatureTransferList from './FeatureTransferList'

export default function AdminTab({ profile, campData }) {
  // Security check: If they somehow got here without admin rights, show a warning.
  const isAdmin = ['global_superadmin', 'global_admin', 'camp_superadmin', 'camp_admin'].includes(profile?.access_tier)

  if (!isAdmin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
        <h3>Access Denied</h3>
        <p>You do not have the required permissions to view this page.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px' }}>
        <h2 style={{ color: '#14532d', margin: '0 0 10px 0', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', fontSize: '24px' }}>
          Admin Dashboard
        </h2>
        <p style={{ color: '#a3b3a9', margin: 0, fontSize: '14px' }}>
          Managing: <strong style={{ color: '#182821' }}>{campData?.name || 'Camp Location'}</strong>
        </p>
      </div>
      
      {/* 
        Eventually, we will put the User Directory list above this, 
        and clicking a user will pass their specific data into the Transfer List.
        For now, we render it directly to test the UI.
      */}
      <FeatureTransferList />
      
    </div>
  )
}