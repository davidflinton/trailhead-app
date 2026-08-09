import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { ShieldCheck, Key, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react'

export default function Register() {
  const [step, setStep] = useState('processing')
  const [errorMsg, setErrorMsg] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userDbId, setUserDbId] = useState(null)
  const [trailheadId, setTrailheadId] = useState('')

  // Matches the Admin Console Dark Theme
  const colors = {
    background: '#0B140E', panel: '#16281D', textDark: '#F1E8D0', 
    primary: '#C1531B', muted: '#8A9A8F', error: '#D9534F', border: '#1E3524'
  }
  
  const fonts = {
    header: "'Staatliches', sans-serif", body: "'Karla', sans-serif", utility: "'JetBrains Mono', monospace"
  }

  useEffect(() => {
    // Extract the ID and Passphrase from the QR code's URL
    const params = new URLSearchParams(window.location.search)
    const paramId = params.get('id')
    const paramCode = params.get('code')

    if (paramId && paramCode) {
      setTrailheadId(paramId)
      processRegistration(paramId, paramCode)
    } else {
      setStep('error')
      setErrorMsg('Missing registration credentials. Scan your QR code again or check your link.')
    }
  }, [])

  const processRegistration = async (id, code) => {
    const authEmail = `${id.toLowerCase()}@trailhead.local`

    try {
      // 1. Log the user in with the URL payload
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: code
      })

      if (authError) throw authError

      const user = authData.user
      setUserDbId(user.id)

      // 2. Check if a password reset is mandated
      const { data: profileData, error: profileError } = await supabase
        .from('trailhead_personnel')
        .select('force_password_reset')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      if (profileData.force_password_reset) {
        setStep('reset')
      } else {
        setStep('complete')
        finalizeLogin()
      }

    } catch (err) {
      setStep('error')
      setErrorMsg(err.message)
    }
  }

  const handlePasswordReset = async () => {
    setErrorMsg('')
    
    if (newPassword.length < 8) {
      setErrorMsg('Your new password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setStep('processing')
    
    try {
      // Update Auth Engine
      const { error: updateAuthErr } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (updateAuthErr) throw updateAuthErr

      // Remove the force reset flag from their personnel file
      const { error: updateDbErr } = await supabase
        .from('trailhead_personnel')
        .update({ force_password_reset: false })
        .eq('id', userDbId)

      if (updateDbErr) throw updateDbErr

      setStep('complete')
      finalizeLogin()

    } catch (err) {
      setStep('error')
      setErrorMsg(err.message)
    }
  }

  const finalizeLogin = () => {
    // Reroute back to the main app root, where App.jsx will detect the new active session
    setTimeout(() => {
      window.location.href = '/'
    }, 2000)
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
          <ShieldCheck size={48} color={colors.primary} />
        </div>
        
        <h1 style={{ margin: '0 0 5px 0', fontFamily: fonts.header, fontSize: '32px', letterSpacing: '1px', color: colors.primary }}>
          TRAILHEAD AUTH
        </h1>
        <p style={{ margin: '0 0 30px 0', color: colors.muted, fontFamily: fonts.utility, fontSize: '12px', textTransform: 'uppercase' }}>
          {trailheadId ? `ID: ${trailheadId}` : 'Secure Registration Gateway'}
        </p>

        {step === 'processing' && (
          <div style={{ padding: '20px' }}>
            <Loader2 size={32} color={colors.textDark} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 15px auto' }} />
            <p style={{ color: colors.textDark, fontSize: '16px' }}>Authenticating credentials...</p>
          </div>
        )}

        {step === 'reset' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(193, 83, 27, 0.1)', padding: '10px', borderRadius: '4px', borderLeft: `4px solid ${colors.primary}`, marginBottom: '20px' }}>
              <Key size={20} color={colors.primary} />
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Update Required</span>
            </div>
            <p style={{ fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
              Your administrator requires you to set a personal password before accessing the system.
            </p>
            
            {errorMsg && (
              <div style={{ backgroundColor: colors.error, color: '#FFF', padding: '10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>
                {errorMsg}
              </div>
            )}

            <label style={{ display: 'block', color: colors.muted, fontWeight: 'bold', fontSize: '12px', marginBottom: '5px', textTransform: 'uppercase' }}>New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              style={inputStyle} 
            />

            <label style={{ display: 'block', color: colors.muted, fontWeight: 'bold', fontSize: '12px', marginBottom: '5px', textTransform: 'uppercase' }}>Confirm Password</label>
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
              SAVE AND PROCEED <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div style={{ padding: '20px' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: colors.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <Check size={32} color="#FFF" />
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontFamily: fonts.header, fontSize: '24px' }}>VERIFIED</h3>
            <p style={{ color: colors.muted, fontSize: '14px' }}>Routing you to the dashboard...</p>
          </div>
        )}

        {step === 'error' && (
          <div style={{ padding: '20px' }}>
            <AlertTriangle size={48} color={colors.error} style={{ margin: '0 auto 20px auto' }} />
            <h3 style={{ margin: '0 0 10px 0', fontFamily: fonts.header, fontSize: '24px', color: colors.error }}>AUTHENTICATION FAILED</h3>
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