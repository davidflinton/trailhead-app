import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { KeyRound, Check, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react'

export default function ResetPassword() {
  const [step, setStep] = useState('input')
  const [errorMsg, setErrorMsg] = useState('')
  const [currentPassphrase, setCurrentPassphrase] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [trailheadId, setTrailheadId] = useState('')

  const colors = {
    background: '#0B140E', panel: '#16281D', textDark: '#F1E8D0', 
    primary: '#C1531B', muted: '#8A9A8F', error: '#D9534F', border: '#1E3524'
  }
  
  const fonts = {
    header: "'Staatliches', sans-serif", body: "'Karla', sans-serif", utility: "'JetBrains Mono', monospace"
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paramId = params.get('id')

    if (paramId) {
      setTrailheadId(paramId)
    } else {
      setStep('error')
      setErrorMsg('Missing User ID. Please scan your QR code again.')
    }
  }, [])

  const handlePasswordReset = async () => {
    setErrorMsg('')
    
    if (!currentPassphrase) {
      setErrorMsg('Please enter your current passphrase.')
      return
    }
    if (newPassword.length < 8) {
      setErrorMsg('Your new password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.')
      return
    }

    setStep('processing')
    const authEmail = `${trailheadId.toLowerCase()}@trailhead.local`
    
    try {
      // 1. Verify current credentials by logging in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: currentPassphrase
      })

      if (signInError) {
        throw new Error('Invalid current passphrase. If you forgot it, your admin must generate a new one.')
      }

      // 2. Update to the new password
      const { data: authData, error: updateAuthErr } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (updateAuthErr) throw updateAuthErr

      // 3. Clear any force_reset flags
      const { error: updateDbErr } = await supabase
        .from('trailhead_personnel')
        .update({ force_password_reset: false })
        .eq('id', authData.user.id)

      if (updateDbErr) throw updateDbErr

      setStep('complete')
      
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)

    } catch (err) {
      setStep('input')
      setErrorMsg(err.message)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '4px', backgroundColor: '#111', 
    color: colors.textDark, border: `1px solid ${colors.muted}`, boxSizing: 'border-box', 
    outline: 'none', fontFamily: fonts.body, fontSize: '15px', marginBottom: '15px'
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: colors.background, color: colors.textDark, fontFamily: fonts.body }}>
      <div style={{ backgroundColor: colors.panel, padding: '40px', borderRadius: '8px', border: `2px solid ${colors.primary}`, maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '4px 4px 0px #000' }}>
        
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <KeyRound size={48} color={colors.primary} />
        </div>
        
        <h1 style={{ margin: '0 0 5px 0', fontFamily: fonts.header, fontSize: '32px', letterSpacing: '1px', color: colors.primary }}>
          PASSWORD RESET
        </h1>
        <p style={{ margin: '0 0 30px 0', color: colors.muted, fontFamily: fonts.utility, fontSize: '12px', textTransform: 'uppercase' }}>
          {trailheadId ? `ID: ${trailheadId}` : 'Secure Recovery Gateway'}
        </p>

        {step === 'processing' && (
          <div style={{ padding: '20px' }}>
            <Loader2 size={32} color={colors.textDark} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 15px auto' }} />
            <p style={{ color: colors.textDark, fontSize: '16px' }}>Updating credentials...</p>
          </div>
        )}

        {step === 'input' && (
          <div style={{ textAlign: 'left' }}>
            
            {errorMsg && (
              <div style={{ backgroundColor: colors.error, color: '#FFF', padding: '10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>
                {errorMsg}
              </div>
            )}

            <label style={{ display: 'block', color: colors.textDark, fontWeight: 'bold', fontSize: '12px', marginBottom: '5px', textTransform: 'uppercase' }}>Current Passphrase</label>
            <input 
              type="password" 
              value={currentPassphrase} 
              onChange={(e) => setCurrentPassphrase(e.target.value)} 
              style={{...inputStyle, border: `1px solid ${colors.primary}`}} 
              placeholder="e.g. bear-tent-fire-123!"
            />

            <div style={{ height: '1px', backgroundColor: colors.border, margin: '20px 0' }}></div>

            <label style={{ display: 'block', color: colors.muted, fontWeight: 'bold', fontSize: '12px', marginBottom: '5px', textTransform: 'uppercase' }}>New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              style={inputStyle} 
            />

            <label style={{ display: 'block', color: colors.muted, fontWeight: 'bold', fontSize: '12px', marginBottom: '5px', textTransform: 'uppercase' }}>Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              style={inputStyle} 
            />

            <button 
              onClick={handlePasswordReset}
              style={{ width: '100%', backgroundColor: colors.primary, color: '#FFF', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
            >
              UPDATE AND LOGIN <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div style={{ padding: '20px' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: colors.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <Check size={32} color="#FFF" />
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontFamily: fonts.header, fontSize: '24px' }}>SECURED</h3>
            <p style={{ color: colors.muted, fontSize: '14px' }}>Routing you to the dashboard...</p>
          </div>
        )}

        {step === 'error' && (
          <div style={{ padding: '20px' }}>
            <AlertTriangle size={48} color={colors.error} style={{ margin: '0 auto 20px auto' }} />
            <h3 style={{ margin: '0 0 10px 0', fontFamily: fonts.header, fontSize: '24px', color: colors.error }}>INVALID REQUEST</h3>
            <p style={{ color: colors.textDark, fontSize: '14px', lineHeight: 1.5 }}>{errorMsg}</p>
          </div>
        )}

      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}