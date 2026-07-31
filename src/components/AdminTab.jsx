import { Search, History, Upload, Plus, Lock, Trash2 } from 'lucide-react'

export default function AdminTab({
  adminView, setAdminView, campBranding, setCampBranding, handleSaveBranding,
  newCabinName, setNewCabinName, handleAddCabin, cabins, handleDeleteCabin,
  newTeamName, setNewTeamName, handleAddTeam, teams, handleDeleteTeam,
  searchQuery, setSearchQuery, roleFilter, setRoleFilter, ROLES,
  fetchLogs, fileInputRef, handleFileUpload, openNewCamperModal, allCampers,
  openEditModal, getFullName, isCreatorLogin, isCampAdminLogin,
  inputStyle, selectStyle, labelStyle, sectionHeaderStyle, squareBadgeStyle, rectBadgeStyle
}) {
  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #d1ccc0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #efebe0', paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ margin: 0, color: '#182821', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif", letterSpacing: '1px' }}>Admin Dashboard</h3>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAdminView('directory')} style={{ padding: '8px 15px', backgroundColor: adminView === 'directory' ? '#182821' : '#f9f8f6', color: adminView === 'directory' ? 'white' : '#182821', border: '1px solid #d1ccc0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Directory</button>
          <button onClick={() => setAdminView('settings')} style={{ padding: '8px 15px', backgroundColor: adminView === 'settings' ? '#182821' : '#f9f8f6', color: adminView === 'settings' ? 'white' : '#182821', border: '1px solid #d1ccc0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Settings</button>
        </div>
      </div>

      {adminView === 'settings' ? (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', gap: '30px' }}>
          
          {/* BRANDING FORM */}
          <div style={{ gridColumn: '1 / -1', backgroundColor: '#fdf6e3', padding: '20px', borderRadius: '8px', border: '1px solid #d1ccc0' }}>
            <h4 style={sectionHeaderStyle}>Camp Identifiers & Settings</h4>
            <form onSubmit={handleSaveBranding} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>App / Camp Name</label>
                <input type="text" value={campBranding.name} onChange={(e) => setCampBranding({...campBranding, name: e.target.value})} style={inputStyle} placeholder="Camp Name" />
              </div>
              <div>
                <label style={labelStyle}>State Abbreviation</label>
                <input type="text" value={campBranding.stateAbbr} onChange={(e) => setCampBranding({...campBranding, stateAbbr: e.target.value.toUpperCase()})} style={inputStyle} placeholder="MN" maxLength="2" />
              </div>
              <div>
                <label style={labelStyle}>Camp ID Prefix</label>
                <input type="text" value={campBranding.campPrefix} onChange={(e) => setCampBranding({...campBranding, campPrefix: e.target.value.toUpperCase()})} style={inputStyle} placeholder="WHP" maxLength="4" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Public Google Calendar ID</label>
                <input type="text" value={campBranding.googleCalendarId} onChange={(e) => setCampBranding({...campBranding, googleCalendarId: e.target.value})} style={inputStyle} placeholder="e.g., camp@gmail.com" />
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#a3b3a9' }}>Ensure your Google Calendar is set to "Public" in its share settings.</p>
              </div>
              <div>
                <label style={labelStyle}>Primary Color (Hex)</label>
                <input type="text" value={campBranding.primaryColor} onChange={(e) => setCampBranding({...campBranding, primaryColor: e.target.value})} style={inputStyle} placeholder="#182821" />
              </div>
              <div>
                <label style={labelStyle}>Secondary Color (Hex)</label>
                <input type="text" value={campBranding.secondaryColor} onChange={(e) => setCampBranding({...campBranding, secondaryColor: e.target.value})} style={inputStyle} placeholder="#bd5b27" />
              </div>
              <div>
                <label style={labelStyle}>Logo URL</label>
                <input type="text" value={campBranding.logoUrl} onChange={(e) => setCampBranding({...campBranding, logoUrl: e.target.value})} style={inputStyle} placeholder="https://..." />
              </div>
              <div>
                <label style={labelStyle}>Layout Template</label>
                <select value={campBranding.layoutTemplate} onChange={(e) => setCampBranding({...campBranding, layoutTemplate: e.target.value})} style={selectStyle}>
                  <option value="standard">Standard (Default)</option>
                  <option value="modern">Modern (Rounded)</option>
                  <option value="playful">Playful (Bold)</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: campBranding.secondaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save Settings</button>
              </div>
            </form>
          </div>

          {/* CABINS LIST */}
          <div>
            <h4 style={sectionHeaderStyle}>Manage Cabins</h4>
            <form onSubmit={handleAddCabin} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" value={newCabinName} onChange={(e) => setNewCabinName(e.target.value)} placeholder="New cabin name..." style={{ ...inputStyle, flexGrow: 1 }} />
              <button type="submit" style={{ padding: '10px', backgroundColor: '#14532d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Add</button>
            </form>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto' }}>
              {cabins.length === 0 ? (
                <div style={{ padding: '15px', textAlign: 'center', color: '#a3b3a9' }}>No custom cabins added.</div>
              ) : cabins.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 'bold', color: '#182821' }}>{c.name}</span>
                  <button onClick={() => handleDeleteCabin(c.id, c.name)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* TEAMS LIST */}
          <div>
            <h4 style={sectionHeaderStyle}>Manage Teams</h4>
            <form onSubmit={handleAddTeam} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="New team name..." style={{ ...inputStyle, flexGrow: 1 }} />
              <button type="submit" style={{ padding: '10px', backgroundColor: '#14532d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Add</button>
            </form>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto' }}>
              {teams.length === 0 ? (
                <div style={{ padding: '15px', textAlign: 'center', color: '#a3b3a9' }}>No custom teams added.</div>
              ) : teams.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 'bold', color: '#182821' }}>{t.name}</span>
                  <button onClick={() => handleDeleteTeam(t.id, t.name)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ROSTER DIRECTORY VIEW */
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="#a3b3a9" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                <input type="text" placeholder="Search by name, prefix, or suffix..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: '40px', width: '250px' }} />
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ ...selectStyle, width: 'auto' }}>
                <option value="All">All Roles</option>
                {ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(isCreatorLogin || isCampAdminLogin) && (
                <button onClick={fetchLogs} style={{ padding: '10px 15px', backgroundColor: '#f9f8f6', color: '#182821', border: '1px solid #d1ccc0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                  <History size={18} /> Logs
                </button>
              )}
              <input type="file" accept=".csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current.click()} style={{ padding: '10px 15px', backgroundColor: 'transparent', color: '#182821', border: '1px solid #d1ccc0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <Upload size={18} /> Import
              </button>
              <button onClick={openNewCamperModal} style={{ padding: '10px 15px', backgroundColor: '#14532d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <Plus size={18} /> Add
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
            {allCampers.filter(camper => (roleFilter === 'All' || camper.camp_role === roleFilter) && (`${camper.prefix || ''} ${camper.first_name} ${camper.middle_name || ''} ${camper.last_name} ${camper.suffix || ''} ${camper.preferred_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#a3b3a9', backgroundColor: '#f9f8f6' }}>
                No profiles found matching those filters.
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {allCampers.filter(camper => (roleFilter === 'All' || camper.camp_role === roleFilter) && (`${camper.prefix || ''} ${camper.first_name} ${camper.middle_name || ''} ${camper.last_name} ${camper.suffix || ''} ${camper.preferred_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()))).map(camper => {
                  
                  let isLocked = false
                  if (camper.is_creator && !isCreatorLogin) isLocked = true
                  if (camper.is_camp_admin && !isCreatorLogin && !isCampAdminLogin) isLocked = true
                  const hasNotes = camper.internal_notes && camper.internal_notes.trim() !== ''
                  
                  return (
                    <div 
                      key={camper.id} 
                      onClick={() => { if(!isLocked) openEditModal(camper) }}
                      style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isLocked ? '#f9f8f6' : 'white', opacity: isLocked ? 0.8 : 1 }}
                      onMouseOver={e => { if(!isLocked) e.currentTarget.style.backgroundColor = '#fdf6e3' }} 
                      onMouseOut={e => { if(!isLocked) e.currentTarget.style.backgroundColor = 'white' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: '#182821', fontSize: '16px' }}>{getFullName(camper)}</strong>
                          {hasNotes && (
                            <span style={{ ...squareBadgeStyle, backgroundColor: '#dc2626' }}>!</span>
                          )}
                          {camper.is_creator && (
                            <span style={{ ...rectBadgeStyle, backgroundColor: '#182821' }}>CREATOR</span>
                          )}
                          {camper.is_camp_admin && !camper.is_creator && (
                            <span style={{ ...rectBadgeStyle, backgroundColor: '#4f46e5' }}>CAMP ADMIN</span>
                          )}
                          {camper.is_admin && !camper.is_camp_admin && !camper.is_creator && (
                            <span style={{ ...squareBadgeStyle, backgroundColor: '#c2410c' }}>A</span>
                          )}
                          {camper.is_board_member && (
                            <span style={{ ...squareBadgeStyle, backgroundColor: '#14532d' }}>B</span>
                          )}
                        </div>
                        <div style={{ color: '#a3b3a9', fontSize: '13px', marginTop: '4px' }}>
                          <strong>ID: {camper.trailhead_id || 'PENDING'}</strong> • {camper.camp_role} {camper.current_cabin !== 'Unassigned' ? `• Cabin: ${camper.current_cabin}` : ''} {camper.team !== 'Unassigned' ? `• Team: ${camper.team}` : ''}
                        </div>
                      </div>
                      <div style={{ color: isLocked ? '#a3b3a9' : '#bd5b27', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        {isLocked ? <Lock size={16} /> : 'Edit'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}