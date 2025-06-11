import { Theme } from '../context/ThemeContext'

// Semantic color mappings that work across all themes
export const getThemeColors = (theme: Theme) => ({
  // Status colors
  status: {
    success: {
      background: theme.id === 'dark' ? '#10b981' : '#10b981',
      text: '#ffffff',
      border: theme.id === 'dark' ? '#059669' : '#059669',
      light: theme.id === 'dark' ? '#10b98120' : '#f0fdf4',
      hover: theme.id === 'dark' ? '#059669' : '#059669'
    },
    warning: {
      background: theme.id === 'dark' ? '#f59e0b' : '#f59e0b',
      text: '#ffffff',
      border: theme.id === 'dark' ? '#d97706' : '#d97706',
      light: theme.id === 'dark' ? '#f59e0b20' : '#fffbeb',
      hover: theme.id === 'dark' ? '#d97706' : '#d97706'
    },
    error: {
      background: theme.id === 'dark' ? '#ef4444' : '#ef4444',
      text: '#ffffff',
      border: theme.id === 'dark' ? '#dc2626' : '#dc2626',
      light: theme.id === 'dark' ? '#ef444420' : '#fef2f2',
      hover: theme.id === 'dark' ? '#dc2626' : '#dc2626'
    },
    info: {
      background: theme.colors.primary[500],
      text: '#ffffff',
      border: theme.colors.primary[600],
      light: theme.id === 'dark' ? `${theme.colors.primary[500]}20` : theme.colors.primary[50],
      hover: theme.colors.primary[600]
    }
  },

  // Enhanced text colors with better saturation and contrast
  text: {
    primary: {
      color: theme.id === 'dark' ? '#ffffff' : '#0f172a',
      opacity: 1.0
    },
    secondary: {
      color: theme.id === 'dark' ? '#e2e8f0' : '#374151',
      opacity: 0.9
    },
    tertiary: {
      color: theme.id === 'dark' ? '#cbd5e1' : '#4b5563',
      opacity: 0.8
    },
    muted: {
      color: theme.id === 'dark' ? '#94a3b8' : '#6b7280',
      opacity: 0.7
    }
  },

  // Interactive states
  interactive: {
    primary: {
      background: theme.colors.primary[500],
      hover: theme.colors.primary[600],
      active: theme.colors.primary[700],
      text: '#ffffff',
      disabled: theme.colors.primary[300]
    },
    secondary: {
      background: theme.colors.background.secondary,
      hover: theme.id === 'dark' ? theme.colors.secondary[700] : theme.colors.secondary[100],
      active: theme.id === 'dark' ? theme.colors.secondary[600] : theme.colors.secondary[200],
      text: theme.id === 'dark' ? '#ffffff' : '#0f172a',
      border: theme.colors.border.primary
    }
  },

  // Project/task colors
  project: {
    blue: { background: '#3b82f6', text: '#ffffff', light: '#dbeafe' },
    purple: { background: '#8b5cf6', text: '#ffffff', light: '#e9d5ff' },
    green: { background: '#10b981', text: '#ffffff', light: '#d1fae5' },
    red: { background: '#ef4444', text: '#ffffff', light: '#fee2e2' },
    orange: { background: '#f59e0b', text: '#ffffff', light: '#fef3c7' },
    pink: { background: '#ec4899', text: '#ffffff', light: '#fce7f3' },
    indigo: { background: '#6366f1', text: '#ffffff', light: '#e0e7ff' },
    gray: { background: '#6b7280', text: '#ffffff', light: '#f3f4f6' },
    yellow: { background: '#eab308', text: '#ffffff', light: '#fefce8' },
    teal: { background: '#14b8a6', text: '#ffffff', light: '#f0fdfa' }
  },

  // Window chrome
  window: {
    controls: {
      close: { background: '#ef4444', hover: '#dc2626' },
      minimize: { background: '#f59e0b', hover: '#d97706' },
      maximize: { background: '#10b981', hover: '#059669' }
    }
  },

  // Overlays and shadows
  overlay: {
    backdrop: theme.id === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.6)',
    modal: theme.id === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
    dropdown: theme.id === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)'
  },

  // Shadow values
  shadows: {
    sm: theme.id === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
    md: theme.id === 'dark' ? '0 4px 8px rgba(0,0,0,0.3)' : '0 4px 8px rgba(0,0,0,0.1)',
    lg: theme.id === 'dark' ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.1)',
    xl: theme.id === 'dark' ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.15)'
  }
})

// Utility function to get semantic colors
export const useSemanticColors = (theme: Theme) => getThemeColors(theme)

// CSS custom property helpers
export const setThemeCustomProperties = (theme: Theme) => {
  const colors = getThemeColors(theme)
  const root = document.documentElement

  // Status colors
  root.style.setProperty('--color-success', colors.status.success.background)
  root.style.setProperty('--color-success-hover', colors.status.success.hover)
  root.style.setProperty('--color-success-light', colors.status.success.light)
  
  root.style.setProperty('--color-warning', colors.status.warning.background)
  root.style.setProperty('--color-warning-hover', colors.status.warning.hover)
  root.style.setProperty('--color-warning-light', colors.status.warning.light)
  
  root.style.setProperty('--color-error', colors.status.error.background)
  root.style.setProperty('--color-error-hover', colors.status.error.hover)
  root.style.setProperty('--color-error-light', colors.status.error.light)

  // Interactive colors
  root.style.setProperty('--color-interactive-hover', colors.interactive.secondary.hover)
  root.style.setProperty('--color-interactive-active', colors.interactive.secondary.active)

  // Overlay colors
  root.style.setProperty('--color-backdrop', colors.overlay.backdrop)
  root.style.setProperty('--color-modal', colors.overlay.modal)
} 