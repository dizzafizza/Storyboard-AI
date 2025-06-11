import { Bot, Menu, Save, Download, Upload, Plus, Grid, Play, Sparkles, FolderOpen, Layers, HelpCircle, Palette, Zap, Settings } from 'lucide-react'
import { useState } from 'react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import DesktopNavigation from './DesktopNavigation'

interface HeaderProps {
  onToggleAI: () => void
  isAIOpen: boolean
  viewMode?: 'grid' | 'timeline'
  onViewModeChange?: (mode: 'grid' | 'timeline') => void
  onOpenTemplates?: () => void
  onOpenProjectManager?: () => void
  onOpenThemeSettings?: () => void
  onOpenSettings?: () => void
  onOpenUserGuide?: () => void
  onOpenExportDialog?: () => void
  currentSection?: string
  onToggleMobileDrawer?: () => void
  isMobileDrawerOpen?: boolean
}

export default function Header({ 
  onToggleAI, 
  isAIOpen, 
  viewMode = 'grid',
  onViewModeChange,
  onOpenTemplates,
  onOpenProjectManager,
  onOpenThemeSettings,
  onOpenSettings,
  onOpenUserGuide,
  onOpenExportDialog,
  currentSection,
  onToggleMobileDrawer,
  isMobileDrawerOpen
}: HeaderProps) {
  const { state, dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  const [isDesktopNavOpen, setIsDesktopNavOpen] = useState(false)

  const handleHamburgerClick = () => {
    if (window.innerWidth < 768) {
      onToggleMobileDrawer?.()
    } else {
      setIsDesktopNavOpen(!isDesktopNavOpen)
    }
    
    // Add a subtle haptic feedback effect for better UX
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  const handleDesktopNavigation = (action: string) => {
    switch (action) {
      case 'openTemplates':
        onOpenTemplates?.()
        break
      case 'openProjectManager':
        onOpenProjectManager?.()
        break
      case 'openThemeSettings':
        onOpenThemeSettings?.()
        break
      case 'openSettings':
        onOpenSettings?.()
        break
      case 'openUserGuide':
        onOpenUserGuide?.()
        break
      case 'toggleAI':
        onToggleAI()
        break
      case 'newProject':
        handleNewProject()
        break
      default:
        console.log('Unknown navigation action:', action)
    }
  }

  const handleNewProject = () => {
    if (confirm('Create a new project? This will clear your current storyboard.')) {
      dispatch({ type: 'SET_PROJECT', payload: {
        id: 'new-project-' + Date.now(),
        title: 'New Storyboard Project',
        description: 'A fresh start for your story',
        panels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }})
    }
  }

  const handleQuickSave = async () => {
    if (!state.currentProject) {
      alert('No project to save')
      return
    }

    // Visual feedback for save
    const button = document.getElementById('quick-save-btn')
    if (button) {
      button.classList.add('animate-pulse')
    }
    
    try {
      // Actually save the project with current panels
      const updatedProject = {
        ...state.currentProject,
        panels: state.panels,
        updatedAt: new Date()
      }
      
      // Save using the context dispatch which handles storage
      dispatch({ type: 'SET_PROJECT', payload: updatedProject })
      
      // Success animation
      if (button) {
        button.classList.remove('animate-pulse')
        button.classList.add('animate-wiggle')
        
        // Show temporary success indicator
        const originalIcon = button.innerHTML
        button.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
        
        setTimeout(() => {
          button.innerHTML = originalIcon
          button.classList.remove('animate-wiggle')
        }, 2000)
      }
      
      console.log('✅ Quick save successful:', updatedProject.title)
    } catch (error) {
      console.error('❌ Quick save failed:', error)
      
      // Error animation
      if (button) {
        button.classList.remove('animate-pulse')
        button.classList.add('animate-bounce')
        
        setTimeout(() => {
          button.classList.remove('animate-bounce')
        }, 1000)
      }
      
      alert('Failed to save project. Please try again.')
    }
  }

  const handleQuickExport = () => {
    if (!state.currentProject) {
      alert('No project to export')
      return
    }

    // For quick export, we'll do a simple JSON export
    const projectData = {
      project: {
        ...state.currentProject,
        panels: state.panels
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'Storyboard AI - Quick Export',
        version: '1.0.0'
      }
    }
    
    const jsonString = JSON.stringify(projectData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.currentProject.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`
    a.click()
    
    URL.revokeObjectURL(url)
    
    console.log('✅ Quick export successful:', state.currentProject.title)
  }

  const handleQuickImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const button = document.getElementById('quick-import-btn')
      
      try {
        // Visual feedback
        if (button) {
          button.classList.add('animate-pulse')
        }

        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const jsonData = e.target?.result as string
            const importData = JSON.parse(jsonData)
            
            // Validate import data
            let project = null
            
            if (importData.project) {
              // New format with metadata
              project = importData.project
            } else if (importData.id && importData.title && importData.panels) {
              // Direct project format
              project = importData
            } else {
              throw new Error('Invalid project file format')
            }
            
            // Validate required fields
            if (!project.id || !project.title || !Array.isArray(project.panels)) {
              throw new Error('Project file is missing required fields (id, title, panels)')
            }
            
            // Ensure dates are properly formatted
            project.createdAt = project.createdAt ? new Date(project.createdAt) : new Date()
            project.updatedAt = project.updatedAt ? new Date(project.updatedAt) : new Date()
            
            // Validate and fix panel data
            project.panels = project.panels.map((panel: any, index: number) => ({
              id: panel.id || `imported-panel-${Date.now()}-${index}`,
              title: panel.title || `Imported Panel ${index + 1}`,
              description: panel.description || '',
              imageUrl: panel.imageUrl,
              videoUrl: panel.videoUrl,
              videoPrompt: panel.videoPrompt || panel.aiGeneratedPrompt,
              aiGeneratedPrompt: panel.aiGeneratedPrompt || panel.videoPrompt,
              shotType: panel.shotType || 'medium-shot',
              cameraAngle: panel.cameraAngle || 'eye-level',
              notes: panel.notes || '',
              duration: typeof panel.duration === 'number' ? panel.duration : 3,
              order: index,
              createdAt: panel.createdAt ? new Date(panel.createdAt) : new Date(),
              updatedAt: panel.updatedAt ? new Date(panel.updatedAt) : new Date()
            }))
            
            // Import the project
            dispatch({ type: 'SET_PROJECT', payload: project })
            
            // Show success animation
            if (button) {
              button.classList.remove('animate-pulse')
              button.classList.add('animate-glow')
              
              // Show temporary success indicator
              const originalIcon = button.innerHTML
              button.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
              
              setTimeout(() => {
                button.innerHTML = originalIcon
                button.classList.remove('animate-glow')
              }, 2000)
            }
            
            console.log('✅ Project imported successfully:', project.title)
            
          } catch (error) {
            console.error('❌ Import failed:', error)
            
            if (button) {
              button.classList.remove('animate-pulse')
              button.classList.add('animate-bounce')
              setTimeout(() => {
                button.classList.remove('animate-bounce')
              }, 1000)
            }
            
            alert(`Error importing project: ${error instanceof Error ? error.message : 'Invalid file format'}`)
          }
        }
        
        reader.onerror = () => {
          if (button) {
            button.classList.remove('animate-pulse')
          }
          alert('Error reading file. Please try again.')
        }
        
        reader.readAsText(file)
        
      } catch (error) {
        console.error('❌ Import setup failed:', error)
        if (button) {
          button.classList.remove('animate-pulse')
        }
        alert('Error setting up import. Please try again.')
      }
    }
    
    input.click()
  }

  return (
    <header 
      className="h-16 border-b flex items-center justify-between px-6 animate-slide-in"
      style={{
        backgroundColor: themeState.theme.colors.background.primary,
        borderColor: themeState.theme.colors.border.primary
      }}
    >
      <div className="flex items-center space-x-6">
        {/* Logo and Brand - Enhanced */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleHamburgerClick}
            className={`hamburger-menu-button w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 transform-gpu ${
              isDesktopNavOpen || isMobileDrawerOpen
                ? 'active bg-primary-500 text-white shadow-lg animate-hamburger-active-glow'
                : 'hover:bg-secondary text-secondary-theme hover:shadow-md'
            }`}
            style={{
              backgroundColor: isDesktopNavOpen || isMobileDrawerOpen 
                ? themeState.theme.colors.primary[500]
                : 'transparent',
              color: isDesktopNavOpen || isMobileDrawerOpen 
                ? '#ffffff'
                : themeState.theme.colors.text.secondary
            }}
            title="Navigation Menu"
            aria-label="Toggle navigation menu"
            aria-expanded={isDesktopNavOpen || isMobileDrawerOpen}
          >
            <Menu 
              className={`w-6 h-6 transition-all duration-300 transform-gpu ${
                isDesktopNavOpen || isMobileDrawerOpen ? 'rotate-90 scale-110' : 'rotate-0 scale-100'
              }`} 
            />
          </button>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-high-contrast hover:text-secondary-theme transition-colors duration-300">
              Storyboard AI
            </h1>
            <Sparkles className="w-5 h-5 animate-pulse" style={{ color: themeState.theme.colors.primary[500] }} />
            
            {/* Navigation Status Indicator */}
            {(isDesktopNavOpen || isMobileDrawerOpen) && (
              <div className="hidden md:flex items-center space-x-1 px-2 py-1 rounded-md bg-primary-100 text-primary-700 text-xs font-medium animate-fade-in">
                <span>Menu Open</span>
                <kbd className="px-1 py-0.5 bg-white rounded text-xs">ESC</kbd>
              </div>
            )}
          </div>
        </div>
        
        {/* View Mode Toggle - Simplified */}
        {onViewModeChange && (
          <div className="hidden md:flex items-center bg-secondary rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary shadow-md'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Grid className="w-5 h-5" />
              <span className="hidden lg:inline">Grid</span>
            </button>
            <button
              onClick={() => onViewModeChange('timeline')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                viewMode === 'timeline'
                  ? 'bg-primary text-primary shadow-md'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Play className="w-5 h-5" />
              <span className="hidden lg:inline">Timeline</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Quick Actions - Simplified */}
        <div className="hidden sm:flex items-center space-x-1 bg-secondary rounded-lg p-1">
          <button 
            id="quick-save-btn"
            onClick={handleQuickSave}
            className="btn-secondary p-2 hover:bg-green-100 hover:text-green-700 transition-all duration-300"
            title="Quick save"
          >
            <Save className="w-5 h-5" />
          </button>
          
          <button 
            id="quick-import-btn"
            onClick={handleQuickImport}
            className="btn-secondary p-2 hover:bg-purple-100 hover:text-purple-700 transition-all duration-300"
            title="Import project"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu - Simplified */}
        <div className="hidden md:flex items-center space-x-1 bg-secondary rounded-lg p-1">
          <button
            onClick={onOpenProjectManager}
            className="btn-secondary p-2 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300"
            title="Project Manager"
          >
            <FolderOpen className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenTemplates}
            className="btn-secondary p-2 hover:bg-purple-100 hover:text-purple-700 transition-all duration-300"
            title="Templates"
          >
            <Layers className="w-5 h-5" />
          </button>

          <button
            onClick={handleNewProject}
            className="btn-secondary p-2 hover:bg-green-100 hover:text-green-700 transition-all duration-300"
            title="New Project"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenUserGuide}
            className="btn-secondary p-2 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-300"
            title="User Guide"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenThemeSettings}
            className="btn-secondary p-2 hover:bg-pink-100 hover:text-pink-700 transition-all duration-300"
            title="Theme Settings"
          >
            <Palette className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenExportDialog}
            className="btn-secondary p-2 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300"
            title="Advanced Export"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenSettings}
            className="btn-secondary p-2 hover:bg-gray-100 hover:text-gray-700 transition-all duration-300"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* AI Toggle - Always Visible and Responsive */}
        <button
          onClick={onToggleAI}
          className={`relative flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            isAIOpen
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'bg-secondary text-secondary hover:bg-tertiary hover:text-primary'
          }`}
        >
          <Zap className="w-5 h-5" />
          <Bot className="w-5 h-5" />
          <span className="hidden sm:inline">AI Assistant</span>
          <span className="sm:hidden">AI</span>
          {isAIOpen && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          )}
        </button>
      </div>

      {/* Desktop Navigation Menu */}
      <DesktopNavigation
        isOpen={isDesktopNavOpen}
        onClose={() => setIsDesktopNavOpen(false)}
        onNavigate={handleDesktopNavigation}
        currentSection={currentSection}
      />
    </header>
  )
} 