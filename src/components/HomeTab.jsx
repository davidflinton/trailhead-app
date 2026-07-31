import { Calendar as CalendarIcon, Edit3, Save, Pin, Trash2, Plus } from 'lucide-react'
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
      <h1 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Camp Feed</h1>
      
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
          <div 
            style={{ margin: 0, color: '#182821', lineHeight: '1.6' }} 
            dangerouslySetInnerHTML={{ __html: campBranding.aboutText || "<p>Welcome to camp! Add a description here.</p>" }} 
          />
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

      {/* Announcements Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <h2 style={{ margin: 0, color: '#182821', fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>Announcements</h2>
        {isCampAdminLogin && (
          <button onClick={openNewAnnouncementModal} style={{ padding: '8px 12px', backgroundColor: campBranding.secondaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={14} /> New Post
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {announcements.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#a3b3a9', backgroundColor: 'white', borderRadius: '8px', border: '1px dashed #d1ccc0' }}>No announcements yet.</div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: ann.is_pinned ? `2px solid ${campBranding.secondaryColor}` : '1px solid #d1ccc0', position: 'relative' }}>
              {ann.is_pinned && (
                <div style={{ position: 'absolute', top: '-10px', left: '20px', backgroundColor: campBranding.secondaryColor, color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Pin size={10} /> PINNED
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', marginTop: ann.is_pinned ? '5px' : '0' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: ann.is_pinned ? campBranding.secondaryColor : '#182821' }}>{ann.title}</h3>
                  <span style={{ fontSize: '12px', color: '#a3b3a9' }}>Posted by {ann.author_name} • {new Date(ann.created_at).toLocaleDateString()}</span>
                </div>
                {isCampAdminLogin && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openEditAnnouncementModal(ann)} style={{ background: 'none', border: 'none', color: '#14532d', cursor: 'pointer' }}><Edit3 size={16} /></button>
                    <button onClick={() => handleDeleteAnnouncement(ann.id, ann.title)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <div style={{ margin: 0, color: '#182821', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: ann.content }} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}