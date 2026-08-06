import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Tent, Users, CheckSquare, MessageSquare, LogOut, Search, MapPin, ArrowRight, ClipboardList, ThumbsUp, MessageCircle, BarChart2, Edit2, Plus, LayoutDashboard, Menu, X } from 'lucide-react'
import StaffManager from './StaffManager'

export default function Lobby({ profile, setCampData, setActiveTab }) {
  const [lobbyTab, setLobbyTab] = useState('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Camp Management State
  const [camps, setCamps] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  // New Property State
  const [isAddingCamp, setIsAddingCamp] = useState(false)
  const [newCampName, setNewCampName] = useState('')
  const [newCampType, setNewCampType] = useState('Campground')

  // Discussion Board State
  const [selectedProject, setSelectedProject] = useState('Squirrel Hill Campground')
  const [newProjectName, setNewProjectName] = useState('')
  
  // Brand Palette
  const colors = {
    background: '#16281D', sidebar: '#0F1D14', panel: '#F1E8D0', 
    textDark: '#24201A', textLight: '#F1E8D0', primary: '#C1531B', 
    muted: '#6B6250', error: '#E8896B', highlight: '#1E3524', border: '#0B140E'
  }
  const fonts = {
    header: "'Staatliches', sans-serif", body: "'Karla', sans-serif", utility: "'JetBrains Mono', monospace"
  }

  const headerDisplayName = profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.access_tier

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from('camps').select('*').order('name')
    if (data) setCamps(data)
    if (error) console.error("Error fetching properties:", error.message)
    setIsLoading(false)
  }

  const handleAddCamp = async () => {
    if (!newCampName.trim()) return
    const { error } = await supabase.from('camps').insert([{ name: newCampName.trim(), type: newCampType }])
    if (error) {
      console.error("Error adding camp:", error.message)
    } else {
      setNewCampName('')
      setNewCampType('Campground')
      setIsAddingCamp(false)
      fetchProperties()
    }
  }

  const handleProjectTextChange = (e) => {
    const text = e.target.value.replace(/\b\w/g, char => char.toUpperCase())
    setNewProjectName(text)
  }

  const filteredCamps = camps.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))

  const handleNavClick = (tab) => {
    setLobbyTab(tab)
    setIsMenuOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: colors.background, color: colors.textLight, fontFamily: fonts.body, overflow: 'hidden' }}>
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #16281D; }
        ::-webkit-scrollbar-thumb { background: #0F1D14; border-radius: 4px; }
      `}</style>

      {/* TOP HEADER */}
      <div style={{ backgroundColor: colors.sidebar, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${colors.highlight}`, zIndex: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontFamily: fonts.header, color: colors.primary, letterSpacing: '2px', lineHeight: 1 }}>
            TRAILHEAD ADMIN CONSOLE
          </h1>
          <p style={{ margin: '2px 0 0 0', opacity: 0.7, fontFamily: fonts.utility, fontSize: '10px', textTransform: 'uppercase' }}>
            {headerDisplayName}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: colors.error, cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }} title="Sign Out">
            <LogOut size={24} />
          </button>
          <button onClick={() => setIsMenuOpen(true)} style={{ background: 'none', border: 'none', color: colors.textLight, cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }} title="Menu">
            <Menu size={28} />
          </button>
        </div>
      </div>

      {/* SLIDE OUT MENU & OVERLAY */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 40 }} 
        />
      )}
      <div style={{ 
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '280px', backgroundColor: colors.sidebar, zIndex: 50, 
        transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out', 
        borderLeft: `2px solid ${colors.highlight}`, display: 'flex', flexDirection: 'column' 
      }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', borderBottom: `1px solid ${colors.highlight}` }}>
          <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}>
            <X size={28} />
          </button>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SideNavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={lobbyTab === 'dashboard'} onClick={() => handleNavClick('dashboard')} colors={colors} fonts={fonts} />
          <SideNavButton icon={<Tent size={20} />} label="Properties" active={lobbyTab === 'camps'} onClick={() => handleNavClick('camps')} colors={colors} fonts={fonts} />
          <SideNavButton icon={<Users size={20} />} label="Staff" active={lobbyTab === 'staff'} onClick={() => handleNavClick('staff')} colors={colors} fonts={fonts} />
          <SideNavButton icon={<CheckSquare size={20} />} label="Approvals" active={lobbyTab === 'approvals'} onClick={() => handleNavClick('approvals')} colors={colors} fonts={fonts} />
          <SideNavButton icon={<MessageSquare size={20} />} label="Discuss" active={lobbyTab === 'discussions'} onClick={() => handleNavClick('discussions')} colors={colors} fonts={fonts} />
          <SideNavButton icon={<ClipboardList size={20} />} label="Notes" active={lobbyTab === 'feedback'} onClick={() => handleNavClick('feedback')} colors={colors} fonts={fonts} />
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, padding: '30px 20px', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* DASHBOARD TAB - THE CENTRAL HUB */}
          {lobbyTab === 'dashboard' && (
            <div>
              <h2 style={{ fontFamily: fonts.header, fontSize: '32px', color: colors.textLight, margin: '0 0 20px 0', letterSpacing: '1px' }}>SYSTEM DASHBOARD</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* Properties Widget */}
                <div onClick={() => setLobbyTab('camps')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Properties</h3>
                    <Tent color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>{isLoading ? 'Loading...' : `${camps.length} Active Campsites`}</div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>MANAGE DIRECTORY &rarr;</div>
                </div>

                {/* Staff Widget */}
                <div onClick={() => setLobbyTab('staff')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Staff Accounts</h3>
                    <Users color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>Provision Admins and QA Testers</div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>MANAGE STAFF &rarr;</div>
                </div>

                {/* Approvals Widget */}
                <div onClick={() => setLobbyTab('approvals')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Approvals</h3>
                    <CheckSquare color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>0 Pending Registrations</div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>REVIEW QUEUE &rarr;</div>
                </div>

                {/* Discussions Widget */}
                <div onClick={() => setLobbyTab('discussions')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Discussions</h3>
                    <MessageSquare color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>Latest: System Update Phase 2</div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>JOIN CONVERSATION &rarr;</div>
                </div>

                {/* Feedback Widget */}
                <div onClick={() => setLobbyTab('feedback')} style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontFamily: fonts.header, fontSize: '24px', color: colors.textDark }}>Tester Notes</h3>
                    <ClipboardList color={colors.primary} size={24} />
                  </div>
                  <div style={{ fontSize: '14px', color: colors.muted }}>Log bugs and system feedback</div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: fonts.utility, color: colors.primary, fontWeight: 'bold' }}>SUBMIT NOTES &rarr;</div>
                </div>

              </div>
            </div>
          )}

          {/* FULL SECTIONS */}

          {/* 1. CAMP MANAGEMENT */}
          {lobbyTab === 'camps' && (
            <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 5px 0', letterSpacing: '1px' }}>PROPERTY DIRECTORY</h2>
                  <p style={{ color: colors.muted, margin: 0, fontSize: '14px' }}>Search and select a property to view and manage its local console.</p>
                </div>
                <button 
                  onClick={() => setIsAddingCamp(!isAddingCamp)} 
                  style={{ backgroundColor: colors.highlight, color: colors.textLight, border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isAddingCamp ? 'CANCEL' : <><Plus size={16} /> ADD PROPERTY</>}
                </button>
              </div>

              {isAddingCamp && (
                <div style={{ backgroundColor: 'rgba(193, 83, 27, 0.1)', padding: '20px', borderRadius: '4px', borderLeft: `4px solid ${colors.primary}`, marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, margin: '0 0 15px 0' }}>CREATE NEW PROPERTY</h3>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <input 
                      type="text" 
                      placeholder="Property Name" 
                      value={newCampName}
                      onChange={(e) => setNewCampName(e.target.value)}
                      style={{ flex: 1, minWidth: '200px', boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.muted}`, fontFamily: fonts.body }}
                    />
                    <select 
                      value={newCampType}
                      onChange={(e) => setNewCampType(e.target.value)}
                      style={{ padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: `1px solid ${colors.muted}`, fontFamily: fonts.body, backgroundColor: 'white' }}
                    >
                      <option value="Campground">Campground</option>
                      <option value="Youth Camp">Youth Camp</option>
                      <option value="Standard Property">Standard Property</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleAddCamp}
                    style={{ backgroundColor: colors.primary, color: colors.textLight, border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '14px' }}
                  >
                    SAVE PROPERTY
                  </button>
                </div>
              )}

              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Search size={18} color={colors.muted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="text" 
                  placeholder="Search properties..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 10px 10px 40px', borderRadius: '4px', border: `1px solid ${colors.muted}`, backgroundColor: 'white', color: colors.textDark, fontSize: '15px', outline: 'none', fontFamily: fonts.body }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                {isLoading ? <div style={{ textAlign: 'center', padding: '20px', color: colors.primary, fontFamily: fonts.utility }}>Loading...</div> : 
                 filteredCamps.length === 0 ? <div style={{ textAlign: 'center', padding: '20px', color: colors.muted }}>No properties found.</div> : 
                 filteredCamps.map(camp => (
                  <div key={camp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'white', border: `1px solid #ccc`, borderRadius: '4px' }}>
                    <div>
                      <div style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, letterSpacing: '1px' }}>{camp.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: colors.muted, fontSize: '12px', fontFamily: fonts.utility, textTransform: 'uppercase' }}><MapPin size={12} /> {camp.type ? camp.type.replace('_', ' ') : 'Standard Property'}</div>
                    </div>
                    <button onClick={() => { setCampData(camp); setActiveTab('news'); }} style={{ backgroundColor: colors.highlight, color: colors.textLight, border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.utility, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>SELECT <ArrowRight size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. STAFF ACCOUNTS */}
          {lobbyTab === 'staff' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
                <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 15px 0' }}>CREATE STAFF ACCOUNT</h2>
                <p style={{ color: colors.muted, margin: '0 0 20px 0', fontSize: '14px' }}>Manually provision accounts for Global Admins and QA Testers.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <input type="text" placeholder="First Name" style={{ padding: '12px', borderRadius: '4px', border: `1px solid ${colors.muted}`, fontFamily: fonts.body, boxSizing: 'border-box' }} />
                  <input type="text" placeholder="Last Name" style={{ padding: '12px', borderRadius: '4px', border: `1px solid ${colors.muted}`, fontFamily: fonts.body, boxSizing: 'border-box' }} />
                  <input type="email" placeholder="Email Address" style={{ padding: '12px', borderRadius: '4px', border: `1px solid ${colors.muted}`, fontFamily: fonts.body, boxSizing: 'border-box' }} />
                  <select style={{ padding: '12px', borderRadius: '4px', border: `1px solid ${colors.muted}`, fontFamily: fonts.body, backgroundColor: 'white', boxSizing: 'border-box' }}>
                    <option value="global_admin">Global Admin</option>
                    <option value="qa_tester">QA Tester</option>
                  </select>
                </div>
                <button style={{ backgroundColor: colors.primary, color: colors.textLight, border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> CREATE ACCOUNT</button>
              </div>
              <div style={{ backgroundColor: colors.panel, padding: '20px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
                <StaffManager colors={colors} fonts={fonts} />
              </div>
            </div>
          )}

          {/* 3. PENDING APPROVALS */}
          {lobbyTab === 'approvals' && (
            <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 5px 0' }}>PENDING APPROVALS</h2>
              <p style={{ color: colors.muted, margin: '0 0 20px 0', fontSize: '14px' }}>Review and approve recently registered camps.</p>
              <div style={{ padding: '30px', backgroundColor: 'white', border: `1px solid ${colors.muted}`, borderRadius: '4px', textAlign: 'center', color: colors.muted, fontFamily: fonts.utility }}>
                No pending camp registrations at this time.
              </div>
            </div>
          )}

          {/* 4. TEAM COMMUNICATIONS & DISCUSSIONS */}
          {lobbyTab === 'discussions' && (
            <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 5px 0' }}>TEAM DISCUSSIONS</h2>
              <p style={{ color: colors.muted, margin: '0 0 20px 0', fontSize: '14px' }}>Communicate with your team and track project updates.</p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: colors.textDark, fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Select Project or Campground:</label>
                <select 
                  value={selectedProject} 
                  onChange={(e) => setSelectedProject(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: `1px solid ${colors.muted}`, fontFamily: fonts.body, backgroundColor: 'white' }}
                >
                  <option value="Camp Whispering Pines">Camp Whispering Pines</option>
                  <option value="Squirrel Hill Campground">Squirrel Hill Campground</option>
                  <option value="new_project">+ New Project</option>
                </select>
              </div>

              {selectedProject === 'new_project' && (
                <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'rgba(193, 83, 27, 0.1)', borderLeft: `4px solid ${colors.primary}`, borderRadius: '0 4px 4px 0' }}>
                  <label style={{ display: 'block', color: colors.textDark, fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Enter New Project Name:</label>
                  <input 
                    type="text" 
                    value={newProjectName}
                    onChange={handleProjectTextChange}
                    placeholder="Project Name..."
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '4px', border: `1px solid ${colors.muted}`, fontFamily: fonts.body }}
                  />
                </div>
              )}

              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', border: `1px solid ${colors.muted}`, marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: colors.textDark }}>System Update: App Testing Phase 2</span>
                  <span style={{ fontSize: '12px', color: colors.muted }}>10:42 AM</span>
                </div>
                <p style={{ color: colors.textDark, fontSize: '15px', margin: '0 0 20px 0', lineHeight: 1.5 }}>Please make sure all QA Testers have logged their initial findings in the feedback tab before the end of the day.</p>
                
                {/* MS Teams-Style Interaction Bar */}
                <div style={{ display: 'flex', gap: '20px', borderTop: `1px solid #eee`, paddingTop: '15px' }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}><ThumbsUp size={18} /> Like</button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}><MessageCircle size={18} /> Reply</button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}><BarChart2 size={18} /> Create Poll</button>
                </div>
              </div>
            </div>
          )}

          {/* 5. TESTER NOTES / FEEDBACK */}
          {lobbyTab === 'feedback' && (
            <div style={{ backgroundColor: colors.panel, padding: '30px', borderRadius: '8px', border: `2px solid ${colors.highlight}` }}>
              <h2 style={{ fontFamily: fonts.header, fontSize: '28px', color: colors.textDark, margin: '0 0 5px 0' }}>TESTER NOTES & FEEDBACK</h2>
              <p style={{ color: colors.muted, margin: '0 0 20px 0', fontSize: '14px' }}>Log system bugs, drop testing notes, and edit your previous feedback.</p>
              
              <textarea 
                placeholder="Enter your QA notes or system feedback here..." 
                style={{ width: '100%', boxSizing: 'border-box', height: '120px', padding: '15px', borderRadius: '4px', border: `1px solid ${colors.muted}`, fontFamily: fonts.body, resize: 'vertical', marginBottom: '15px' }}
              />
              <button style={{ backgroundColor: colors.primary, color: colors.textLight, border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontFamily: fonts.header, fontSize: '16px', marginBottom: '30px' }}>SUBMIT NOTE</button>

              <h3 style={{ fontFamily: fonts.header, fontSize: '20px', color: colors.textDark, margin: '0 0 15px 0', borderBottom: `2px solid ${colors.muted}`, paddingBottom: '8px' }}>YOUR PREVIOUS NOTES</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', backgroundColor: 'white', border: `1px solid ${colors.muted}`, borderRadius: '4px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: colors.muted, marginBottom: '8px', fontFamily: fonts.utility }}>Logged: Aug 5, 2026</div>
                  <div style={{ color: colors.textDark, fontSize: '15px', lineHeight: 1.5 }}>The camp selection dropdown on mobile devices occasionally overlaps with the navigation bar.</div>
                </div>
                <button style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: fonts.utility, fontWeight: 'bold' }}><Edit2 size={16} /> EDIT</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function SideNavButton({ icon, label, active, onClick, colors, fonts }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '15px', width: '100%', 
        background: active ? colors.highlight : 'none', border: 'none', 
        color: active ? colors.primary : colors.textLight, 
        cursor: 'pointer', padding: '15px 20px', borderRadius: '4px', 
        transition: 'background 0.2s', fontFamily: fonts.header, fontSize: '18px', letterSpacing: '1px' 
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}