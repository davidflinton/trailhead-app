import { Calendar as CalendarIcon, Edit3, Save, Pin, Trash2, Plus, Megaphone, Tent } from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

export default function HomeTab({
  campBranding,
  isCampAdminLogin,
  isEditingAbout,
  setIsEditingAbout,
  tempAbout,
  setTempAbout,
  handleSaveCampInfo,
  announcements,
  openNewAnnouncementModal,
  openEditAnnouncementModal,
  handleDeleteAnnouncement,
  quillModules
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Announcements Section */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #d1ccc0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #efebe0', paddingBottom: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Announcements</h3>
          {isCampAdminLogin && (
            <button onClick={openNewAnnouncementModal} style={{ padding: '6px 12px', backgroundColor: campBranding.secondaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> New Post
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {announcements.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#a3b3a9', fontStyle: 'italic' }}>No announcements right now.</div>
          ) : (
            announcements.map((ann, index) => (
              <div key={ann.id} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: index === announcements.length - 1 ? 'none' : '1px solid #efebe0', textAlign: 'left' }}>
                
                {/* Left Column: Unread Dot & Avatar */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ann.is_pinned ? campBranding.secondaryColor : '#dc2626', marginTop: '16px', flexShrink: 0 }}></div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: campBranding.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {ann.author_photo ? (
                      <img src={ann.author_photo} alt="Author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Tent size={20} color={campBranding.secondaryColor} />
                    )}
                  </div>
                </div>
                
                {/* Right Column: Message Content */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  
                  {/* Context Label & Admin Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a3b3a9', fontSize: '12px', fontWeight: 'bold' }}>
                      {ann.is_pinned ? <Pin size={14} color={campBranding.secondaryColor} /> : <Megaphone size={14} color="#dc2626" />}
                      <span>{ann.is_pinned ? "PINNED ANNOUNCEMENT" : "Announcement"}</span>
                    </div>
                    {isCampAdminLogin && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => openEditAnnouncementModal(ann)} style={{ background: 'none', border: 'none', color: '#14532d', cursor: 'pointer', padding: 0 }}><Edit3 size={14} /></button>
                        <button onClick={() => handleDeleteAnnouncement(ann.id, 'this announcement')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                  
                  {/* Inline Name and Content with Quill Alignment Fixes */}
                  <div style={{ color: '#182821', fontSize: '15px', lineHeight: '1.5' }}>
                    <strong style={{ marginRight: '8px' }}>{ann.author_name}:</strong>
                    <span className="ql-snow" style={{ display: 'inline-block', verticalAlign: 'top', width: '100%' }}>
                      <span className="ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: ann.content }} />
                    </span>
                  </div>
                  
                  {/* Footer Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a3b3a9', fontSize: '12px', marginTop: '4px' }}>
                    <span>{campBranding.name}</span>
                    <span>{new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* About Section */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #d1ccc0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #efebe0', paddingBottom: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>About {campBranding.name}</h3>
          {isCampAdminLogin && !isEditingAbout && (
            <button onClick={() => { setTempAbout(campBranding.aboutText); setIsEditingAbout(true); }} style={{ background: 'none', border: 'none', color: campBranding.secondaryColor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              <Edit3 size={14} /> Edit
            </button>
          )}
        </div>
        
        {isEditingAbout ? (
          <div>
            <div style={{ backgroundColor: 'white', marginBottom: '15px' }}>
              <ReactQuill theme="snow" value={tempAbout} onChange={setTempAbout} modules={quillModules} style={{ height: '200px', marginBottom: '40px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsEditingAbout(false)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #d1ccc0', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleSaveCampInfo()} style={{ padding: '6px 12px', backgroundColor: '#14532d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Save size={14} /> Save</button>
            </div>
          </div>
        ) : (
          <div className="ql-snow" style={{ textAlign: 'left' }}>
            <div className="ql-editor" style={{ padding: 0, color: '#182821', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: campBranding.aboutText || "<p>Welcome to camp! Add a description here.</p>" }} />
          </div>
        )}
      </div>

      {/* Google Calendar Section */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #d1ccc0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #efebe0', paddingBottom: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Schedule of Events</h3>
        </div>

        {campBranding.googleCalendarId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: campBranding.secondaryColor, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarIcon size={16}/> Daily Agenda</h4>
              <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <iframe src={`https://calendar.google.com/calendar/embed?src=${campBranding.googleCalendarId}&mode=AGENDA&showTitle=0&showNav=0&showPrint=0&showTabs=0&showCalendars=0`} style={{border: 0}} width="100%" height="300" frameBorder="0" scrolling="no"></iframe>
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: campBranding.secondaryColor, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarIcon size={16}/> Monthly View</h4>
              <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <iframe src={`https://calendar.google.com/calendar/embed?src=${campBranding.googleCalendarId}&mode=MONTH&showTitle=0&showPrint=0&showCalendars=0`} style={{border: 0}} width="100%" height="400" frameBorder="0" scrolling="no"></iframe>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#a3b3a9', backgroundColor: '#f9f8f6', borderRadius: '6px', border: '1px dashed #d1ccc0' }}>
            {isCampAdminLogin ? "Connect a public Google Calendar ID in the Admin Settings to display the schedule." : "No schedule posted yet."}
          </div>
        )}
      </div>

    </div>
  )
}