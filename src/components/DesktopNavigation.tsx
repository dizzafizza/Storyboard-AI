import { useState, useEffect, useRef } from 'react'
import { 
  Camera, 
  Bot, 
  Settings, 
  FileText, 
  Video, 
  Palette,
  FolderOpen,
  Plus,
  HelpCircle,
  Sparkles,
  X,
  ChevronRight
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface DesktopNavigationProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (action: string) => void
  currentSection?: string
}

interface NavSection {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  action: string
  color: string
  gradient: string
}

const navigationSections: NavSection[] = [
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    icon: <Bot className="w-5 h-5" />,
    description: 'Intelligent creative companion',
    action: 'toggleAI',
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-blue-500'
  },
  {
    id: 'video-prompts',
    label: 'Video Prompts',
    icon: <Video className="w-5 h-5" />,
    description: 'Generate video content ideas',
    action: 'openVideoPrompts',
    color: 'text-green-600',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    id: 'projects',
    label: 'Project Manager',
    icon: <FolderOpen className="w-5 h-5" />,
    description: 'Manage your projects',
    action: 'openProjectManager',
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: <FileText className="w-5 h-5" />,
    description: 'Browse project templates',
    action: 'openTemplates',
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-amber-500'
  },
  {
    id: 'new-project',
    label: 'New Project',
    icon: <Plus className="w-5 h-5" />,
    description: 'Start fresh storyboard',
    action: 'newProject',
    color: 'text-green-600',
    gradient: 'from-green-500 to-teal-500'
  },
  {
    id: 'themes',
    label: 'Theme Settings',
    icon: <Palette className="w-5 h-5" />,
    description: 'Customize appearance',
    action: 'openThemeSettings',
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    description: 'App preferences',
    action: 'openSettings',
    color: 'text-gray-600',
    gradient: 'from-gray-500 to-slate-500'
  },
  {
    id: 'user-guide',
    label: 'User Guide',
    icon: <HelpCircle className="w-5 h-5" />,
    description: 'Learn how to use the app',
    action: 'openUserGuide',
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-purple-500'
  }
]

export default function DesktopNavigation({ isOpen, onClose, onNavigate, currentSection }: DesktopNavigationProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const { state: themeState } = useTheme()
  const menuRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Handle escape key and outside clicks
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex(prev => (prev + 1) % navigationSections.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex(prev => prev <= 0 ? navigationSections.length - 1 : prev - 1)
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault()
        handleNavigate(navigationSections[focusedIndex].action)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, focusedIndex])

  // Focus management on open
  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.focus()
      setFocusedIndex(-1)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setFocusedIndex(-1)
    }, 200)
  }

  const handleNavigate = (action: string) => {
    onNavigate(action)
    handleClose()
  }

  if (!isOpen && !isClosing) return null

  return (
    <div className="fixed inset-0 z-50 hidden md:block">
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className={`absolute inset-0 transition-all duration-200 animate-nav-backdrop-fade ${
          isOpen && !isClosing 
            ? 'bg-black/30 backdrop-blur-sm' 
            : 'bg-black/0 backdrop-blur-none'
        }`}
        onClick={handleClose}
      />
      
      {/* Navigation Menu */}
      <div 
        ref={menuRef}
        tabIndex={-1}
        className={`absolute top-16 left-6 w-80 max-h-[calc(100vh-80px)] rounded-xl shadow-2xl border transform transition-all duration-200 ease-out animate-nav-slide-in ${
          isOpen && !isClosing 
            ? 'translate-y-0 opacity-100 scale-100' 
            : '-translate-y-4 opacity-0 scale-95'
        }`}
        style={{
          backgroundColor: themeState.theme.colors.background.primary,
          borderColor: themeState.theme.colors.border.primary,
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px ${themeState.theme.colors.border.primary}`
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b rounded-t-xl"
          style={{
            background: `linear-gradient(135deg, ${themeState.theme.colors.primary[600]}, ${themeState.theme.colors.primary[700]})`,
            borderColor: themeState.theme.colors.border.primary
          }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Navigation</h2>
              <p className="text-white/80 text-sm">Quick access menu</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20 text-white"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }}
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollable">
          <div className="p-4 space-y-2">
            {navigationSections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => handleNavigate(section.action)}
                onMouseEnter={() => setFocusedIndex(index)}
                onMouseLeave={() => setFocusedIndex(-1)}
                className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 border-2 group animate-menu-item-entrance transform-gpu ${
                  focusedIndex === index 
                    ? 'transform scale-105 shadow-lg' 
                    : 'hover:transform hover:scale-102 hover:shadow-md'
                } ${
                  currentSection === section.id
                    ? 'shadow-lg'
                    : 'border-transparent'
                }`}
                style={{ 
                  animationDelay: `${index * 30}ms`,
                  backgroundColor: focusedIndex === index || currentSection === section.id
                    ? `${themeState.theme.colors.primary[100]}` 
                    : themeState.theme.colors.background.secondary,
                  borderColor: focusedIndex === index || currentSection === section.id
                    ? themeState.theme.colors.primary[300] 
                    : 'transparent'
                }}
                aria-label={`${section.label}: ${section.description}`}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200"
                  style={{
                    background: focusedIndex === index || currentSection === section.id
                      ? `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`
                      : themeState.theme.colors.background.primary,
                    color: focusedIndex === index || currentSection === section.id
                      ? 'white' 
                      : themeState.theme.colors.text.secondary
                  }}
                >
                  {section.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 
                    className="font-semibold text-sm"
                    style={{
                      color: focusedIndex === index || currentSection === section.id
                        ? themeState.theme.colors.primary[700] 
                        : themeState.theme.colors.text.primary
                    }}
                  >
                    {section.label}
                  </h3>
                  <p 
                    className="text-xs"
                    style={{
                      color: themeState.theme.colors.text.tertiary
                    }}
                  >
                    {section.description}
                  </p>
                </div>
                <ChevronRight 
                  className={`w-4 h-4 transition-all duration-200 ${
                    focusedIndex === index ? 'translate-x-1 opacity-100' : 'opacity-40'
                  }`}
                  style={{
                    color: focusedIndex === index || currentSection === section.id
                      ? themeState.theme.colors.primary[600] 
                      : themeState.theme.colors.text.tertiary
                  }}
                />
                {currentSection === section.id && (
                  <div 
                    className="absolute right-2 w-2 h-2 rounded-full animate-pulse" 
                    style={{
                      backgroundColor: themeState.theme.colors.primary[500]
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Footer Info */}
          <div 
            className="p-4 mt-4 border-t"
            style={{
              borderColor: themeState.theme.colors.border.primary
            }}
          >
            <div 
              className="rounded-xl p-4 text-center"
              style={{
                backgroundColor: `${themeState.theme.colors.primary[50]}`,
                border: `1px solid ${themeState.theme.colors.primary[200]}`
              }}
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Sparkles 
                  className="w-4 h-4" 
                  style={{ color: themeState.theme.colors.primary[600] }}
                />
                <span 
                  className="font-medium text-sm"
                  style={{ color: themeState.theme.colors.primary[800] }}
                >
                  Pro Tip
                </span>
              </div>
              <p 
                className="text-xs"
                style={{ color: themeState.theme.colors.primary[700] }}
              >
                Use keyboard arrows and Enter to navigate, or Escape to close
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 