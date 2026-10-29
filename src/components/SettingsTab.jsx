import { useState } from 'react';
import { Settings, Palette, Sun, Moon, Shield, Sliders, Scale } from 'lucide-react';
import { THEMES } from '../themes';
import PageHeader from './PageHeader';

export default function SettingsTab({ colors, fonts, isDarkMode, setIsDarkMode, themeKey, setThemeKey, selectedPropertyName }) {
  const [successMessage, setSuccessMessage] = useState(null);

  function handleThemeChange(newKey) {
    setThemeKey(newKey);
    setSuccessMessage(`Theme updated to ${THEMES[newKey]?.name || newKey}!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  return (
    <div style={{ maxWidth: '1000px', width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '24px', color: colors.textDark, fontFamily: fonts.body }}>
      <PageHeader
        title="Settings"
        subtitle={<>Manage application preferences, themes, and property portal settings for <strong style={{ color: colors.textDark }}>{selectedPropertyName || 'Trailhead Console'}</strong>.</>}
        icon={Settings}
        colors={colors}
        fonts={fonts}
        eyebrow={<>ADMIN CONSOLE <span style={{ padding: '0 7px' }}>/</span> SETTINGS</>}
        padding="0"
      />

      {successMessage && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', backgroundColor: colors.highlight, border: `1px solid ${colors.border}`, color: colors.textDark, fontFamily: fonts.utility, fontSize: '14px' }}>
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
            Pick a palette with its own character. Changes apply instantly across the entire console.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
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
                    backgroundColor: isSelected ? colors.highlight : 'transparent',
                    color: colors.textDark,
                    cursor: 'pointer',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{t.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span aria-hidden="true" style={{ display: 'flex', gap: '4px' }}>
                      {[t[isDarkMode ? 'dark' : 'light'].background, t[isDarkMode ? 'dark' : 'light'].primary, t[isDarkMode ? 'dark' : 'light'].accent].map((swatch, index) => (
                        <span key={index} style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: swatch, border: `1px solid ${colors.border}` }} />
                      ))}
                    </span>
                    {isSelected && <span style={{ fontSize: '12px', color: colors.primary, fontFamily: fonts.utility }}>Active</span>}
                  </span>
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
                color: colors.textOnPrimary,
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
              Switch to {isDarkMode ? 'Light Mode' : 'Dark Mode'}
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