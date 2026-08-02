import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Camera, User, Image as ImageIcon, X, Loader2, Heart, MessageCircle, Send } from 'lucide-react'

export default function SocialTab({ campBranding, inputStyle, session, activeCamp }) {
  const [posts, setPosts] = useState([])
  const [postText, setPostText] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [expandedComments, setExpandedComments] = useState({})
  const [commentInputs, setCommentInputs] = useState({})
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (activeCamp) {
      fetchPosts()
    }
  }, [activeCamp])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('social_posts')
      .select(`
        *,
        campers (photo_url),
        social_likes (camper_id),
        social_comments (
          *,
          campers (photo_url)
        )
      `)
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

  async function toggleLike(postId, hasLiked) {
    if (hasLiked) {
      await supabase.from('social_likes').delete().eq('post_id', postId).eq('camper_id', session.profileId)
    } else {
      await supabase.from('social_likes').insert([{ post_id: postId, camper_id: session.profileId }])
    }
    fetchPosts()
  }

  function toggleComments(postId) {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  async function submitComment(postId) {
    const text = commentInputs[postId]
    if (!text || !text.trim()) return

    const payload = {
      post_id: postId,
      author_id: session.profileId,
      author_name: session.name,
      content: text.trim()
    }

    const { error } = await supabase.from('social_comments').insert([payload])
    
    if (!error) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }))
      fetchPosts()
    } else {
      alert("Failed to post comment.")
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Create Post Box */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #d1ccc0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#efebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
             <User size={20} color="#a3b3a9" />
          </div>
          <div style={{ flexGrow: 1 }}>
            <textarea 
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's happening at camp?" 
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', border: 'none', padding: '10px 0', backgroundColor: 'transparent', boxShadow: 'none' }} 
              disabled={isUploading}
            />
            
            {selectedImage && (
              <div style={{ position: 'relative', display: 'inline-block', marginTop: '10px', marginBottom: '10px' }}>
                <img src={URL.createObjectURL(selectedImage)} alt="Preview" style={{ maxHeight: '200px', borderRadius: '8px', border: '1px solid #d1ccc0' }} />
                <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            )}
            
            <div style={{ borderTop: '1px solid #efebe0', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageSelect} />
              <button onClick={() => fileInputRef.current.click()} disabled={isUploading} style={{ background: 'none', border: 'none', color: campBranding.secondaryColor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                <ImageIcon size={20} /> Photo
              </button>
              <button onClick={handleCreatePost} disabled={isUploading || (!postText.trim() && !selectedImage)} style={{ padding: '8px 20px', backgroundColor: campBranding.primaryColor, color: 'white', border: 'none', borderRadius: '20px', cursor: (isUploading || (!postText.trim() && !selectedImage)) ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', opacity: (isUploading || (!postText.trim() && !selectedImage)) ? 0.5 : 1 }}>
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* The Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {posts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a3b3a9', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1ccc0' }}>
            No one has posted anything yet. Break the ice!
          </div>
        ) : (
          posts.map(post => {
            const hasLiked = post.social_likes?.some(like => like.camper_id === session.profileId)
            const likeCount = post.social_likes?.length || 0
            const commentCount = post.social_comments?.length || 0
            const showComments = expandedComments[post.id]
            const authorPhoto = post.campers?.photo_url

            return (
              <div key={post.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #d1ccc0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                
                {/* Post Header */}
                <div style={{ padding: '20px 20px 10px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#efebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {authorPhoto ? <img src={authorPhoto} alt="Author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={24} color="#a3b3a9" />}
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#182821', fontSize: '15px' }}>{post.author_name}</strong>
                    <span style={{ fontSize: '12px', color: '#a3b3a9' }}>
                      {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                {/* Post Content */}
                <div style={{ padding: '0 20px 15px 20px' }}>
                  {post.content && (
                    <p style={{ margin: '0 0 10px 0', color: '#182821', lineHeight: '1.5', whiteSpace: 'pre-wrap', fontSize: '15px' }}>
                      {post.content}
                    </p>
                  )}
                </div>

                {/* Post Image */}
                {post.image_url && (
                  <div style={{ width: '100%', backgroundColor: '#f9f8f6', borderTop: '1px solid #efebe0', borderBottom: '1px solid #efebe0' }}>
                    <img src={post.image_url} alt="Post attachment" style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'contain' }} />
                  </div>
                )}
                
                {/* Action Bar */}
                <div style={{ padding: '10px 20px', display: 'flex', gap: '25px', borderBottom: showComments ? '1px solid #efebe0' : 'none' }}>
                  <button onClick={() => toggleLike(post.id, hasLiked)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: hasLiked ? '#dc2626' : '#a3b3a9', fontWeight: 'bold', fontSize: '14px', padding: 0 }}>
                    <Heart size={20} fill={hasLiked ? '#dc2626' : 'none'} /> {likeCount > 0 ? likeCount : ''}
                  </button>
                  <button onClick={() => toggleComments(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#a3b3a9', fontWeight: 'bold', fontSize: '14px', padding: 0 }}>
                    <MessageCircle size={20} /> {commentCount > 0 ? commentCount : ''}
                  </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                  <div style={{ backgroundColor: '#fdf6e3', padding: '15px 20px' }}>
                    
                    {/* List Comments */}
                    {post.social_comments && post.social_comments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
                        {post.social_comments.map(comment => {
                          const commentAuthorPhoto = comment.campers?.photo_url
                          return (
                            <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#efebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                {commentAuthorPhoto ? <img src={commentAuthorPhoto} alt="Commenter" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={16} color="#a3b3a9" />}
                              </div>
                              <div style={{ backgroundColor: 'white', padding: '10px 15px', borderRadius: '15px', border: '1px solid #d1ccc0', flexGrow: 1 }}>
                                <strong style={{ display: 'block', color: '#182821', fontSize: '13px', marginBottom: '2px' }}>{comment.author_name}</strong>
                                <span style={{ color: '#182821', fontSize: '14px', lineHeight: '1.4' }}>{comment.content}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Write a comment..." 
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                        style={{ ...inputStyle, borderRadius: '20px', padding: '10px 15px' }}
                      />
                      <button onClick={() => submitComment(post.id)} disabled={!commentInputs[post.id]?.trim()} style={{ background: 'none', border: 'none', color: campBranding.secondaryColor, cursor: !commentInputs[post.id]?.trim() ? 'not-allowed' : 'pointer', padding: '5px', opacity: !commentInputs[post.id]?.trim() ? 0.5 : 1 }}>
                        <Send size={20} />
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}