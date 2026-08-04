import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Tent, User, Lock, Loader2, ArrowLeft } from 'lucide-react'

export default function Login() {
  const [viewState, setViewState] = useState('initial')
  const [trailheadId, setTrailheadId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const colors = {
    background: '#1a2920',
    text: '#f2eee3',
    primary: '#c05b26',
    inputBg: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(242, 238, 227, 0.3)'
  }

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // Supabase requires an email format. If they just type an ID, append a dummy domain.
    const authEmail = trailheadId.includes('@') ? trailheadId : `${trailheadId}@trailhead.local`

    try {
      if (viewState === 'resetPassword') {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setMessage('Check your email for the password reset link.')
      } else if (viewState === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForms = () => {
    setTrailheadId('')
    setPassword('')
    setError(null)
    setMessage(null)
  }

  const renderInitialScreen = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '350px' }}>
      <div style={{ color: colors.primary, marginBottom: '15px' }}>
        <Tent size={80} strokeWidth={1.5} />
      </div>
      
      <h1 style={{ margin: '0 0 15px 0', color: colors.text, fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', fontSize: '42px', letterSpacing: '3px' }}>
        TRAILHEAD
      </h1>
      
      <p style={{ color: colors.text, marginBottom: '50px', fontSize: '16px', textAlign: 'center', lineHeight: '1.5', opacity: 0.9 }}>
        One app for camp registration, teams,<br/>and updates.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
        <button 
          onClick={() => { resetForms(); setViewState('signIn'); }}
          style={{ width: '100%', padding: '16px', backgroundColor: colors.primary, color: colors.text, border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}
        >
          Sign In
        </button>
        
        <button 
          onClick={() => { resetForms(); setViewState('registerCamper'); }}
          style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: colors.text, border: `2px solid ${colors.text}`, borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}
        >
          Register Camper
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
        <button 
          onClick={() => { resetForms(); setViewState('registerCampground'); }}
          style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', fontSize: '14px', textDecoration: 'underline', opacity: 0.8 }}
        >
          Register Camp with Trailhead
        </button>
      </div>
    </div>
  )

  const renderAuthForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '350px' }}>
      
      <button 
        onClick={() => setViewState('initial')} 
        style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px', alignSelf: 'flex-start', padding: 0, opacity: 0.8 }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ color: colors.primary, marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
          <Tent size={40} />
        </div>
        <h2 style={{ margin: '0 0 10px 0', color: colors.text, fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', fontSize: '28px' }}>
          {viewState === 'signIn' ? 'Welcome Back' : viewState === 'resetPassword' ? 'Reset Password' : 'Create Account'}
        </h2>
        <p style={{ color: colors.text, opacity: 0.8, margin: 0 }}>
          {viewState === 'signIn' ? 'Enter your credentials to access your camp.' : 
           viewState === 'resetPassword' ? 'Enter your Trailhead ID to receive a secure link.' : 
           'Registration flow coming soon.'}
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)', border: '1px solid #dc2626', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ backgroundColor: 'rgba(22, 163, 74, 0.2)', border: '1px solid #16a34a', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {message}
        </div>
      )}

      {(viewState === 'signIn' || viewState === 'resetPassword') ? (
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ position: 'relative' }}>
            <User size={18} color={colors.text} style={{ position: 'absolute', left: '14px', top: '16px', opacity: 0.6 }} />
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="TRAILHEAD ID"
              value={trailheadId}
              onChange={(e) => setTrailheadId(e.target.value.toUpperCase())}
              required
              style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: '8px', border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg, color: colors.text, fontSize: '16px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {viewState === 'signIn' && (
            <div style={{ position: 'relative' }}>
              <Lock size={18} color={colors.text} style={{ position: 'absolute', left: '14px', top: '16px', opacity: 0.6 }} />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: '8px', border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg, color: colors.text, fontSize: '16px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '16px', backgroundColor: colors.primary, color: colors.text, border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (viewState === 'signIn' ? 'Sign In' : 'Send Reset Link')}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px', border: `1px dashed ${colors.inputBorder}`, borderRadius: '12px', color: colors.text, opacity: 0.8 }}>
          The registration flow form components will be rendered here.
        </div>
      )}

      {viewState === 'signIn' && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={() => { resetForms(); setViewState('resetPassword'); }} 
            style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', fontSize: '14px', opacity: 0.8 }}
          >
            Forgot Password?
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: colors.background, padding: '20px', boxSizing: 'border-box' }}>
      {viewState === 'initial' ? renderInitialScreen() : renderAuthForm()}
    </div>
  )
}