import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { setThemeCustomProperties } from '../utils/themeColors'

export type ThemeVariant = 'light' | 'dark' | 'purple' | 'blue' | 'green' | 'orange' | 'rose' | 'emerald' | 'teal' | 'amber' | 'violet' | 'slate'

export interface Theme {
  id: ThemeVariant
  name: string
  colors: {
    primary: {
      50: string
      100: string
      200: string
      300: string
      400: string
      500: string
      600: string
      700: string
      800: string
      900: string
    }
    secondary: {
      50: string
      100: string
      200: string
      300: string
      400: string
      500: string
      600: string
      700: string
      800: string
      900: string
    }
    background: {
      primary: string
      secondary: string
      tertiary: string
    }
    text: {
      primary: string
      secondary: string
      tertiary: string
    }
    border: {
      primary: string
      secondary: string
    }
  }
}

export const themes: Record<ThemeVariant, Theme> = {
  light: {
    id: 'light',
    name: 'Light',
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      secondary: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      background: {
        primary: '#ffffff',
        secondary: '#f9fafb',
        tertiary: '#f3f4f6',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#e5e7eb',
        secondary: '#d1d5db',
      },
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    colors: {
      primary: {
        50: '#1e293b',
        100: '#334155',
        200: '#475569',
        300: '#64748b',
        400: '#94a3b8',
        500: '#cbd5e1',
        600: '#e2e8f0',
        700: '#f1f5f9',
        800: '#f8fafc',
        900: '#ffffff',
      },
      secondary: {
        50: '#0f172a',
        100: '#1e293b',
        200: '#334155',
        300: '#475569',
        400: '#64748b',
        500: '#94a3b8',
        600: '#cbd5e1',
        700: '#e2e8f0',
        800: '#f1f5f9',
        900: '#f8fafc',
      },
      background: {
        primary: '#0f172a',
        secondary: '#1e293b',
        tertiary: '#334155',
      },
      text: {
        primary: '#f8fafc',
        secondary: '#cbd5e1',
        tertiary: '#94a3b8',
      },
      border: {
        primary: '#334155',
        secondary: '#475569',
      },
    },
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    colors: {
      primary: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
        800: '#6b21a8',
        900: '#581c87',
      },
      secondary: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      background: {
        primary: '#ffffff',
        secondary: '#faf5ff',
        tertiary: '#f3e8ff',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#e9d5ff',
        secondary: '#d8b4fe',
      },
    },
  },
  blue: {
    id: 'blue',
    name: 'Ocean Blue',
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      secondary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      background: {
        primary: '#ffffff',
        secondary: '#eff6ff',
        tertiary: '#dbeafe',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#bfdbfe',
        secondary: '#93c5fd',
      },
    },
  },
  green: {
    id: 'green',
    name: 'Forest Green',
    colors: {
      primary: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      secondary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      background: {
        primary: '#ffffff',
        secondary: '#f0fdf4',
        tertiary: '#dcfce7',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#bbf7d0',
        secondary: '#86efac',
      },
    },
  },
  orange: {
    id: 'orange',
    name: 'Sunset Orange',
    colors: {
      primary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
      },
      secondary: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      background: {
        primary: '#ffffff',
        secondary: '#fff7ed',
        tertiary: '#ffedd5',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#fed7aa',
        secondary: '#fdba74',
      },
    },
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    colors: {
      primary: {
        50: '#fff1f2',
        100: '#ffe4e6',
        200: '#fecdd3',
        300: '#fda4af',
        400: '#fb7185',
        500: '#f43f5e',
        600: '#e11d48',
        700: '#be123c',
        800: '#9f1239',
        900: '#881337',
      },
      secondary: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      background: {
        primary: '#ffffff',
        secondary: '#fff1f2',
        tertiary: '#ffe4e6',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#fecdd3',
        secondary: '#fda4af',
      },
    },
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    colors: {
      primary: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
      },
      secondary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      background: {
        primary: '#ffffff',
        secondary: '#ecfdf5',
        tertiary: '#d1fae5',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#a7f3d0',
        secondary: '#6ee7b7',
      },
    },
  },
  teal: {
    id: 'teal',
    name: 'Teal',
    colors: {
      primary: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
      },
      secondary: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      background: {
        primary: '#ffffff',
        secondary: '#f0fdfa',
        tertiary: '#ccfbf1',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#99f6e4',
        secondary: '#5eead4',
      },
    },
  },
  amber: {
    id: 'amber',
    name: 'Amber',
    colors: {
      primary: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },
      secondary: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      background: {
        primary: '#ffffff',
        secondary: '#fffbeb',
        tertiary: '#fef3c7',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#fde68a',
        secondary: '#fcd34d',
      },
    },
  },
  violet: {
    id: 'violet',
    name: 'Violet',
    colors: {
      primary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
      },
      secondary: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      background: {
        primary: '#ffffff',
        secondary: '#f5f3ff',
        tertiary: '#ede9fe',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#ddd6fe',
        secondary: '#c4b5fd',
      },
    },
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    colors: {
      primary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      secondary: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#6b7280',
      },
      border: {
        primary: '#e2e8f0',
        secondary: '#cbd5e1',
      },
    },
  },
}

interface ThemeState {
  currentTheme: ThemeVariant
  theme: Theme
}

type ThemeAction = 
  | { type: 'SET_THEME'; payload: ThemeVariant }

// This function runs once to determine the initial state,
// ensuring it's in sync with the pre-loader script in index.html.
const getInitialState = (): ThemeState => {
  let initialTheme: ThemeVariant = 'light';
  if (typeof window !== 'undefined') {
    try {
      const savedTheme = localStorage.getItem('storyboard-theme') as ThemeVariant;
      // We only care about light/dark for the initial state.
      // Other themes are variations of light and are applied by user action.
      if (savedTheme && themes[savedTheme]) {
        initialTheme = savedTheme;
      }
    } catch (e) {
      console.warn('Could not access localStorage to get initial theme.');
    }
  }
  return {
    currentTheme: initialTheme,
    theme: themes[initialTheme] || themes.light,
  };
};

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME':
      const newTheme = themes[action.payload]
      if (!newTheme) return state; // Safety check

      // Save to localStorage for the next page load
      try {
        localStorage.setItem('storyboard-theme', action.payload)
      } catch (e) {
        console.warn('Could not save theme to localStorage.');
      }

      return {
        currentTheme: action.payload,
        theme: newTheme,
      }
    default:
      return state
  }
}

const ThemeContext = createContext<{
  state: ThemeState
  dispatch: React.Dispatch<ThemeAction>
  setTheme: (theme: ThemeVariant) => void
} | null>(null)

// Function to update CSS variables based on theme
function updateCSSVariables(theme: Theme) {
  const root = document.documentElement

  // Update primary color variables
  root.style.setProperty('--primary-50', theme.colors.primary[50])
  root.style.setProperty('--primary-100', theme.colors.primary[100])
  root.style.setProperty('--primary-200', theme.colors.primary[200])
  root.style.setProperty('--primary-300', theme.colors.primary[300])
  root.style.setProperty('--primary-400', theme.colors.primary[400])
  root.style.setProperty('--primary-500', theme.colors.primary[500])
  root.style.setProperty('--primary-600', theme.colors.primary[600])
  root.style.setProperty('--primary-700', theme.colors.primary[700])
  root.style.setProperty('--primary-800', theme.colors.primary[800])
  root.style.setProperty('--primary-900', theme.colors.primary[900])

  // Update background variables
  root.style.setProperty('--bg-primary', theme.colors.background.primary)
  root.style.setProperty('--bg-secondary', theme.colors.background.secondary)
  root.style.setProperty('--bg-tertiary', theme.colors.background.tertiary)

  // Update text variables with enhanced contrast
  root.style.setProperty('--text-primary', theme.colors.text.primary)
  root.style.setProperty('--text-secondary', theme.colors.text.secondary)
  root.style.setProperty('--text-tertiary', theme.colors.text.tertiary)

  // Update border variables
  root.style.setProperty('--border-primary', theme.colors.border.primary)
  root.style.setProperty('--border-secondary', theme.colors.border.secondary)

  // Set data attribute for theme-specific CSS
  root.setAttribute('data-theme', theme.id)
  
  // Update scrollbar colors based on theme
  if (theme.id === 'dark') {
    root.style.setProperty('--scrollbar-track', 'rgba(255, 255, 255, 0.05)')
    root.style.setProperty('--scrollbar-thumb', 'rgba(255, 255, 255, 0.2)')
    root.style.setProperty('--scrollbar-thumb-hover', 'rgba(255, 255, 255, 0.3)')
  } else {
    root.style.setProperty('--scrollbar-track', 'rgba(0, 0, 0, 0.05)')
    root.style.setProperty('--scrollbar-thumb', 'rgba(0, 0, 0, 0.2)')
    root.style.setProperty('--scrollbar-thumb-hover', 'rgba(0, 0, 0, 0.3)')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The third argument to useReducer is an initializer function.
  // It runs only once, before the component mounts, ensuring no flicker.
  const [state, dispatch] = useReducer(themeReducer, undefined, getInitialState)

  // This useEffect now only runs when the theme is changed by the user in the app.
  // The initial theme setting is handled by the script in index.html and the
  // useReducer initializer, which are synchronous.
  useEffect(() => {
    updateCSSVariables(state.theme)
    setThemeCustomProperties(state.theme)
  }, [state.theme])

  const setTheme = (theme: ThemeVariant) => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }

  return (
    <ThemeContext.Provider value={{ state, dispatch, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 