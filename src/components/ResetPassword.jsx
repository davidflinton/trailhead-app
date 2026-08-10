import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { KeyRound, Check, ArrowRight, AlertTriangle, Loader2, Mail, Smartphone, ArrowLeft } from 'lucide-react'

export default function ResetPassword() {
  const [step, setStep] = useState('input')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [currentPassphrase, setCurrentPassphrase] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [trailheadId, setTrailheadId] = useState('')

  const colors = {
    background: '#0B140E', panel: '#16281D', textDark: '#F1E8D0', 
    primary: '#C1531B', muted: '#8A9A8F', error: '#D9534F', border: '#1E3524',
    success: '#2A4731'
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
    setSuccessMsg('')
    
    if (!currentPassphrase) {
      setErrorMsg('Please enter your current or temporary passphrase.')
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: currentPassphrase
      })

      if (signInError) {
        throw new Error('Invalid current passphrase. If you requested a temporary code, ensure you typed it correctly.')
      }

      const { data: authData, error: updateAuthErr } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (updateAuthErr) throw updateAuthErr

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

  const handleRecoveryRequest = (method) => {
    setStep('processing')
    
    setTimeout(() => {
      setStep('input')
      setSuccessMsg(`Mock: Temporary passphrase dispatched to your registered ${method}. Please enter it below once received.`)
    }, 1500)
  }

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '4px', backgroundColor: '#111', 
    color: colors.textDark, border: `1px solid ${colors.muted}`, boxSizing: 'border-box', 
    outline: 'none', fontFamily: fonts.body, fontSize: '15px', marginBottom: '15px'
  }

  const actionButtonStyle = {
    width: '100%', padding: '12px', border: 'none', borderRadius: '4px', 
    fontFamily: fonts.body, fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', 
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '10px'
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
            <p style={{ color: colors.textDark, fontSize: '16px' }}>Processing request...</p>
          </div>
        )}

        {step === 'forgot' && (
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '14px', marginBottom: '20px', lineHeight: 1.5, color: colors.textDark }}>
              Select how you would like to receive your temporary recovery passphrase. This will be sent to the contact info registered on your profile.
            </p>
            
            <button 
              onClick={() => handleRecoveryRequest('email')} 
              style={{ ...actionButtonStyle, backgroundColor: colors.primary, color: '#FFF' }}
            >
              <Mail size={18} /> Send via Email
            </button>
            
            <button 
              onClick={() => handleRecoveryRequest('phone')} 
              style={{ ...actionButtonStyle, backgroundColor: 'transparent', color: colors.textDark, border: `2px solid ${colors.textDark}` }}
            >
              <Smartphone size={18} /> Send via Text
            </button>

            <div style={{ height: '1px', backgroundColor: colors.border, margin: '20px 0' }}></div>

            <button 
              onClick={() => setStep('input')} 
              style={{ width: '100%', backgroundColor: 'transparent', color: colors.muted, border: 'none', cursor: 'pointer', fontFamily: fonts.body, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Return to Login
            </button>
          </div>
        )}

        {step === 'input' && (
          <div style={{ textAlign: 'left' }}>
            
            {errorMsg && (
              <div style={{ backgroundColor: colors.error, color: '#FFF', padding: '10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ backgroundColor: colors.success, color: '#FFF', padding: '10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>
                {successMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ color: colors.textDark, fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>Current Passphrase</label>
              <button onClick={() => { setErrorMsg(''); setSuccessMsg(''); setStep('forgot'); }} style={{ background: 'none', border: 'none', color: colors.primary, fontSize: '12px', cursor: 'pointer', fontFamily: fonts.body, fontWeight: 'bold', padding: 0 }}>
                Forgot?
              </button>
            </div>
            
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