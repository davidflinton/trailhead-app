export default function PageHeader({ title, subtitle, icon: Icon, colors, fonts, eyebrow, status, padding = '24px' }) {
  return (
    <div style={{ maxWidth: '1200px', width: '100%', boxSizing: 'border-box', margin: '0 auto', padding, color: colors.textDark, fontFamily: fonts.body }}>
      <div style={{ marginBottom: '20px', color: colors.muted, fontSize: '12px', fontFamily: fonts.utility, letterSpacing: '0.04em' }}>
        {eyebrow}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 6px', color: colors.textDark, letterSpacing: '-0.02em' }}>
            <Icon color={colors.primary} size={25} /> {title}
          </h1>
          <p style={{ color: colors.muted, fontSize: '14px', margin: 0 }}>
            {subtitle}
          </p>
        </div>
        {status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.muted, fontSize: '13px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.primary }} />
            {status}
          </div>
        )}
      </div>
    </div>
  )
}
