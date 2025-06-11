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
        
        {/* Quick Actions */}
        <div className="flex space-x-2">
          <button
            onClick={onOpenProjectManager}
            className="flex-1 flex items-center justify-center space-x-2 btn-primary text-sm py-2"
          >
            <FolderOpen className="w-5 h-5" />
            <span>Projects</span>
          </button>
          <button
            onClick={onNewProject}
            className="flex-1 flex items-center justify-center space-x-2 btn-secondary text-sm py-2"
          >
            <Plus className="w-5 h-5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Current Project - Enhanced */}
      <div className="flex-1 overflow-y-auto scrollable min-h-0">
        {state.currentProject && (
          <div 
            className="p-4 border-b animate-fade-in"
            style={{ borderColor: themeState.theme.colors.border.primary }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-primary-theme">Current Project</h3>
              <div className="status-indicator status-online animate-pulse-soft">
                <Sparkles className="w-3 h-3" />
                <span>Active</span>
              </div>
            </div>
            
            <div 
              className="glass-subtle rounded-lg p-4 mb-4 animate-slide-in-bottom"
              style={{
                background: `linear-gradient(135deg, ${themeState.theme.colors.background.secondary}, ${themeState.theme.colors.background.tertiary})`
              }}
            >
              <h4 className="font-medium text-high-contrast mb-2">{state.currentProject.title}</h4>
              <p className="text-sm text-secondary-theme mb-3">{state.currentProject.description}</p>
              
              {/* Enhanced Project Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-primary">{state.panels.length}</div>
                  <div className="text-xs text-secondary">Total Panels</div>
                </div>
                <div className="bg-primary/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-primary">{state.panels.filter(panel => panel.imageUrl).length}</div>
                  <div className="text-xs text-secondary">With Images</div>
                </div>
                <div className="bg-primary/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-primary">
                    {Math.round(state.panels.reduce((total, panel) => total + (panel.description?.split(' ').length || 0), 0))}
                  </div>
                  <div className="text-xs text-secondary">Word Count</div>
                </div>
                <div className="bg-primary/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-primary">
                    {Math.round(state.panels.reduce((total, panel) => total + (panel.duration || 0), 0))}s
                  </div>
                  <div className="text-xs text-secondary">Duration</div>
                </div>
              </div>
              
              {/* Progress Indicator */}
              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="flex items-center justify-between text-xs text-secondary-theme mb-1">
                  <span>Project Completion</span>
                  <span>{Math.round((state.panels.filter(panel => panel.imageUrl).length / Math.max(state.panels.length, 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-tertiary/50 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-out animate-shimmer"
                    style={{
                      width: `${(state.panels.filter(panel => panel.imageUrl).length / Math.max(state.panels.length, 1)) * 100}%`,
                      background: `linear-gradient(90deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[400]})`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Director Notes */}
            <div className="space-y-4">
              <button
                onClick={() => setShowDirectorNotes(!showDirectorNotes)}
                className="w-full flex items-center justify-between text-sm font-medium text-primary-theme hover:text-secondary-theme transition-all duration-300 p-2 rounded-lg hover:bg-tertiary/50"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                  <span>Director's Notes</span>
                </div>
                {showDirectorNotes ? (
                  <ChevronUp className="w-5 h-5 transition-transform duration-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 transition-transform duration-300" />
                )}
              </button>
              
              {showDirectorNotes && (
                <div className="space-y-4 animate-slide-in-bottom">
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-secondary-theme uppercase tracking-wide">
                      Story Notes
                    </label>
                    <textarea
                      value={directorNotes}
                      onChange={(e) => setDirectorNotes(e.target.value)}
                      placeholder="Add your director's notes, character details, or story guidelines..."
                      className="textarea-modern w-full h-24 text-sm"
                      style={{
                        backgroundColor: themeState.theme.colors.background.primary,
                        borderColor: themeState.theme.colors.border.primary,
                        color: themeState.theme.colors.text.primary
                      }}
                    />
                  </div>
                  
                  {/* Enhanced Video Style Inputs */}
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-secondary-theme uppercase tracking-wide">
                      Video Style
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        type="text"
                        value={videoStyle.lightingMood || ''}
                        onChange={(e) => setVideoStyle(prev => ({ ...prev, lightingMood: e.target.value }))}
                        placeholder="Lighting Mood (e.g., cinematic, natural, dramatic)"
                        className="input-modern text-sm"
                        style={{
                          backgroundColor: themeState.theme.colors.background.primary,
                          borderColor: themeState.theme.colors.border.primary,
                          color: themeState.theme.colors.text.primary
                        }}
                      />
                      <input
                        type="text"
                        value={videoStyle.pacing || ''}
                        onChange={(e) => setVideoStyle(prev => ({ ...prev, pacing: e.target.value }))}
                        placeholder="Pacing (e.g., fast, slow, dynamic)"
                        className="input-modern text-sm"
                        style={{
                          backgroundColor: themeState.theme.colors.background.primary,
                          borderColor: themeState.theme.colors.border.primary,
                          color: themeState.theme.colors.text.primary
                        }}
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={saveDirectorNotes}
                    data-save-notes
                    className="btn-primary w-full text-sm py-3 flex items-center justify-center space-x-2 animate-bounce-in"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Notes & Style</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Recent Projects */}
        {recentProjects.length > 0 && (
          <div 
            className="p-4 border-b animate-fade-in animate-delay-200"
            style={{ borderColor: themeState.theme.colors.border.primary }}
          >
            <button
              onClick={() => toggleSection('recent')}
              className="w-full flex items-center justify-between mb-4 text-primary-theme hover:text-secondary-theme transition-all duration-300 p-2 rounded-lg hover:bg-tertiary/50"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${themeState.theme.colors.primary[400]}, ${themeState.theme.colors.primary[600]})`
                  }}
                >
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-sm">Recent Projects</span>
                  <p className="text-xs text-secondary-theme">{recentProjects.length} available</p>
                </div>
              </div>
              {activeSection === 'recent' ? (
                <ChevronUp className="w-5 h-5 transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-5 h-5 transition-transform duration-300" />
              )}
            </button>
            
            {activeSection === 'recent' && (
              <div className="space-y-3 animate-slide-in-bottom">
                {recentProjects.map((project, index) => (
                  <div
                    key={project.id}
                    className={`group card-interactive p-3 cursor-pointer animate-fade-in animate-delay-${(index + 1) * 100}`}
                    onMouseEnter={() => setHoveredProject(project.id)}
                    onMouseLeave={() => setHoveredProject(null)}
                    onClick={() => loadProject(project)}
                    style={{
                      backgroundColor: hoveredProject === project.id 
                        ? themeState.theme.colors.background.tertiary
                        : themeState.theme.colors.background.secondary,
                      borderColor: themeState.theme.colors.border.primary
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-primary-theme text-sm">{project.title}</h4>
                          {hoveredProject === project.id && (
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-heartbeat"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-secondary-theme">
                          <span className="flex items-center space-x-1">
                            <span>{project.panels?.length || 0}</span>
                            <span>panels</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>{project.panels?.filter(p => p.imageUrl)?.length || 0}</span>
                            <span>images</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-tertiary-theme">
                          {new Date(project.lastOpened || project.updatedAt).toLocaleDateString()}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteProject(project.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-1.5 hover:bg-red-100 rounded-lg transform hover:scale-110"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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