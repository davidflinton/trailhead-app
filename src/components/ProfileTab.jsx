import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { User, Camera, Save, Loader2, Tent } from 'lucide-react'

export default function ProfileTab({ session, setSession, campBranding }) {
  const [profileData, setProfileData] = useState(null)
  const [formData, setFormData] = useState({ pronouns: '', internalNotes: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function fetchProfile() {
      if (!session.profileId) return
      const { data, error } = await supabase
        .from('campers')
        .select('*')
        .eq('id', session.profileId)
        .single()
      
      if (data) {
        setProfileData(data)
        setFormData({ 
          pronouns: data.pronouns || '', 
          internalNotes: data.internal_notes || '' 
        })
      }
    }
    fetchProfile()
  }, [session.profileId])

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file || !session.profileId) return

    setIsUploadingPhoto(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.profileId}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file)

    if (uploadError) {
      alert("Failed to upload photo.")
      setIsUploadingPhoto(false)
      return
    }

    const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(filePath)
    
    const { error: updateError } = await supabase
      .from('campers')
      .update({ photo_url: urlData.publicUrl })
      .eq('id', session.profileId)

    if (!updateError) {
      setProfileData(prev => ({ ...prev, photo_url: urlData.publicUrl }))
      
      // Update active session memory so other tabs see the new photo instantly
      setSession(prev => {
        const updated = { ...prev, photoUrl: urlData.publicUrl }
        localStorage.setItem('trailhead_session', JSON.stringify(updated))
        return updated
      })
    }
    
    setIsUploadingPhoto(false)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setIsSaving(true)

    const { error } = await supabase
      .from('campers')
      .update({ 
        pronouns: formData.pronouns,
        internal_notes: formData.internalNotes 
      })
      .eq('id', session.profileId)

    if (error) {
      alert("Failed to save profile.")
    } else {
      alert("Profile updated successfully.")
    }
    setIsSaving(false)
  }

  if (!profileData) return <div style={{ padding: '20px', textAlign: 'center', color: '#a3b3a9' }}>Loading profile...</div>

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
      <h1 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>My Profile</h1>
      
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #d1ccc0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        
        {/* Photo Upload Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #efebe0', paddingBottom: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '15px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: campBranding.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `4px solid ${campBranding.secondaryColor}` }}>
              {profileData.photo_url ? (
                <img src={profileData.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Tent size={60} color={campBranding.secondaryColor} />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={isUploadingPhoto}
              style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#182821', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
            >
              {isUploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handlePhotoUpload} />
          </div>
          <h2 style={{ margin: '0 0 5px 0', color: '#182821', fontSize: '24px' }}>{session.name}</h2>
          <span style={{ color: '#a3b3a9', fontSize: '14px', fontWeight: 'bold' }}>{session.role} • {profileData.current_cabin !== 'Unassigned' ? profileData.current_cabin : 'No Cabin'}</span>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#182821', fontSize: '14px' }}>Pronouns</label>
            <input 
              type="text" 
              value={formData.pronouns}
              onChange={(e) => setFormData({...formData, pronouns: e.target.value})}
              placeholder="e.g., he/him"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1ccc0', borderRadius: '6px', boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#182821', fontSize: '14px' }}>About Me (Bio)</label>
            <textarea 
              value={formData.internalNotes}
              onChange={(e) => setFormData({...formData, internalNotes: e.target.value})}
              placeholder="Tell the camp a bit about yourself..."
              style={{ width: '100%', padding: '12px', border: '1px solid #d1ccc0', borderRadius: '6px', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' }} 
            />
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#a3b3a9' }}>* Note: We are repurposing the internal notes field here for your public bio.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" disabled={isSaving} style={{ padding: '12px 24px', backgroundColor: campBranding.secondaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}