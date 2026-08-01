import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Camera, User, Image as ImageIcon, X, Loader2 } from 'lucide-react'

export default function SocialTab({ campBranding, inputStyle, session, activeCamp }) {
  const [posts, setPosts] = useState([])
  const [postText, setPostText] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (activeCamp) {
      fetchPosts()
    }
  }, [activeCamp])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('camp_id', activeCamp.id)
      .order('created_at', { ascending: false })
    
    if (data) setPosts(data)
    if (error) console.error("Error fetching posts:", error)
  }

  function handleImageSelect(e) {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0])
    }
  }

  async function handleCreatePost() {
    if (!postText.trim() && !selectedImage) return
    if (!activeCamp) return
    
    setIsUploading(true)
    let publicImageUrl = null

    // Upload image if one was selected
    if (selectedImage) {
      const fileExt = selectedImage.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${activeCamp.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('social-feed-photos')
        .upload(filePath, selectedImage)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        alert("Failed to upload image.")
        setIsUploading(false)
        return
      }

      const { data } = supabase.storage.from('social-feed-photos').getPublicUrl(filePath)
      publicImageUrl = data.publicUrl
    }

    // Save the post record
    const payload = {
      camp_id: activeCamp.id,
      author_id: session.profileId, 
      author_name: session.name,
      content: postText.trim(),
      image_url: publicImageUrl
    }

    const { error: insertError } = await supabase.from('social_posts').insert([payload])

    if (!insertError) {
      setPostText('')
      setSelectedImage(null)
      fetchPosts()
    } else {
      console.error("Insert error:", insertError)
      alert("Failed to publish post.")
    }
    
    setIsUploading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Social Feed</h1>
      
      {/* Create Post Box */}
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #d1ccc0' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: selectedImage ? '15px' : '0' }}>
          <input 
            type="text" 
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="Share a camp moment or photo..." 
            style={{ ...inputStyle, flexGrow: 1 }} 
            disabled={isUploading}
          />
          
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleImageSelect}
          />
          
          <button 
            onClick={() => fileInputRef.current.click()} 
            style={{ padding: '10px', backgroundColor: '#f9f8f6', color: '#182821', border: '1px solid #d1ccc0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={isUploading}
          >
            <ImageIcon size={20} />
          </button>
          
          <button 
            onClick={handleCreatePost}
            disabled={isUploading || (!postText.trim() && !selectedImage)}
            style={{ padding: '10px 20px', backgroundColor: campBranding.secondaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: (isUploading || (!postText.trim() && !selectedImage)) ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', opacity: (isUploading || (!postText.trim() && !selectedImage)) ? 0.7 : 1 }}
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />} 
            {isUploading ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Image Preview Area */}
        {selectedImage && (
          <div style={{ position: 'relative', display: 'inline-block', marginTop: '10px' }}>
            <img 
              src={URL.createObjectURL(selectedImage)} 
              alt="Preview" 
              style={{ maxHeight: '150px', borderRadius: '6px', border: '1px solid #d1ccc0' }} 
            />
            <button 
              onClick={() => setSelectedImage(null)}
              style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* The Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {posts.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#a3b3a9', backgroundColor: 'white', borderRadius: '8px', border: '1px dashed #d1ccc0' }}>
            No one has posted anything yet. Be the first!
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #d1ccc0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#efebe0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color={campBranding.secondaryColor} />
                </div>
                <div>
                  <strong style={{ display: 'block', color: '#182821' }}>{post.author_name}</strong>
                  <span style={{ fontSize: '12px', color: '#a3b3a9' }}>
                    {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              
              {post.content && (
                <p style={{ margin: '0 0 15px 0', color: '#182821', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>
              )}
              
              {post.image_url && (
                <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <img src={post.image_url} alt="Post attachment" style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'contain', backgroundColor: '#f9f8f6' }} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}