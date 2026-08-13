import React, { useState } from 'react';
import { Settings, Palette, Sun, Moon, Shield, Sliders, Scale } from 'lucide-react';
import { THEMES } from '../App';

export default function SettingsTab({ colors, fonts, isDarkMode, setIsDarkMode, themeKey, setThemeKey, selectedPropertyName }) {
  const [successMessage, setSuccessMessage] = useState(null);

  function handleThemeChange(newKey) {
    setThemeKey(newKey);
    setSuccessMessage(`Theme updated to ${THEMES[newKey]?.name || newKey}!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: colors.textDark, fontFamily: fonts.body }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontFamily: fonts.header, margin: '0 0 6px 0', color: colors.textDark, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px' }}>
          <Settings size={28} color={colors.primary} /> SYSTEM & PROPERTY SETTINGS
        </h1>
        <p style={{ color: colors.muted, fontSize: '14px', margin: 0 }}>
          Manage global application preferences, interface themes, and property portal configurations for <strong style={{ color: colors.textDark }}>{selectedPropertyName || 'Trailhead Console'}</strong>.
        </p>
      </div>

      {successMessage && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(20, 83, 45, 0.4)', border: '1px solid #14532d', color: '#F1E8D0', fontFamily: fonts.utility, fontSize: '14px' }}>
          {successMessage}
        </div>
      )}

      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* THEME CUSTOMIZATION CARD */}
        <div style={{ backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontFamily: fonts.header, fontSize: '20px', margin: '0 0 12px 0', color: colors.textDark, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={20} color={colors.primary} /> Interface Theme
          </h3>
          <p style={{ fontSize: '13px', color: colors.muted, margin: '0 0 20px 0' }}>
            Choose a visual color palette inspired by professional service desks. Changes apply instantly across the entire console.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(THEMES).map(([key, t]) => {
              const isSelected = themeKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                    backgroundColor: isSelected ? (isDarkMode ? '#16281D' : '#EAF2ED') : 'transparent',
                    color: colors.textDark,
                    cursor: 'pointer',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{t.name}</span>
                  {isSelected && <span style={{ fontSize: '12px', color: colors.primary, fontFamily: fonts.utility }}>Active</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* DISPLAY MODE & PREFERENCES CARD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontFamily: fonts.header, fontSize: '20px', margin: '0 0 12px 0', color: colors.textDark, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color={colors.primary} /> Display Mode
            </h3>
            <p style={{ fontSize: '13px', color: colors.muted, margin: '0 0 20px 0' }}>
              Toggle between dark and light console rendering modes for shift adjustments.
            </p>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.primary,
                color: '#FFF',
                fontFamily: fonts.header,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                letterSpacing: '0.5px'
              }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              Switch to {isDarkMode ? 'Light Mode' : 'Light Mode'}
            </button>
          </div>

          <div style={{ backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontFamily: fonts.header, fontSize: '20px', margin: '0 0 12px 0', color: colors.textDark, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color={colors.primary} /> Property Portal Info
            </h3>
            <p style={{ fontSize: '13px', color: colors.muted, margin: '0 0 12px 0' }}>
              Active Property Context: <strong style={{ color: colors.textDark }}>{selectedPropertyName || 'Trailhead Admin Console'}</strong>
            </p>
            <p style={{ fontSize: '12px', color: colors.muted, margin: 0, fontFamily: fonts.utility }}>
              Settings modifications configured here synchronize with your active agent profile session.
            </p>
          </div>

        </div>

      </div>

      {/* LEGAL OWNERSHIP & COPYRIGHT STATEMENT */}
      <div style={{ marginTop: '20px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontFamily: fonts.header, fontSize: '20px', margin: '0 0 12px 0', color: colors.textDark, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Scale size={20} color={colors.primary} /> Legal Ownership & Proprietary Rights
        </h3>
        <p style={{ fontSize: '13px', color: colors.textDark, margin: '0 0 10px 0', lineHeight: 1.6 }}>
          © 2026 StupidRooster Studios & Squirrel Hill Media Group. All rights reserved. The Trailhead Application, interface layouts, backend schemas, and proprietary code architecture are protected under United States and international copyright, trademark, and intellectual property laws.
        </p>
        <p style={{ fontSize: '12px', color: colors.muted, margin: 0, fontFamily: fonts.utility }}>
          Unauthorized duplication, distribution, reverse engineering, or commercial deployment of this software system or its assets is strictly prohibited.
        </p>
      </div>

    </div>
  );
}