import { Palette, Check, X, Sparkles, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, themes, ThemeVariant } from '../context/ThemeContext'

interface ThemeSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function ThemeSettings({ isOpen, onClose }: ThemeSettingsProps) {
  const { state, setTheme } = useTheme()

  const handleThemeChange = (themeId: ThemeVariant) => {
    setTheme(themeId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-primary/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-primary/20 animate-scale-in"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(var(--primary), 0.95), rgba(var(--secondary), 0.85))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 100px rgba(var(--primary), 0.1)',
          transform: 'translateZ(0)'
        }}
      >
        {/* Enhanced Header with Glass Effect */}
        <div className="flex items-center justify-between p-6 border-b border-primary/20 bg-secondary/30 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg animate-float">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
                Theme Settings
              </h2>
              <p className="text-sm text-secondary/80 mt-1">
                Customize your workspace appearance • {Object.keys(themes).length} themes available
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Theme Mode Indicators */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-tertiary/50 rounded-lg border border-primary/20">
              <Sun className="w-4 h-4 text-secondary opacity-60" />
              <Monitor className="w-4 h-4 text-secondary opacity-60" />
              <Moon className="w-4 h-4 text-secondary opacity-60" />
            </div>
            
            <button
              onClick={onClose}
              className="p-3 hover:bg-tertiary/50 rounded-xl transition-all duration-300 border border-transparent hover:border-primary/30 hover:shadow-lg group"
            >
              <X className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

        {/* Enhanced Themes Grid with Animations */}
        <div className="p-6 overflow-y-auto flex-1 scrollable">
          {/* Current Theme Banner */}
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-xl border border-primary/30 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white/30 shadow-lg animate-pulse"
                style={{ backgroundColor: state.theme.colors.primary[600] }}
              />
              <div className="flex-1">
                <p className="text-lg font-semibold text-primary">
                  Current Theme: {state.theme.name}
                </p>
                <p className="text-sm text-secondary/80">
                  Theme changes are saved automatically and persist across sessions
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-primary animate-spin-slow" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(themes).map((theme, index) => {
              const isSelected = state.currentTheme === theme.id
              
              return (
                <div
                  key={theme.id}
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-500 overflow-hidden group hover:scale-105 ${
                    isSelected
                      ? 'border-primary-400 ring-4 ring-primary-200/50 shadow-2xl shadow-primary-500/30'
                      : 'border-primary/30 hover:border-primary/60 hover:shadow-xl'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    transform: 'translateZ(0)'
                  }}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  {/* Theme Preview with Enhanced Visuals */}
                  <div 
                    className="h-32 p-5 flex items-center justify-between relative overflow-hidden"
                    style={{ 
                      backgroundColor: theme.colors.background.secondary,
                      backgroundImage: `linear-gradient(135deg, ${theme.colors.background.secondary}, ${theme.colors.background.tertiary || theme.colors.background.primary})`
                    }}
                  >
                    {/* Animated Background Pattern */}
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: `radial-gradient(circle at 20% 80%, ${theme.colors.primary[500]} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${theme.colors.primary[400]} 0%, transparent 50%)`
                      }}
                    />
                    
                    <div className="flex items-center space-x-4 relative z-10">
                      <div 
                        className="w-12 h-12 rounded-xl shadow-lg border border-white/20 animate-float"
                        style={{ 
                          background: `linear-gradient(135deg, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})`,
                          animationDelay: `${index * 200}ms`
                        }}
                      />
                      <div className="space-y-2">
                        <div 
                          className="w-20 h-3 rounded-full"
                          style={{ backgroundColor: theme.colors.text.primary }}
                        />
                        <div 
                          className="w-16 h-2 rounded-full"
                          style={{ backgroundColor: theme.colors.text.secondary }}
                        />
                        <div 
                          className="w-12 h-2 rounded-full opacity-60"
                          style={{ backgroundColor: theme.colors.text.secondary }}
                        />
                      </div>
                    </div>
                    
                    {/* Enhanced Color Palette Preview */}
                    <div className="flex flex-col space-y-1 relative z-10">
                      {[theme.colors.primary[500], theme.colors.primary[400], theme.colors.primary[300]].map((color, colorIndex) => (
                        <div 
                          key={colorIndex}
                          className="w-4 h-8 rounded-lg shadow-md transition-transform duration-300 group-hover:scale-110"
                          style={{ 
                            backgroundColor: color,
                            animationDelay: `${(index * 100) + (colorIndex * 50)}ms`
                          }}
                        />
                      ))}
                    </div>

                    {/* Selection Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-600/30 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                          <Check className="w-8 h-8 text-primary-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Theme Info */}
                  <div 
                    className="p-5 border-t transition-all duration-300 group-hover:bg-opacity-80"
                    style={{ 
                      backgroundColor: theme.colors.background.primary,
                      borderColor: theme.colors.border?.primary || theme.colors.primary[200]
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 
                          className="font-bold text-lg transition-colors"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {theme.name}
                        </h3>
                        <p 
                          className="text-sm mt-1 transition-colors"
                          style={{ color: theme.colors.text.secondary }}
                        >
                          {theme.id === 'light' && '☀️ Classic & Clean'}
                          {theme.id === 'dark' && '🌙 Easy on the Eyes'}
                          {theme.id === 'purple' && '🎨 Creative & Artistic'}
                          {theme.id === 'blue' && '💼 Professional & Calm'}
                          {theme.id === 'green' && '🌿 Natural & Fresh'}
                          {theme.id === 'orange' && '🔥 Warm & Energetic'}
                          {theme.id === 'rose' && '🌹 Elegant & Romantic'}
                          {theme.id === 'emerald' && '💎 Rich & Vibrant'}
                          {theme.id === 'teal' && '🌊 Cool & Modern'}
                          {theme.id === 'amber' && '☀️ Bright & Cheerful'}
                          {theme.id === 'violet' && '🔮 Mysterious & Bold'}
                          {theme.id === 'slate' && '🏔️ Minimal & Sophisticated'}
                        </p>
                      </div>
                      
                      {isSelected && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center ml-3 shadow-lg animate-spin-slow"
                          style={{ backgroundColor: theme.colors.primary[600] }}
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Theme Features */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {theme.id === 'dark' && <span className="px-2 py-1 text-xs rounded-full bg-secondary-800 text-secondary-200">Dark Mode</span>}
                      {theme.id === 'light' && <span className="px-2 py-1 text-xs rounded-full bg-secondary-100 text-secondary-800">Light Mode</span>}
                      {!['light', 'dark'].includes(theme.id) && <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: theme.colors.primary[100], color: theme.colors.primary[800] }}>Colorful</span>}
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">High Contrast</span>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
                </div>
              )
            })}
          </div>

          {/* Theme Tips */}
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

        {/* Enhanced Footer */}
        <div className="flex justify-between items-center p-6 border-t border-primary/20 bg-secondary/30 backdrop-blur-sm rounded-b-2xl">
          <div className="flex items-center space-x-2 text-sm text-secondary">
            <Palette className="w-4 h-4" />
            <span>Themes apply instantly across all components</span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleThemeChange('light')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-primary border border-white/20 hover:border-white/40"
            >
              Reset to Light
            </button>
            <button
              onClick={onClose}
              className="btn-primary px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 