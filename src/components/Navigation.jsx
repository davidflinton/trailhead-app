import { CalendarDays, Home, Menu, UserRound, Users } from 'lucide-react'

const primaryTabs = [
  { id: 'news', label: 'Home', Icon: Home },
  { id: 'events', label: 'Events', Icon: CalendarDays },
  { id: 'social', label: 'Community', Icon: Users },
  { id: 'profile', label: 'Profile', Icon: UserRound },
]

export default function Navigation({ activeTab, setActiveTab, setIsMoreOpen, isMoreOpen, colors, fonts }) {
  const isMoreActive = !primaryTabs.some((tab) => tab.id === activeTab)

  const buttonStyle = (isActive) => ({
    display: 'flex',
    flex: '1 1 0',
    minWidth: 0,
    minHeight: '48px',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    padding: '6px 4px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: isActive ? colors.highlight : 'transparent',
    color: isActive ? colors.primary : colors.textLight,
    cursor: 'pointer',
    fontFamily: fonts.body,
    fontSize: '12px',
    fontWeight: isActive ? 'bold' : 'normal',
    lineHeight: 1.2,
    transition: 'background-color 0.2s, color 0.2s',
    WebkitTapHighlightColor: 'transparent',
  })

  return (
    <nav
      aria-label="Main navigation"
      style={{
        display: 'flex',
        flex: '0 0 auto',
        alignItems: 'stretch',
        gap: '4px',
        padding: '8px 8px calc(8px + env(safe-area-inset-bottom))',
        backgroundColor: colors.sidebar,
        borderTop: `1px solid ${colors.highlight}`,
        zIndex: 10,
      }}
    >
      {primaryTabs.map(({ id, label, Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            aria-current={isActive ? 'page' : undefined}
            style={buttonStyle(isActive)}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => setIsMoreOpen(true)}
        aria-current={isMoreActive ? 'page' : undefined}
        aria-expanded={isMoreOpen}
        aria-label="Open more options"
        style={buttonStyle(isMoreActive || isMoreOpen)}
      >
        <Menu size={20} aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  )
}
