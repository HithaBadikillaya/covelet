

export const Colors = {
  light: {
    // Core (The Scrapbook Palette)
    background: '#FDFBF7',  // Warm cream paper
    surface: '#FFFFFF',
    primary: '#4A6741',     // Sage Green (Calm / Organic)
    secondary: '#D4A373',   // Washi Tan (Tape / Wood)
    tertiary: '#A68B6D',    // Earth Brown (Leather / Cardboard)

    // Text (Soft but legible)
    text: '#2F2E2C',        // Deep Charcoal (not pure black)
    textMuted: '#7A7875',

    // UI States
    error: '#C64B4B',       // Muted Red
    success: '#6B8E60',      // Deep Grass
    warning: '#D99141',     // Amber

    // Borders & Elements
    border: '#E8E2D9',      // Subtle paper fold border
    input: '#FFFFFF',
    ring: '#4A6741',

    // Muted/Disabled
    muted: '#F0EBE0',
    mutedForeground: '#99948D',

    // Cards & Surfaces
    card: '#FFFFFF',
    cardForeground: '#2F2E2C',

    // Popover/Dropdown
    popover: '#FFFFFF',
    popoverForeground: '#2F2E2C',

    // Legacy compatibility (maps to new tokens)
    tint: '#4A6741',
    icon: '#2F2E2C',
    tabIconDefault: '#99948D',
    tabIconSelected: '#4A6741',
    ocean: '#4A6741',
    sand: '#E8E2D9',
    white: '#FFFFFF',
  },
  dark: {
    // Single theme app - keep light for that "printed" feel
    background: '#FDFBF7',
    surface: '#FFFFFF',
    primary: '#4A6741',
    secondary: '#D4A373',
    tertiary: '#A68B6D',
    text: '#2F2E2C',
    textMuted: '#7A7875',
    error: '#C64B4B',
    success: '#6B8E60',
    warning: '#D99141',
    border: '#E8E2D9',
    input: '#FFFFFF',
    ring: '#4A6741',
    muted: '#F0EBE0',
    mutedForeground: '#99948D',
    card: '#FFFFFF',
    cardForeground: '#2F2E2C',
    popover: '#FFFFFF',
    popoverForeground: '#2F2E2C',
    tint: '#4A6741',
    icon: '#2F2E2C',
    tabIconDefault: '#99948D',
    tabIconSelected: '#4A6741',
    ocean: '#4A6741',
    sand: '#E8E2D9',
    white: '#FFFFFF',
  },
};

export const Fonts = {
  heading: 'Nunito_800ExtraBold',
  subheading: 'Nunito_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_700Bold',
};

export const Layout = {
  radiusSmall: 0,
  radiusMedium: 0,
  radiusLarge: 0,
  cardPadding: 16,
  pagePadding: 20,
};
