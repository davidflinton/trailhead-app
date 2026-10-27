export const THEMES = {
  classic: {
    name: 'Trailhead Classic',
    dark: { background: '#16281D', sidebar: '#0F1D14', panel: '#0F1D14', border: '#2A4731', textDark: '#F1E8D0', textLight: '#F1E8D0', textOnPrimary: '#FFFFFF', muted: '#8A9A8F', primary: '#C1531B', accent: '#D5A64A', error: '#E8896B', highlight: '#1E3524' },
    light: { background: '#F4F7F5', sidebar: '#FFFFFF', panel: '#FFFFFF', border: '#D1DCD5', textDark: '#1A2E22', textLight: '#1A2E22', textOnPrimary: '#FFFFFF', muted: '#5C7365', primary: '#C1531B', accent: '#9A7022', error: '#B83E37', highlight: '#E2ECE5' }
  },
  minimal: {
    name: 'Charcoal Minimal',
    dark: { background: '#0A0A0A', sidebar: '#121212', panel: '#181818', border: '#2C2C2C', textDark: '#FFFFFF', textLight: '#FFFFFF', textOnPrimary: '#0A0A0A', muted: '#A1A1AA', primary: '#E5E7EB', accent: '#A1A1AA', error: '#EF4444', highlight: '#242424' },
    light: { background: '#F4F4F5', sidebar: '#FFFFFF', panel: '#FFFFFF', border: '#D4D4D8', textDark: '#18181B', textLight: '#18181B', textOnPrimary: '#FFFFFF', muted: '#71717A', primary: '#333333', accent: '#71717A', error: '#DC2626', highlight: '#E4E4E7' }
  },
  ocean: {
    name: 'Deep Ocean',
    dark: { background: '#07151D', sidebar: '#0B202A', panel: '#102833', border: '#244551', textDark: '#E3F3F4', textLight: '#E3F3F4', textOnPrimary: '#06212A', muted: '#8EAEB3', primary: '#59C3C3', accent: '#F1A77C', error: '#F17878', highlight: '#173640' },
    light: { background: '#EFF7F7', sidebar: '#E4F0F1', panel: '#FFFFFF', border: '#C7DCDD', textDark: '#17333A', textLight: '#17333A', textOnPrimary: '#FFFFFF', muted: '#607D83', primary: '#12676D', accent: '#B65E3C', error: '#BE4251', highlight: '#D9EBEC' }
  },
  rust: {
    name: 'Ember Rust',
    dark: { background: '#1A1212', sidebar: '#241817', panel: '#2C1E1B', border: '#4C332D', textDark: '#F7EDE7', textLight: '#F7EDE7', textOnPrimary: '#24110A', muted: '#B49A90', primary: '#F09A62', accent: '#E8C779', error: '#FF8278', highlight: '#3A2925' },
    light: { background: '#FBF3EE', sidebar: '#F5E9E1', panel: '#FFFFFF', border: '#E7CEC0', textDark: '#3A2722', textLight: '#3A2722', textOnPrimary: '#FFFFFF', muted: '#82685E', primary: '#B84F27', accent: '#80631C', error: '#B93838', highlight: '#F1DFD3' }
  },
  midnight: {
    name: 'Midnight & Marigold',
    dark: { background: '#111A2B', sidebar: '#17243A', panel: '#1D2D45', border: '#35465F', textDark: '#F1F0E8', textLight: '#F1F0E8', textOnPrimary: '#211A0D', muted: '#A8B1C0', primary: '#E8B94F', accent: '#E58D68', error: '#F07C78', highlight: '#293951' },
    light: { background: '#F4F2EA', sidebar: '#E9E6DA', panel: '#FFFFFF', border: '#D8D2C2', textDark: '#272B33', textLight: '#272B33', textOnPrimary: '#211A0D', muted: '#71727A', primary: '#D4A43B', accent: '#B75E43', error: '#BC4350', highlight: '#E8E3D5' }
  },
  lagoon: {
    name: 'Coastal Lagoon',
    dark: { background: '#102323', sidebar: '#17302F', panel: '#1D3A39', border: '#365856', textDark: '#EAF3EC', textLight: '#EAF3EC', textOnPrimary: '#102323', muted: '#9CB7B1', primary: '#75C7B5', accent: '#F09A84', error: '#F17878', highlight: '#294A48' },
    light: { background: '#EFF6F1', sidebar: '#E2EEE8', panel: '#FFFFFF', border: '#C9DDD4', textDark: '#203632', textLight: '#203632', textOnPrimary: '#FFFFFF', muted: '#67847C', primary: '#286B5D', accent: '#B96353', error: '#BF4550', highlight: '#D8E9E1' }
  },
  plum: {
    name: 'Plum & Champagne',
    dark: { background: '#211928', sidebar: '#2C2133', panel: '#35283D', border: '#51405A', textDark: '#F4EEF2', textLight: '#F4EEF2', textOnPrimary: '#241729', muted: '#B7A9B7', primary: '#D3A9C7', accent: '#E7C986', error: '#F08083', highlight: '#44354A' },
    light: { background: '#F7F1F5', sidebar: '#EEE3ED', panel: '#FFFFFF', border: '#DFCDDD', textDark: '#342738', textLight: '#342738', textOnPrimary: '#FFFFFF', muted: '#806D80', primary: '#79466C', accent: '#92702D', error: '#B94350', highlight: '#EADDE9' }
  },
  terracotta: {
    name: 'Terracotta & Sky',
    dark: { background: '#211B1B', sidebar: '#2D2423', panel: '#382C2A', border: '#58423D', textDark: '#F5EEE8', textLight: '#F5EEE8', textOnPrimary: '#2B1813', muted: '#B8A49B', primary: '#E18B6B', accent: '#80B9C9', error: '#F07878', highlight: '#493632' },
    light: { background: '#F8F1EB', sidebar: '#EFE4DA', panel: '#FFFFFF', border: '#E1CFC1', textDark: '#382923', textLight: '#382923', textOnPrimary: '#FFFFFF', muted: '#806D63', primary: '#9C4B31', accent: '#397B8C', error: '#B83F46', highlight: '#EDDED2' }
  },
  indigo: {
    name: 'Indigo & Persimmon',
    dark: { background: '#171A2C', sidebar: '#20243B', panel: '#292E49', border: '#414A68', textDark: '#EEF0F8', textLight: '#EEF0F8', textOnPrimary: '#261710', muted: '#A6ADC3', primary: '#F09A68', accent: '#8FA4E8', error: '#F17878', highlight: '#343A57' },
    light: { background: '#F2F2F8', sidebar: '#E7E8F2', panel: '#FFFFFF', border: '#D2D5E4', textDark: '#282D43', textLight: '#282D43', textOnPrimary: '#FFFFFF', muted: '#6E748D', primary: '#9F4929', accent: '#5369B0', error: '#B83F50', highlight: '#DFE2F0' }
  },
  berry: {
    name: 'Berry & Blush',
    dark: { background: '#25171F', sidebar: '#321E2A', panel: '#3C2633', border: '#5B3B4B', textDark: '#F6EDF1', textLight: '#F6EDF1', textOnPrimary: '#2C1020', muted: '#B9A1AD', primary: '#E28BAA', accent: '#E6BE75', error: '#F17B80', highlight: '#4A3040' },
    light: { background: '#FAF1F4', sidebar: '#F1E3E9', panel: '#FFFFFF', border: '#E5CFDA', textDark: '#3B2732', textLight: '#3B2732', textOnPrimary: '#FFFFFF', muted: '#826A77', primary: '#B34F76', accent: '#8F6A26', error: '#B83E4C', highlight: '#EEDDE5' }
  },
  jade: {
    name: 'Jade & Brass',
    dark: { background: '#14211F', sidebar: '#1A2D2A', panel: '#223936', border: '#3A554E', textDark: '#ECF1E8', textLight: '#ECF1E8', textOnPrimary: '#102520', muted: '#A2B4A8', primary: '#8DC4A3', accent: '#D7B66D', error: '#F17878', highlight: '#2E4942' },
    light: { background: '#F1F5EF', sidebar: '#E5EEE5', panel: '#FFFFFF', border: '#CBDACD', textDark: '#26372F', textLight: '#26372F', textOnPrimary: '#FFFFFF', muted: '#687C6F', primary: '#356B4A', accent: '#8B6B24', error: '#B9414A', highlight: '#DDE9DE' }
  },
  cobalt: {
    name: 'Cobalt & Apricot',
    dark: { background: '#111B2B', sidebar: '#182840', panel: '#20334D', border: '#394E69', textDark: '#EDF2F6', textLight: '#EDF2F6', textOnPrimary: '#17253B', muted: '#A2B2C4', primary: '#8BB8E8', accent: '#F0A77A', error: '#F17878', highlight: '#2B405B' },
    light: { background: '#F0F5F9', sidebar: '#E2EBF3', panel: '#FFFFFF', border: '#CAD9E7', textDark: '#253448', textLight: '#253448', textOnPrimary: '#FFFFFF', muted: '#677B90', primary: '#356C9D', accent: '#B9613C', error: '#BC4350', highlight: '#DCE8F1' }
  },
  orchid: {
    name: 'Orchid & Mint',
    dark: { background: '#201A2B', sidebar: '#2B2238', panel: '#352A43', border: '#50405F', textDark: '#F0EDF4', textLight: '#F0EDF4', textOnPrimary: '#24182B', muted: '#B2A9BD', primary: '#C0A2DE', accent: '#8AC8B4', error: '#F17878', highlight: '#43354F' },
    light: { background: '#F5F1F8', sidebar: '#EBE4F1', panel: '#FFFFFF', border: '#D9CDE3', textDark: '#342B3E', textLight: '#342B3E', textOnPrimary: '#FFFFFF', muted: '#776C83', primary: '#69467F', accent: '#43826B', error: '#B94250', highlight: '#E6DDEC' }
  },
  desert: {
    name: 'Desert Dusk',
    dark: { background: '#211C22', sidebar: '#2D252C', panel: '#382D34', border: '#56434B', textDark: '#F4EEEA', textLight: '#F4EEEA', textOnPrimary: '#2C1D1D', muted: '#B4A5A1', primary: '#D99478', accent: '#A9A0C6', error: '#F17878', highlight: '#483840' },
    light: { background: '#F7F1ED', sidebar: '#EDE4DF', panel: '#FFFFFF', border: '#DDCFC7', textDark: '#382D2D', textLight: '#382D2D', textOnPrimary: '#FFFFFF', muted: '#7D706E', primary: '#854432', accent: '#6E668B', error: '#B7414D', highlight: '#EAE0DB' }
  },
  alpine: {
    name: 'Alpine Lake',
    dark: { background: '#111D25', sidebar: '#192A33', panel: '#213740', border: '#3B555C', textDark: '#EAF1EE', textLight: '#EAF1EE', textOnPrimary: '#10252A', muted: '#9FB4B5', primary: '#78B9B5', accent: '#E1B978', error: '#F17878', highlight: '#2D464D' },
    light: { background: '#EFF5F3', sidebar: '#E1ECE9', panel: '#FFFFFF', border: '#C8D9D6', textDark: '#26383A', textLight: '#26383A', textOnPrimary: '#FFFFFF', muted: '#687E80', primary: '#2E6663', accent: '#99702E', error: '#BA414D', highlight: '#D9E8E5' }
  }
}
