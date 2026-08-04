import { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export default function FeatureTransferList() {
  // Dummy data to test the component mechanics
  const [available, setAvailable] = useState([
    { id: 'feat_1', name: 'Camp Store' },
    { id: 'feat_2', name: 'Payments' },
    { id: 'feat_3', name: 'Maintenance Requests' },
    { id: 'feat_4', name: 'Interactive Map' },
    { id: 'feat_5', name: 'Team Performance Reviews' }
  ])
  
  const [assigned, setAssigned] = useState([
    { id: 'feat_6', name: 'Admin Dashboard', right: 'full' }
  ])

  const [selectedAvailable, setSelectedAvailable] = useState([])
  const [selectedAssigned, setSelectedAssigned] = useState([])

  // Move selected items to the right and default them to 'viewer'
  const moveToAssigned = () => {
    const itemsToMove = available
      .filter(item => selectedAvailable.includes(item.id))
      .map(item => ({ ...item, right: 'viewer' }))
    
    setAssigned([...assigned, ...itemsToMove])
    setAvailable(available.filter(item => !selectedAvailable.includes(item.id)))
    setSelectedAvailable([])
  }

  // Move selected items back to the left and strip their rights
  const moveToAvailable = () => {
    const itemsToMove = assigned
      .filter(item => selectedAssigned.includes(item.id))
      .map(item => ({ id: item.id, name: item.name }))
      
    setAvailable([...available, ...itemsToMove])
    setAssigned(assigned.filter(item => !selectedAssigned.includes(item.id)))
    setSelectedAssigned([])
  }

  const updateRightLevel = (id, newLevel) => {
    setAssigned(assigned.map(item => item.id === id ? { ...item, right: newLevel } : item))
  }

  const toggleSelection = (id, currentSelection, setSelection) => {
    if (currentSelection.includes(id)) {
      setSelection(currentSelection.filter(itemId => itemId !== id))
    } else {
      setSelection([...currentSelection, id])
    }
  }

  const listContainerStyle = {
    flex: 1,
    border: '1px solid #d1ccc0',
    borderRadius: '8px',
    backgroundColor: 'white',
    height: '350px',
    overflowY: 'auto',
    padding: '10px'
  }

  const itemStyle = (isSelected) => ({
    padding: '10px',
    marginBottom: '5px',
    borderRadius: '6px',
    backgroundColor: isSelected ? '#dcfce7' : '#f9f8f6',
    border: isSelected ? '1px solid #16a34a' : '1px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    color: '#182821'
  })

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 5px 0', color: '#14532d', textTransform: 'uppercase', fontFamily: "'Oswald', sans-serif" }}>
        Configure Feature Access
      </h3>
      <p style={{ margin: '0 0 20px 0', color: '#a3b3a9', fontSize: '14px' }}>
        Select features and assign permission levels for this account.
      </p>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        
        {/* Left List: Available Features */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#182821', fontSize: '14px' }}>
            Available Features
          </div>
          <div style={listContainerStyle}>
            {available.length === 0 ? (
              <div style={{ color: '#a3b3a9', textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>No features left.</div>
            ) : (
              available.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggleSelection(item.id, selectedAvailable, setSelectedAvailable)}
                  style={itemStyle(selectedAvailable.includes(item.id))}
                >
                  {item.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            onClick={moveToAssigned} 
            disabled={selectedAvailable.length === 0}
            style={{ padding: '10px', backgroundColor: selectedAvailable.length > 0 ? '#14532d' : '#e5e7eb', color: 'white', border: 'none', borderRadius: '6px', cursor: selectedAvailable.length > 0 ? 'pointer' : 'not-allowed' }}
          >
            <ChevronRight size={20} />
          </button>
          
          <button 
            onClick={moveToAvailable} 
            disabled={selectedAssigned.length === 0}
            style={{ padding: '10px', backgroundColor: selectedAssigned.length > 0 ? '#dc2626' : '#e5e7eb', color: 'white', border: 'none', borderRadius: '6px', cursor: selectedAssigned.length > 0 ? 'pointer' : 'not-allowed' }}
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Right List: Assigned Features */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#182821', fontSize: '14px' }}>
            Assigned Features & Rights
          </div>
          <div style={listContainerStyle}>
            {assigned.length === 0 ? (
              <div style={{ color: '#a3b3a9', textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>No features assigned.</div>
            ) : (
              assigned.map(item => (
                <div 
                  key={item.id} 
                  style={itemStyle(selectedAssigned.includes(item.id))}
                  onClick={(e) => {
                    // Prevent row selection if clicking the dropdown
                    if (e.target.tagName !== 'SELECT') {
                      toggleSelection(item.id, selectedAssigned, setSelectedAssigned)
                    }
                  }}
                >
                  <span>{item.name}</span>
                  <select 
                    value={item.right}
                    onChange={(e) => updateRightLevel(item.id, e.target.value)}
                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #d1ccc0', fontSize: '12px', cursor: 'pointer' }}
                  >
                    <option value="full">Full</option>
                    <option value="editor">Editor</option>
                    <option value="commenter">Commenter</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}