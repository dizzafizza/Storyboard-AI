import { Theme } from '../context/ThemeContext'

export const getThemeClasses = (theme: Theme) => {
  return {
    background: {
      primary: { backgroundColor: theme.colors.background.primary },
      secondary: { backgroundColor: theme.colors.background.secondary },
      tertiary: { backgroundColor: theme.colors.background.tertiary }
    },
    text: {
      primary: { color: theme.colors.text.primary },
      secondary: { color: theme.colors.text.secondary },
      tertiary: { color: theme.colors.text.tertiary }
    },
    border: {
      primary: { borderColor: theme.colors.border.primary },
      secondary: { borderColor: theme.colors.border.secondary }
    }
  }
}

// Enhanced theme utilities for consistent application
export const themeClasses = {
  // Background classes
  bg: {
    primary: 'bg-primary-theme',
    secondary: 'bg-secondary-theme',
    tertiary: 'bg-tertiary-theme'
  },
  
  // Text classes with improved contrast
  text: {
    primary: 'text-primary-theme',
    secondary: 'text-secondary-theme',
    tertiary: 'text-tertiary-theme',
    highContrast: 'text-high-contrast'
  },
  
  // Border classes
  border: {
    primary: 'border-primary-theme',
    secondary: 'border-secondary-theme'
  },
  
  // Button variants with theme support
  button: {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost'
  },
  
  // Input variants
  input: {
    modern: 'input-modern',
    textarea: 'textarea-modern',
    select: 'select-modern'
  },
  
  // Card variants
  card: {
    modern: 'card-modern',
    interactive: 'card-interactive'
  }
}

// Utility function to get theme-aware inline styles
export const getThemeStyles = (theme: Theme) => ({
  backgrounds: {
    primary: { backgroundColor: theme.colors.background.primary },
    secondary: { backgroundColor: theme.colors.background.secondary },
    tertiary: { backgroundColor: theme.colors.background.tertiary },
    gradient: {
      primary: { 
        background: `linear-gradient(135deg, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})` 
      },
      secondary: { 
        background: `linear-gradient(135deg, ${theme.colors.secondary[600]}, ${theme.colors.secondary[500]})` 
      },
      subtle: { 
        background: `linear-gradient(135deg, ${theme.colors.background.secondary}, ${theme.colors.background.tertiary})` 
      }
    }
  },
  
  text: {
    primary: { color: theme.colors.text.primary, fontWeight: 600 },
    secondary: { color: theme.colors.text.secondary, fontWeight: 500 },
    tertiary: { color: theme.colors.text.tertiary, fontWeight: 400 },
    highContrast: { 
      color: theme.colors.text.primary, 
      fontWeight: 700,
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    }
  },
  
  borders: {
    primary: { borderColor: theme.colors.border.primary },
    secondary: { borderColor: theme.colors.border.secondary },
    accent: { borderColor: theme.colors.primary[300] }
  },
  
  shadows: {
    primary: { 
      boxShadow: `0 4px 20px rgba(${theme.colors.primary[500]}, 0.15)` 
    },
    subtle: { 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
    },
    elevated: { 
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' 
    }
  }
})

// Function to apply theme to window elements
export const applyWindowTheme = (theme: Theme) => {
  return {
    container: {
      backgroundColor: theme.colors.background.primary,
      borderColor: theme.colors.border.primary,
      color: theme.colors.text.primary
    },
    header: {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border.primary
    },
    content: {
      backgroundColor: theme.colors.background.primary
    }
  }
}

// Enhanced color utilities
export const getColorWithOpacity = (color: string, opacity: number) => {
  // Convert hex to rgba
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Generate theme-aware gradient strings
export const getThemeGradient = (theme: Theme, direction: 'horizontal' | 'vertical' | 'diagonal' = 'diagonal') => {
  const directions = {
    horizontal: '90deg',
    vertical: '180deg',
    diagonal: '135deg'
  }
  
  return {
    primary: `linear-gradient(${directions[direction]}, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})`,
    secondary: `linear-gradient(${directions[direction]}, ${theme.colors.secondary[600]}, ${theme.colors.secondary[500]})`,
    subtle: `linear-gradient(${directions[direction]}, ${theme.colors.background.secondary}, ${theme.colors.background.tertiary})`,
    accent: `linear-gradient(${directions[direction]}, ${theme.colors.primary[500]}, ${theme.colors.primary[400]})`
  }
}

// Responsive theme utilities
export const getResponsiveThemeClasses = (baseClasses: string, mobileClasses?: string) => {
  return `${baseClasses} ${mobileClasses ? `md:${baseClasses} ${mobileClasses}` : ''}`
}

// Theme-aware animation classes
export const getAnimationClasses = (theme: Theme) => ({
  fadeIn: 'animate-fade-in',
  slideIn: 'animate-slide-in',
  scaleIn: 'animate-scale-in',
  glow: theme.id === 'dark' ? 'animate-glow' : 'animate-pulse',
  float: 'animate-float',
  wiggle: 'animate-wiggle'
})

export const getButtonClasses = (theme: Theme, variant: 'primary' | 'secondary' = 'primary') => {
  if (variant === 'primary') {
    return {
      backgroundColor: theme.colors.primary[600],
      color: 'white',
      borderColor: theme.colors.primary[600]
    }
  }
  
  return {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
    borderColor: theme.colors.border.primary
  }
}

export const getCardClasses = (theme: Theme, interactive: boolean = false) => {
  return {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.border.primary,
    ...(interactive && {
      ':hover': {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.border.secondary
      }
    })
  }
}

export const getScrollbarClasses = (theme: Theme) => {
  return {
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.colors.primary[400]} transparent`,
    '&::-webkit-scrollbar': {
      width: '6px',
      height: '6px'
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent'
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.colors.primary[400],
      borderRadius: '3px'
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: theme.colors.primary[500]
    }
  }
} 