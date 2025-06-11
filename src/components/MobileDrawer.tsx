import { useState, useEffect } from 'react'
import { X, Camera, Bot, Settings, FileText, Video, Folder, Palette, Save, Download, Upload } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (section: string) => void
  currentSection?: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  description: string
}

const navigationItems: NavItem[] = [
  {
    id: 'storyboard',
    label: 'Storyboard',
    icon: <Camera className="w-6 h-6" />,
    description: 'Create and edit panels'
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    icon: <Bot className="w-6 h-6" />,
    description: 'Chat with AI helper'
  },
  {
    id: 'save-project',
    label: 'Save Project',
    icon: <Save className="w-6 h-6" />,
    description: 'Save current project'
  },
  {
    id: 'export-project',
    label: 'Export',
    icon: <Download className="w-6 h-6" />,
    description: 'Export to various formats'
  },
  {
    id: 'import-project',
    label: 'Import',
    icon: <Upload className="w-6 h-6" />,
    description: 'Import project'
  },
  {
    id: 'video-prompts',
    label: 'Video Prompts',
    icon: <Video className="w-6 h-6" />,
    description: 'Generate video prompts'
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: <Folder className="w-6 h-6" />,
    description: 'Manage projects'
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: <FileText className="w-6 h-6" />,
    description: 'Browse templates'
  },
  {
    id: 'theme-settings',
    label: 'Theme',
    icon: <Palette className="w-6 h-6" />,
    description: 'Customize theme'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-6 h-6" />,
    description: 'App preferences'
  }
]

export default function MobileDrawer({ isOpen, onClose, onNavigate, currentSection }: MobileDrawerProps) {
  const [isClosing, setIsClosing] = useState(false)
  const { state: themeState } = useTheme()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setIsClosing(false)
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const handleNavigate = (sectionId: string) => {
    onNavigate(sectionId)
    handleClose()
  }

  if (!isOpen && !isClosing) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen && !isClosing ? 'bg-opacity-60' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Drawer */}
      <div 
        className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen && !isClosing ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: themeState.theme.colors.background.primary,
          borderRight: `1px solid ${themeState.theme.colors.border.primary}`
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b text-white"
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
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Storyboard AI</h2>
              <p className="text-white/80 text-sm">Navigation Menu</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto scrollable">
          <div className="p-4 space-y-2">
            {navigationItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 transform hover:scale-105 animate-menu-item-entrance transform-gpu border-2 ${
                  currentSection === item.id
                    ? 'shadow-lg'
                    : 'border-transparent hover:shadow-md'
                }`}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  backgroundColor: currentSection === item.id 
                    ? `${themeState.theme.colors.primary[100]}` 
                    : themeState.theme.colors.background.secondary,
                  borderColor: currentSection === item.id 
                    ? themeState.theme.colors.primary[300] 
                    : 'transparent'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                  style={{
                    background: currentSection === item.id
                      ? `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`
                      : themeState.theme.colors.background.primary,
                    color: currentSection === item.id 
                      ? 'white' 
                      : themeState.theme.colors.text.secondary
                  }}
                >
                  {item.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 
                    className="font-semibold"
                    style={{
                      color: currentSection === item.id 
                        ? themeState.theme.colors.primary[700] 
                        : themeState.theme.colors.text.primary
                    }}
                  >
                    {item.label}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{
                      color: themeState.theme.colors.text.tertiary
                    }}
                  >
                    {item.description}
                  </p>
                </div>
                {currentSection === item.id && (
                  <div 
                    className="w-3 h-3 rounded-full animate-pulse" 
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
            className="p-4 mt-8 border-t"
            style={{
              borderColor: themeState.theme.colors.border.primary
            }}
          >
            <div 
              className="rounded-xl p-4"
              style={{
                backgroundColor: `${themeState.theme.colors.primary[50]}`,
                border: `1px solid ${themeState.theme.colors.primary[200]}`
              }}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Palette 
                  className="w-5 h-5" 
                  style={{ color: themeState.theme.colors.primary[600] }}
                />
                <span 
                  className="font-medium"
                  style={{ color: themeState.theme.colors.primary[800] }}
                >
                  Quick Tip
                </span>
              </div>
              <p 
                className="text-sm"
                style={{ color: themeState.theme.colors.primary[700] }}
              >
                Swipe right or tap the menu button to access navigation anytime. 
                Long press panels for quick actions!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 