import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function DiscussionBoard({ colors, fonts, profile }) {
  const [posts, setPosts] = useState([])
  const [projects, setProjects] = useState(['General Question'])
  const [selectedProject, setSelectedProject] = useState('General Question')
  const [newProjectName, setNewProjectName] = useState('')
  const [postContent, setPostContent] = useState('')

  useEffect(() => { fetchDiscussions() }, [])

  const fetchDiscussions = async () => {
    const { data } = await supabase.from('admin_discussions').select('*').order('created_at', { ascending: false })
    if (data) {
      setPosts(data)
      const unique = [...new Set(data.map(d => d.project_name).filter(Boolean))]
      setProjects(['General Question', ...unique.filter(p => p !== 'General Question')])
    }
  }

  const handlePost = async () => {
    if (!postContent.trim() || (selectedProject === 'New Project' && !newProjectName.trim())) return
    const finalProject = selectedProject === 'New Project' ? newProjectName : selectedProject
    const authorName = profile?.display_name || profile?.first_name || 'Admin'
    const { error } = await supabase.from('admin_discussions').insert([{ project_name: finalProject, content: postContent, author_id: profile?.id, author_name: authorName }])
    if (!error) {
      setPostContent(''); setNewProjectName(''); setSelectedProject('General Question'); fetchDiscussions()
    } else alert(`Error: ${error.message}`)
  }

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '4px', backgroundColor: '#fff', color: colors.textDark, border: `1px solid ${colors.muted}`, boxSizing: 'border-box', outline: 'none', fontFamily: fonts.body, fontSize: '15px' }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textLight, marginTop: 0, letterSpacing: '1px' }}>DISCUSSIONS</h2>
      <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '4px', border: `2px solid #0B140E`, boxShadow: '4px 4px 0px #0B140E', marginBottom: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} style={inputStyle}>
            <option value="General Question">General Question</option>
            {projects.filter(p => p !== 'General Question').map((proj, idx) => <option key={idx} value={proj}>{proj}</option>)}
            <option value="New Project">+ New Project...</option>
          </select>
          {selectedProject === 'New Project' && <input type="text" placeholder="Enter Project Name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value.replace(/\b\w/g, c => c.toUpperCase()))} style={inputStyle} />}
        </div>
        <textarea placeholder="Start a new discussion or share an update..." value={postContent} onChange={(e) => setPostContent(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', marginBottom: '15px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: colors.muted, fontFamily: fonts.utility, fontSize: '11px' }}>Polls coming soon.</div>
          <button onClick={handlePost} disabled={!postContent.trim() || (selectedProject === 'New Project' && !newProjectName.trim())} style={{ padding: '10px 20px', backgroundColor: colors.primary, color: colors.textLight, border: 'none', borderRadius: '4px', fontFamily: fonts.header, fontSize: '18px', cursor: 'pointer' }}>POST MESSAGE</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {posts.length === 0 ? (
          <div style={{ color: colors.muted, fontFamily: fonts.utility, textAlign: 'center', padding: '40px', border: `2px dashed ${colors.muted}`, borderRadius: '4px' }}>No discussions yet.</div>
        ) : (
          posts.map(post => (
            <div key={post.id} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', border: `1px solid ${colors.muted}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: colors.textDark, fontFamily: fonts.body }}>{post.author_name}</strong>
                <span style={{ color: colors.muted, fontSize: '12px', fontFamily: fonts.utility }}>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: '11px', color: colors.primary, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>{post.project_name}</div>
              <div style={{ color: colors.textDark, fontFamily: fonts.body, whiteSpace: 'pre-wrap' }}>{post.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}