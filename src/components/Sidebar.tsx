import { useState, useEffect } from 'react'
import {
  FolderOpen, Clock, Settings, Plus, Video,
  Save, Clapperboard, Zap, Sparkles, Layers, Play,
  Trash2, ChevronDown, ChevronUp, TrendingUp, BookOpen
} from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import { storage } from '../utils/storage'
import type { StoryboardProject, VideoStyle } from '../types'

interface SidebarProps {
  onNewProject?: () => void
  onOpenTemplates?: () => void
  onToggleAI?: () => void
  onGenerateVideoPrompts?: () => void
  onOpenProjectManager?: () => void
  onOpenSettings?: () => void
}

export default function Sidebar({ 
  onNewProject, 
  onOpenTemplates, 
  onToggleAI, 
  onGenerateVideoPrompts,
  onOpenProjectManager,
  onOpenSettings
}: SidebarProps) {
  const { state, dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  const [activeSection, setActiveSection] = useState<string>('current')
  const [userProjects, setUserProjects] = useState<StoryboardProject[]>([])
  const [showDirectorNotes, setShowDirectorNotes] = useState(false)
  const [directorNotes, setDirectorNotes] = useState('')
  const [videoStyle, setVideoStyle] = useState<VideoStyle>({})
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)

  // Load user projects from centralized storage
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projects = await storage.getAllProjects()
        setUserProjects(projects)
      } catch (error) {
        console.error('Error loading projects:', error)
        setUserProjects([])
      }
    }
    
    loadProjects()
  }, [])

  // Refresh projects when the current project changes (to reflect any updates)
  useEffect(() => {
    const refreshProjects = async () => {
      try {
        const projects = await storage.getAllProjects()
        setUserProjects(projects)
      } catch (error) {
        console.error('Error refreshing projects:', error)
      }
    }
    
    refreshProjects()
  }, [state.currentProject])

  // Update director notes when current project changes
  useEffect(() => {
    if (state.currentProject) {
      setDirectorNotes(state.currentProject.directorNotes || '')
      setVideoStyle(state.currentProject.videoStyle || {})
    }
  }, [state.currentProject])

  const saveDirectorNotes = () => {
    if (!state.currentProject) return

    // Preserve ALL existing project data, only update notes and style
    const updatedProject = {
      ...state.currentProject,
      panels: state.panels, // Use current panels from state
      directorNotes,
      videoStyle,
      updatedAt: new Date()
    }

    // Update current project in context (which will also save to storage)
    dispatch({ type: 'SET_PROJECT', payload: updatedProject })

    // Refresh the projects list
    storage.getAllProjects().then(setUserProjects).catch(console.error)
    
    // Show brief success message with animation
    const button = document.querySelector('[data-save-notes]') as HTMLButtonElement
    if (button) {
      const original = button.textContent
      button.textContent = '✅ Saved!'
      button.classList.add('animate-pulse')
      button.disabled = true
      setTimeout(() => {
        button.textContent = original
        button.classList.remove('animate-pulse')
        button.disabled = false
      }, 2000)
    }
  }

  const loadProject = (project: StoryboardProject) => {
    // Update last opened timestamp
    const updatedProject = {
      ...project,
      lastOpened: new Date()
    }

    // Use the context dispatch to set project (which handles storage)
    dispatch({ type: 'SET_PROJECT', payload: updatedProject })

    // Refresh the projects list
    storage.getAllProjects().then(setUserProjects).catch(console.error)
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      // Use centralized storage to delete project
      await storage.deleteProject(projectId)
      
      // Refresh the projects list
      const updatedProjects = await storage.getAllProjects()
      setUserProjects(updatedProjects)

      // If deleting current project, reset to empty
      if (state.currentProject?.id === projectId) {
        const newProject = {
          id: 'empty-' + Date.now(),
          title: 'New Project',
          description: 'Start creating your story',
          panels: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        dispatch({ type: 'SET_PROJECT', payload: newProject })
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project. Please try again.')
    }
  }

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? '' : section)
  }

  const recentProjects = userProjects
    .sort((a, b) => {
      try {
        // Ensure dates are Date objects
        const aTime = a.lastOpened ? new Date(a.lastOpened) : new Date(a.updatedAt)
        const bTime = b.lastOpened ? new Date(b.lastOpened) : new Date(b.updatedAt)
        return bTime.getTime() - aTime.getTime()
      } catch (error) {
        console.error('Error sorting projects:', error)
        return 0
      }
    })
    .slice(0, 5)

  const favoriteProjects = userProjects.filter(p => (p as any).isFavorite)

  return (
    <aside 
      className="w-80 border-r flex flex-col h-full max-h-screen overflow-hidden"
      style={{
        backgroundColor: themeState.theme.colors.background.primary,
        borderColor: themeState.theme.colors.border.primary
      }}
    >
      {/* Header - Enhanced */}
      <div 
        className="p-6 border-b"
        style={{
          backgroundColor: themeState.theme.colors.background.secondary,
          borderColor: themeState.theme.colors.border.primary
        }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${themeState.theme.colors.primary[600]}, ${themeState.theme.colors.primary[500]})`
            }}
          >
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-theme">Project Hub</h2>
            <p className="text-sm text-secondary-theme">Manage your stories</p>
          </div>
        </div>
        
        {/* Main Actions - Enhanced */}
        <div className="px-4 py-4 flex flex-wrap gap-2">
          <button
            onClick={onNewProject}
            className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: themeState.theme.colors.background.secondary,
              color: themeState.theme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: themeState.theme.colors.border.primary,
            }}
          >
            <Plus className="w-6 h-6 mb-1" style={{ color: themeState.theme.colors.primary[500] }} />
            <span className="text-xs font-medium">New</span>
          </button>
          
          <button
            onClick={onOpenTemplates}
            className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: themeState.theme.colors.background.secondary,
              color: themeState.theme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: themeState.theme.colors.border.primary,
            }}
          >
            <Layers className="w-6 h-6 mb-1" style={{ color: themeState.theme.colors.primary[500] }} />
            <span className="text-xs font-medium">Templates</span>
          </button>
          
          <button
            onClick={onToggleAI}
            className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: themeState.theme.colors.background.secondary,
              color: themeState.theme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: themeState.theme.colors.border.primary,
            }}
          >
            <Sparkles className="w-6 h-6 mb-1" style={{ color: themeState.theme.colors.primary[500] }} />
            <span className="text-xs font-medium">AI Help</span>
          </button>
          
          <button
            onClick={onGenerateVideoPrompts}
            className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: themeState.theme.colors.background.secondary,
              color: themeState.theme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: themeState.theme.colors.border.primary,
            }}
          >
            <Play className="w-6 h-6 mb-1" style={{ color: themeState.theme.colors.primary[500] }} />
            <span className="text-xs font-medium">Video</span>
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto scrollable p-4">
        {/* Current Project Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('current')}
            className="w-full flex items-center justify-between p-3 rounded-lg mb-2"
            style={{
              backgroundColor: activeSection === 'current' ? themeState.theme.colors.primary[100] : 'transparent',
              color: activeSection === 'current' ? themeState.theme.colors.primary[700] : themeState.theme.colors.text.primary
            }}
          >
            <div className="flex items-center space-x-3">
              <Clapperboard className="w-5 h-5" style={{ 
                color: activeSection === 'current' ? themeState.theme.colors.primary[600] : themeState.theme.colors.text.secondary 
              }} />
              <span className="font-medium">Current Project</span>
            </div>
            {activeSection === 'current' ? (
              <ChevronUp className="w-5 h-5" style={{ color: themeState.theme.colors.primary[500] }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: themeState.theme.colors.text.secondary }} />
            )}
          </button>
          
          {activeSection === 'current' && state.currentProject && (
            <div 
              className="p-4 rounded-xl border mb-2 transition-all duration-300"
              style={{
                backgroundColor: themeState.theme.colors.background.secondary,
                borderColor: themeState.theme.colors.border.primary
              }}
            >
              <h3 className="font-medium mb-1" style={{ color: themeState.theme.colors.text.primary }}>{state.currentProject.title}</h3>
              <p className="text-sm mb-3" style={{ color: themeState.theme.colors.text.secondary }}>
                {state.currentProject.description || 'No description provided'}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: themeState.theme.colors.text.tertiary }}>
                  {state.panels.length} panel{state.panels.length !== 1 ? 's' : ''}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={onOpenProjectManager}
                    className="flex items-center justify-center p-2 rounded-lg transition-all duration-300"
                    style={{
                      backgroundColor: themeState.theme.colors.background.tertiary,
                      color: themeState.theme.colors.text.secondary
                    }}
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDirectorNotes(!showDirectorNotes)}
                    className="flex items-center justify-center p-2 rounded-lg transition-all duration-300"
                    style={{
                      backgroundColor: showDirectorNotes ? themeState.theme.colors.primary[100] : themeState.theme.colors.background.tertiary,
                      color: showDirectorNotes ? themeState.theme.colors.primary[600] : themeState.theme.colors.text.secondary
                    }}
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Projects Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('recent')}
            className="w-full flex items-center justify-between p-3 rounded-lg mb-2"
            style={{
              backgroundColor: activeSection === 'recent' ? themeState.theme.colors.primary[100] : 'transparent',
              color: activeSection === 'recent' ? themeState.theme.colors.primary[700] : themeState.theme.colors.text.primary
            }}
          >
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5" style={{ 
                color: activeSection === 'recent' ? themeState.theme.colors.primary[600] : themeState.theme.colors.text.secondary 
              }} />
              <span className="font-medium">Recent Projects</span>
            </div>
            {activeSection === 'recent' ? (
              <ChevronUp className="w-5 h-5" style={{ color: themeState.theme.colors.primary[500] }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: themeState.theme.colors.text.secondary }} />
            )}
          </button>
          
          {activeSection === 'recent' && recentProjects.length > 0 && (
            <div className="space-y-2">
              {recentProjects.map(project => (
                <div 
                  key={project.id}
                  className="p-3 rounded-lg flex items-center justify-between cursor-pointer hover:shadow-sm transition-all duration-300"
                  style={{
                    backgroundColor: state.currentProject?.id === project.id 
                      ? themeState.theme.colors.primary[50] 
                      : themeState.theme.colors.background.secondary,
                    borderLeft: `3px solid ${state.currentProject?.id === project.id 
                      ? themeState.theme.colors.primary[500]
                      : 'transparent'}`
                  }}
                  onClick={() => loadProject(project)}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-medium truncate" style={{ color: themeState.theme.colors.text.primary }}>{project.title}</h4>
                    <p className="text-xs truncate" style={{ color: themeState.theme.colors.text.tertiary }}>
                      {project.panels?.length || 0} panel{(project.panels?.length || 0) !== 1 ? 's' : ''} • Last modified {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Delete action - only show on hover */}
                  {hoveredProject === project.id && state.currentProject?.id !== project.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="p-2 rounded-full opacity-70 hover:opacity-100 transition-opacity"
                      style={{ color: themeState.theme.colors.text.secondary }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Director Notes Section - Collapsed by default */}
        {state.currentProject && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('notes')}
              className="w-full flex items-center justify-between p-3 rounded-lg mb-2"
              style={{
                backgroundColor: activeSection === 'notes' ? themeState.theme.colors.primary[100] : 'transparent',
                color: activeSection === 'notes' ? themeState.theme.colors.primary[700] : themeState.theme.colors.text.primary
              }}
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5" style={{ 
                  color: activeSection === 'notes' ? themeState.theme.colors.primary[600] : themeState.theme.colors.text.secondary 
                }} />
                <span className="font-medium">Director's Notes</span>
              </div>
              {activeSection === 'notes' ? (
                <ChevronUp className="w-5 h-5" style={{ color: themeState.theme.colors.primary[500] }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: themeState.theme.colors.text.secondary }} />
              )}
            </button>
            
            {activeSection === 'notes' && (
              <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: themeState.theme.colors.background.secondary }}>
                <textarea
                  value={directorNotes}
                  onChange={(e) => setDirectorNotes(e.target.value)}
                  placeholder="Add director's notes, character details, or story guidelines..."
                  className="w-full h-20 rounded-lg p-2 text-sm"
                  style={{
                    backgroundColor: themeState.theme.colors.background.primary,
                    borderColor: themeState.theme.colors.border.primary,
                    color: themeState.theme.colors.text.primary
                  }}
                />
                
                <button
                  onClick={saveDirectorNotes}
                  data-save-notes
                  className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2"
                  style={{
                    backgroundColor: themeState.theme.colors.primary[500],
                    color: '#ffffff'
                  }}
                >
                  <Save className="w-4 h-4" />
                  <span>Save Notes</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Creative Tools */}
        <div className="p-4 animate-fade-in animate-delay-300">
          <button
            onClick={() => toggleSection('tools')}
            className="w-full flex items-center justify-between mb-4 text-primary-theme hover:text-secondary-theme transition-all duration-300 p-2 rounded-lg hover:bg-tertiary/50"
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[700]})`
                }}
              >
                <Clapperboard className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-semibold text-sm">Creative Tools</span>
                <p className="text-xs text-secondary-theme">AI powered features</p>
              </div>
            </div>
            {activeSection === 'tools' ? (
              <ChevronUp className="w-5 h-5 transition-transform duration-300" />
            ) : (
              <ChevronDown className="w-5 h-5 transition-transform duration-300" />
            )}
          </button>
          
          {activeSection === 'tools' && (
            <div className="space-y-3 animate-slide-in-bottom">
              <button
                onClick={onToggleAI}
                className="w-full flex items-center space-x-3 card-interactive p-3 text-sm hover:scale-105 animate-fade-in animate-delay-100"
                style={{
                  background: `linear-gradient(135deg, ${themeState.theme.colors.background.secondary}, ${themeState.theme.colors.background.tertiary})`,
                  borderColor: themeState.theme.colors.border.primary
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-primary-theme">AI Assistant</div>
                  <div className="text-xs text-secondary-theme">Generate content & ideas</div>
                </div>
              </button>
              
              <button
                onClick={onGenerateVideoPrompts}
                className="w-full flex items-center space-x-3 card-interactive p-3 text-sm hover:scale-105 animate-fade-in animate-delay-200"
                style={{
                  background: `linear-gradient(135deg, ${themeState.theme.colors.background.secondary}, ${themeState.theme.colors.background.tertiary})`,
                  borderColor: themeState.theme.colors.border.primary
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-md">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-primary-theme">Video Prompts</div>
                  <div className="text-xs text-secondary-theme">Generate video descriptions</div>
                </div>
              </button>
              
              <button
                onClick={onOpenTemplates}
                className="w-full flex items-center space-x-3 card-interactive p-3 text-sm hover:scale-105 animate-fade-in animate-delay-300"
                style={{
                  background: `linear-gradient(135deg, ${themeState.theme.colors.background.secondary}, ${themeState.theme.colors.background.tertiary})`,
                  borderColor: themeState.theme.colors.border.primary
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-md">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-primary-theme">Templates</div>
                  <div className="text-xs text-secondary-theme">Pre-built storyboards</div>
                </div>
              </button>
              
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center space-x-3 btn-secondary text-sm py-3 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
} 