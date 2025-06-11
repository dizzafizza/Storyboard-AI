import { Palette, Check, X, Sparkles, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, themes, ThemeVariant } from '../context/ThemeContext'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import WindowFrame from './WindowFrame'

interface ThemeSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function ThemeSettings({ isOpen, onClose }: ThemeSettingsProps) {
  const { state, setTheme } = useTheme()
  const [isChangingTheme, setIsChangingTheme] = useState(false)
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeVariant>(state.currentTheme)
  const gridRef = useRef<HTMLDivElement>(null)
  
  // Memoize theme entries to prevent unnecessary recalculations
  const themeEntries = useMemo(() => Object.values(themes), [])
  
  // Memoized theme descriptions to prevent recreation
  const themeDescriptions = useMemo(() => ({
    light: '☀️ Classic & Clean',
    dark: '🌙 Easy on the Eyes',
    purple: '🎨 Creative & Artistic',
    blue: '💼 Professional & Calm',
    green: '🌿 Natural & Fresh',
    orange: '🔥 Warm & Energetic',
    rose: '🌹 Elegant & Romantic',
    emerald: '💎 Rich & Vibrant',
    teal: '🌊 Cool & Modern',
    amber: '☀️ Bright & Cheerful',
    violet: '🔮 Mysterious & Bold',
    slate: '🏔️ Minimal & Sophisticated'
  }), [])

  // Debounced theme change handler for better performance
  const handleThemeChange = useCallback(async (themeId: ThemeVariant) => {
    if (isChangingTheme || themeId === state.currentTheme) return
    
    setIsChangingTheme(true)
    setSelectedThemeId(themeId)
    
    // Add slight delay for smoother visual transition
    await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      setTheme(themeId)
    } finally {
      // Reset changing state after animation completes
      setTimeout(() => setIsChangingTheme(false), 300)
    }
  }, [setTheme, state.currentTheme, isChangingTheme])

  // Enhanced close handler with cleanup
  const handleClose = useCallback(() => {
    if (isChangingTheme) return
    onClose()
  }, [onClose, isChangingTheme])

  // Sync selected theme with current theme
  useEffect(() => {
    setSelectedThemeId(state.currentTheme)
  }, [state.currentTheme])

  if (!isOpen) return null

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={handleClose}
      title="Theme Settings"
      subtitle={`Customize your workspace appearance • ${themeEntries.length} themes available`}
      icon={<Palette className="w-5 h-5" />}
      defaultWidth="min(95vw, 1000px)"
      defaultHeight="min(90vh, 700px)"
      maxWidth="98vw"
      maxHeight="98vh"
      resizable={true}
      minimizable={true}
      maximizable={true}
      windowId="theme-settings"
      zIndex={9100}
    >
      <div className="h-full flex flex-col transform-gpu">
        {/* Optimized Theme Mode Indicators */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-primary/20 bg-secondary/30 backdrop-blur-sm">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${state.theme.colors.primary[600]}, ${state.theme.colors.primary[700]})`
              }}
            >
              <Palette className="w-4 h-4 text-white" />
            </div>
            <div className="text-xs sm:text-sm text-secondary">
              Choose your preferred theme
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Simplified Theme Mode Indicators */}
            <div 
              className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200"
              style={{
                backgroundColor: `${state.theme.colors.background.tertiary}50`,
                borderColor: `${state.theme.colors.border.primary}40`
              }}
            >
              <Sun className="w-4 h-4 opacity-60" style={{ color: state.theme.colors.text.secondary }} />
              <Monitor className="w-4 h-4 opacity-60" style={{ color: state.theme.colors.text.secondary }} />
              <Moon className="w-4 h-4 opacity-60" style={{ color: state.theme.colors.text.secondary }} />
            </div>
            
            <button
              onClick={handleClose}
              disabled={isChangingTheme}
              className="p-2 sm:p-3 rounded-xl transition-all duration-200 border border-transparent hover:shadow-lg group disabled:opacity-50"
              style={{ color: state.theme.colors.text.secondary }}
              onMouseEnter={(e) => {
                if (isChangingTheme) return
                e.currentTarget.style.backgroundColor = `${state.theme.colors.background.tertiary}80`
                e.currentTarget.style.borderColor = `${state.theme.colors.border.primary}60`
                e.currentTarget.style.color = state.theme.colors.text.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.color = state.theme.colors.text.secondary
              }}
            >
              <X className="w-5 h-5 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Enhanced Themes Grid with Optimized Animations */}
        <div 
          className="p-4 sm:p-6 overflow-y-auto flex-1 scrollable"
          style={{
            backgroundColor: `${state.theme.colors.background.tertiary}20`,
            color: state.theme.colors.text.primary
          }}
        >
          {/* Current Theme Banner - Optimized */}
          <div 
            className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border backdrop-blur-sm transition-all duration-300"
            style={{
              background: `linear-gradient(to right, ${state.theme.colors.primary[500]}20, ${state.theme.colors.primary[600]}20)`,
              borderColor: `${state.theme.colors.border.primary}60`
            }}
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div 
                className="w-8 h-8 rounded-full border-2 shadow-lg transition-all duration-500"
                style={{ 
                  backgroundColor: state.theme.colors.primary[600],
                  borderColor: `${state.theme.colors.primary[300]}60`,
                  animation: isChangingTheme ? 'pulse 1s ease-in-out infinite' : 'none'
                }}
              />
              <div className="flex-1">
                <p 
                  className="text-base sm:text-lg font-semibold transition-colors duration-200"
                  style={{ color: state.theme.colors.text.primary }}
                >
                  Current Theme: {state.theme.name}
                </p>
                <p 
                  className="text-xs sm:text-sm transition-colors duration-200"
                  style={{ color: state.theme.colors.text.secondary }}
                >
                  {isChangingTheme ? 'Applying theme changes...' : 'Theme changes are saved automatically and persist across sessions'}
                </p>
              </div>
              <Sparkles 
                className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300" 
                style={{ 
                  color: state.theme.colors.text.primary,
                  animation: isChangingTheme ? 'spin 1s linear infinite' : 'none'
                }}
              />
            </div>
          </div>

          <div 
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
          >
            {themeEntries.map((theme) => {
              const isSelected = selectedThemeId === theme.id
              const isCurrentTheme = state.currentTheme === theme.id
              
              return (
                <div
                  key={theme.id}
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 overflow-hidden group transform-gpu ${
                    isSelected
                      ? 'border-primary-400 ring-2 ring-primary-200/50 shadow-xl shadow-primary-500/20 scale-105'
                      : 'border-primary/30 hover:border-primary/60 hover:shadow-lg hover:scale-102'
                  } ${isChangingTheme && !isSelected ? 'opacity-60 pointer-events-none' : ''}`}
                  style={{
                    willChange: 'transform, box-shadow',
                    transform: `translateZ(0) ${isSelected ? 'scale(1.02)' : 'scale(1)'}`,
                  }}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  {/* Optimized Theme Preview */}
                  <div 
                    className="h-32 p-5 flex items-center justify-between relative overflow-hidden"
                    style={{ 
                      backgroundColor: theme.colors.background.secondary,
                      backgroundImage: `linear-gradient(135deg, ${theme.colors.background.secondary}, ${theme.colors.background.tertiary || theme.colors.background.primary})`
                    }}
                  >
                    {/* Simplified Background Pattern for Better Performance */}
                    <div 
                      className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{
                        backgroundImage: `radial-gradient(circle at 30% 70%, ${theme.colors.primary[500]} 0%, transparent 50%)`
                      }}
                    />
                    
                    <div className="flex items-center space-x-4 relative z-10">
                      <div 
                        className="w-12 h-12 rounded-xl shadow-lg border border-white/20 transition-transform duration-300"
                        style={{ 
                          background: `linear-gradient(135deg, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})`,
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                        }}
                      />
                      <div className="space-y-2">
                        <div 
                          className="w-20 h-3 rounded-full transition-all duration-200"
                          style={{ backgroundColor: theme.colors.text.primary }}
                        />
                        <div 
                          className="w-16 h-2 rounded-full transition-all duration-200"
                          style={{ backgroundColor: theme.colors.text.secondary }}
                        />
                        <div 
                          className="w-12 h-2 rounded-full opacity-60 transition-all duration-200"
                          style={{ backgroundColor: theme.colors.text.secondary }}
                        />
                      </div>
                    </div>
                    
                    {/* Optimized Color Palette Preview */}
                    <div className="flex flex-col space-y-1 relative z-10">
                      {[theme.colors.primary[500], theme.colors.primary[400], theme.colors.primary[300]].map((color, colorIndex) => (
                        <div 
                          key={colorIndex}
                          className="w-4 h-8 rounded-lg shadow-md transition-transform duration-200"
                          style={{ 
                            backgroundColor: color,
                            transform: isSelected ? `scale(1.1) translateX(${colorIndex * 2}px)` : 'scale(1)'
                          }}
                        />
                      ))}
                    </div>

                    {/* Enhanced Selection Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-600/30 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300">
                          <Check className="w-8 h-8 text-primary-600" />
                        </div>
                      </div>
                    )}

                    {/* Loading indicator for theme being applied */}
                    {isChangingTheme && isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white border-t-primary-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Optimized Theme Info */}
                  <div 
                    className="p-5 border-t transition-all duration-200"
                    style={{ 
                      backgroundColor: theme.colors.background.primary,
                      borderColor: theme.colors.border?.primary || theme.colors.primary[200]
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 
                          className="font-bold text-lg transition-colors duration-200"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {theme.name}
                        </h3>
                        <p 
                          className="text-sm mt-1 transition-colors duration-200"
                          style={{ color: theme.colors.text.secondary }}
                        >
                          {themeDescriptions[theme.id as keyof typeof themeDescriptions]}
                        </p>
                      </div>
                      
                      {isCurrentTheme && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center ml-3 shadow-lg transition-all duration-300"
                          style={{ backgroundColor: theme.colors.primary[600] }}
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Optimized Theme Features */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {theme.id === 'dark' && <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-200">Dark Mode</span>}
                      {theme.id === 'light' && <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Light Mode</span>}
                      {!['light', 'dark'].includes(theme.id) && <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: theme.colors.primary[100], color: theme.colors.primary[800] }}>Colorful</span>}
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">High Contrast</span>
                    </div>
                  </div>

                  {/* Subtle Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-xl" />
                </div>
              )
            })}
          </div>

          {/* Optimized Theme Tips */}
          <div className="mt-8 p-5 bg-gradient-to-r from-tertiary/50 to-secondary/50 rounded-xl border border-primary/20 backdrop-blur-sm">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-2">Pro Tips for Theme Selection</h3>
                <ul className="text-sm text-secondary space-y-1">
                  <li>• <strong>Dark themes</strong> reduce eye strain during long work sessions</li>
                  <li>• <strong>Light themes</strong> provide better contrast for detailed work</li>
                  <li>• <strong>Colored themes</strong> can match your project's mood and style</li>
                  <li>• All themes are designed for optimal readability and accessibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer with Loading State */}
        <div className="flex justify-between items-center p-6 border-t border-primary/20 bg-secondary/30 backdrop-blur-sm rounded-b-2xl">
          <div className="flex items-center space-x-2 text-sm text-secondary">
            <Palette className="w-4 h-4" />
            <span>
              {isChangingTheme ? 'Applying theme...' : 'Themes apply instantly across all components'}
            </span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleThemeChange('light')}
              disabled={isChangingTheme || state.currentTheme === 'light'}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-primary border border-white/20 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset to Light
            </button>
            <button
              onClick={handleClose}
              disabled={isChangingTheme}
              className="btn-primary px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  )
} 