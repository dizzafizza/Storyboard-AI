import { Bot, Menu, Save, Download, Upload, Plus, Grid, Play, Sparkles, FolderOpen, Layers, HelpCircle, Palette, Zap } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'

interface HeaderProps {
  onToggleAI: () => void
  isAIOpen: boolean
  viewMode?: 'grid' | 'timeline'
  onViewModeChange?: (mode: 'grid' | 'timeline') => void
  onOpenTemplates?: () => void
  onOpenProjectManager?: () => void
  onOpenThemeSettings?: () => void
  onOpenUserGuide?: () => void
}

export default function Header({ 
  onToggleAI, 
  isAIOpen, 
  viewMode = 'grid',
  onViewModeChange,
  onOpenTemplates,
  onOpenProjectManager,
  onOpenThemeSettings,
  onOpenUserGuide
}: HeaderProps) {
  const { state, dispatch } = useStoryboard()
  const { state: themeState } = useTheme()

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

  const handleQuickSave = () => {
    // Visual feedback for save
    const button = document.getElementById('quick-save-btn')
    if (button) {
      button.classList.add('animate-pulse')
      setTimeout(() => {
        button.classList.remove('animate-pulse')
        button.classList.add('animate-wiggle')
        setTimeout(() => {
          button.classList.remove('animate-wiggle')
        }, 1000)
      }, 500)
    }
    
    // Save logic here - for now just show feedback
    console.log('Quick save:', state.currentProject)
  }

  const handleQuickExport = () => {
    if (!state.currentProject) {
      alert('No project to export')
      return
    }

    const projectData = {
      ...state.currentProject,
      panels: state.panels,
      exportedAt: new Date()
    }
    
    const jsonString = JSON.stringify(projectData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.currentProject.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-export.json`
    a.click()
    
    URL.revokeObjectURL(url)
  }

  const handleQuickImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const project = JSON.parse(e.target?.result as string)
            dispatch({ type: 'SET_PROJECT', payload: project })
            
            // Show success animation
            const button = document.getElementById('quick-import-btn')
            if (button) {
              button.classList.add('animate-glow')
              setTimeout(() => {
                button.classList.remove('animate-glow')
              }, 2000)
            }
          } catch (error) {
            alert('Error importing project. Please check the file format.')
          }
        }
        reader.readAsText(file)
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
          <Menu className="w-6 h-6 text-secondary-theme transition-all duration-300 hover:scale-110 cursor-pointer" />
          <h1 className="text-xl font-bold text-high-contrast hover:text-secondary-theme transition-colors duration-300">
            Storyboard AI
          </h1>
          <Sparkles className="w-5 h-5 animate-pulse" style={{ color: themeState.theme.colors.primary[500] }} />
        </div>
        
        {/* View Mode Toggle - Simplified */}
        {onViewModeChange && (
          <div className="flex items-center bg-secondary rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary shadow-md'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Grid className="w-5 h-5" />
              <span>Grid</span>
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
              <span>Timeline</span>
            </button>
          </div>
        )}

        {/* Enhanced Project Stats */}
        {state.currentProject && (
          <div className="project-stats animate-slide-in-left">
            <div className="project-stat-item">
              <div className="project-stat-number animate-bounce-in">
                {state.panels.length}
              </div>
              <div className="project-stat-label">Panels</div>
            </div>
            
            <div className="project-stat-item animate-delay-100">
              <div className="project-stat-number animate-bounce-in">
                {state.panels.filter(panel => panel.imageUrl).length}
              </div>
              <div className="project-stat-label">Images</div>
            </div>
            
            <div className="project-stat-item animate-delay-200">
              <div className="project-stat-number animate-bounce-in">
                {Math.round(state.panels.reduce((total, panel) => total + (panel.description?.length || 0), 0) / 100)}
              </div>
              <div className="project-stat-label">Words (100s)</div>
            </div>
            
            <div className="project-stat-item animate-delay-300">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-heartbeat shadow-lg"></div>
                <span className="text-xs font-medium text-primary-theme">
                  {state.currentProject.title}
                </span>
              </div>
              <div className="project-stat-label">Active Project</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Quick Actions - Simplified */}
        <div className="flex items-center space-x-1 bg-secondary rounded-lg p-1">
          <button 
            id="quick-save-btn"
            onClick={handleQuickSave}
            className="btn-secondary p-2 hover:bg-green-100 hover:text-green-700 transition-all duration-300"
            title="Quick save"
          >
            <Save className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleQuickExport}
            className="btn-secondary p-2 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300"
            title="Export project"
          >
            <Download className="w-5 h-5" />
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
        <div className="flex items-center space-x-1 bg-secondary rounded-lg p-1">
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
        </div>

        {/* AI Toggle - Simplified */}
        <button
          onClick={onToggleAI}
          className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            isAIOpen
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'bg-secondary text-secondary hover:bg-tertiary hover:text-primary'
          }`}
        >
          <Zap className="w-5 h-5" />
          <Bot className="w-5 h-5" />
          <span>AI Assistant</span>
          {isAIOpen && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          )}
        </button>
      </div>
    </header>
  )
} 