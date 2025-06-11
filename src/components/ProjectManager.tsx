import { useState, useEffect, useMemo } from 'react'
import { Plus, FolderOpen, Trash2, Edit3, Calendar, Star, Archive, Search, Grid, List, CheckCircle2, Download, Tag, Filter, Copy, FileText, Settings } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import { getThemeColors } from '../utils/themeColors'
import { storage } from '../utils/storage'
import { ResponsiveScaling } from '../utils/windowManager'
import WindowFrame from './WindowFrame'

interface ProjectManagerProps {
  isOpen: boolean
  onClose: () => void
}

interface Project {
  id: string
  title: string
  description: string
  panels: any[]
  directorNotes: string
  createdAt: Date
  updatedAt: Date
  isStarred?: boolean
  isArchived?: boolean
  tags?: string[]
  lastOpenedAt?: Date
  thumbnailUrl?: string
  collaborators?: string[]
  status?: 'draft' | 'in-progress' | 'review' | 'completed'
  color?: string
  template?: string
  category?: string
  priority?: 'low' | 'medium' | 'high'
}

// Project templates for customization
const PROJECT_TEMPLATES = [
  { id: 'blank', name: 'Blank Project', description: 'Start from scratch', icon: '📄' },
  { id: 'commercial', name: 'Commercial', description: '30-60 second commercial template', icon: '📺' },
  { id: 'social', name: 'Social Media', description: 'Short form content template', icon: '📱' },
  { id: 'narrative', name: 'Narrative Film', description: 'Long form storytelling template', icon: '🎬' },
  { id: 'explainer', name: 'Explainer Video', description: 'Educational content template', icon: '🎓' },
  { id: 'music-video', name: 'Music Video', description: 'Music video template', icon: '🎵' }
]

// Theme-aware project color function
const getProjectColors = (theme: any) => {
  const themeColors = getThemeColors(theme)
  return [
    { id: 'blue', color: themeColors.project.blue.background, name: 'Blue' },
    { id: 'purple', color: themeColors.project.purple.background, name: 'Purple' },
    { id: 'green', color: themeColors.project.green.background, name: 'Green' },
    { id: 'red', color: themeColors.project.red.background, name: 'Red' },
    { id: 'orange', color: themeColors.project.orange.background, name: 'Orange' },
    { id: 'pink', color: themeColors.project.pink.background, name: 'Pink' },
    { id: 'indigo', color: themeColors.project.indigo.background, name: 'Indigo' },
    { id: 'gray', color: themeColors.project.gray.background, name: 'Gray' }
  ]
}

export default function ProjectManager({ isOpen, onClose }: ProjectManagerProps) {
  const { dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  const themeColors = getThemeColors(themeState.theme)
  const PROJECT_COLORS = getProjectColors(themeState.theme)
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'starred' | 'recent' | 'archived'>('all')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'panels'>('updated')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    status: 'draft' as Project['status'],
    template: 'blank',
    color: '#3B82F6',
    category: '',
    priority: 'medium' as Project['priority']
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const savedProjects = await storage.getAllProjects()
      const convertedProjects = savedProjects.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description || '',
        panels: p.panels || [],
        directorNotes: '',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        isStarred: false,
        isArchived: false,
        tags: [],
        lastOpenedAt: p.updatedAt,
        thumbnailUrl: '',
        collaborators: [],
        status: 'draft' as Project['status'],
        color: '#3B82F6',
        template: 'blank',
        category: '',
        priority: 'medium' as Project['priority']
      }))
      setProjects(convertedProjects)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const saveProject = async (project: Project) => {
    try {
      const storyboardProject = {
        id: project.id,
        title: project.title,
        description: project.description,
        panels: project.panels,
        createdAt: project.createdAt,
        updatedAt: new Date()
      }
      
      await storage.saveProject(storyboardProject)
      
      const updatedProjects = projects.map(p => 
        p.id === project.id ? { ...project, updatedAt: new Date() } : p
      )
      setProjects(updatedProjects)
    } catch (error) {
      console.error('Error saving project:', error)
    }
  }

  const createProject = async () => {
    if (!newProject.title.trim()) return

    const project: Project = {
      id: `project-${Date.now()}`,
      title: newProject.title.trim(),
      description: newProject.description.trim(),
      panels: [],
      directorNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastOpenedAt: new Date(),
      isStarred: false,
      isArchived: false,
      tags: newProject.tags,
      status: newProject.status,
      collaborators: [],
      thumbnailUrl: '',
      color: newProject.color,
      template: newProject.template,
      category: newProject.category,
      priority: newProject.priority
    }

    const storyboardProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      panels: project.panels,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }
    await storage.saveProject(storyboardProject)

    const updatedProjects = [project, ...projects]
    setProjects(updatedProjects)
    
    setNewProject({ 
      title: '', 
      description: '', 
      tags: [], 
      status: 'draft',
      template: 'blank',
      color: '#3B82F6',
      category: '',
      priority: 'medium'
    })
    setShowCreateForm(false)
    
    openProject(project)
  }

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const updatedProject = { ...project, ...updates, updatedAt: new Date() }
    await saveProject(updatedProject)
    setEditingProject(null)
  }

  const openProject = async (project: Project) => {
    const updatedProject = { 
      ...project, 
      lastOpenedAt: new Date() 
    }
    
    dispatch({ type: 'SET_PROJECT', payload: updatedProject })
    dispatch({ type: 'SET_PANELS', payload: project.panels })
    
    await saveProject(updatedProject)
    onClose()
  }

  const deleteProjects = async (projectIds: string[]) => {
    if (!confirm(`Delete ${projectIds.length} project(s)? This cannot be undone.`)) return
    
    for (const projectId of projectIds) {
      try {
        await storage.deleteProject(projectId)
      } catch (error) {
        console.error(`Error deleting project ${projectId}:`, error)
      }
    }
    
    const updatedProjects = projects.filter(p => !projectIds.includes(p.id))
    setProjects(updatedProjects)
    setSelectedProjects([])
  }

  const toggleStar = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    
    const updatedProject = { ...project, isStarred: !project.isStarred }
    await saveProject(updatedProject)
  }

  const archiveProjects = async (projectIds: string[]) => {
    const updatedProjects = projects.map(p => 
      projectIds.includes(p.id) ? { ...p, isArchived: !p.isArchived } : p
    )
    setProjects(updatedProjects)
    setSelectedProjects([])
  }

  const duplicateProject = async (project: Project) => {
    const duplicatedProject: Project = {
      ...project,
      id: `project-${Date.now()}`,
      title: `${project.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastOpenedAt: new Date(),
      isStarred: false
    }

    const storyboardProject = {
      id: duplicatedProject.id,
      title: duplicatedProject.title,
      description: duplicatedProject.description,
      panels: duplicatedProject.panels,
      createdAt: duplicatedProject.createdAt,
      updatedAt: duplicatedProject.updatedAt
    }
    await storage.saveProject(storyboardProject)

    const updatedProjects = [duplicatedProject, ...projects]
    setProjects(updatedProjects)
  }

  const exportProjects = async (projectIds: string[]) => {
    const projectsToExport = projects.filter(p => projectIds.includes(p.id))
    const exportData = {
      projects: projectsToExport,
      exportedAt: new Date(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `storyboard-projects-export-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          project.category?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = 
        filterBy === 'all' ? !project.isArchived :
        filterBy === 'starred' ? project.isStarred && !project.isArchived :
        filterBy === 'recent' ? !project.isArchived :
        filterBy === 'archived' ? project.isArchived : true
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'panels':
          return b.panels.length - a.panels.length
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  // Calculate responsive layout for project grid
  const responsiveLayout = useMemo(() => {
    // Estimate window width based on viewport or use a reasonable default
    const windowWidth = window.innerWidth > 1200 ? 1200 : window.innerWidth * 0.9
    return ResponsiveScaling.getOptimalLayout(windowWidth, filteredProjects.length)
  }, [filteredProjects.length])

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed': return themeColors.status.success.background
      case 'review': return themeColors.status.info.background
      case 'in-progress': return themeColors.status.warning.background
      case 'draft': return themeColors.project.gray.background
      default: return themeColors.project.gray.background
    }
  }

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'Complete'
      case 'review': return 'Review'
      case 'in-progress': return 'In Progress'
      case 'draft': return 'Draft'
      default: return 'Draft'
    }
  }

  const getPriorityColor = (priority: Project['priority']) => {
    switch (priority) {
      case 'high': return themeColors.status.error.background
      case 'medium': return themeColors.status.warning.background
      case 'low': return themeColors.status.success.background
      default: return themeColors.project.gray.background
    }
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !newProject.tags.includes(tag.trim())) {
      setNewProject(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewProject(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  if (!isOpen) return null

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Projects"
      subtitle={`${filteredProjects.length} of ${projects.length} projects`}
      icon={<FolderOpen className="w-5 h-5" />}
      defaultWidth="1400"
      defaultHeight="900"
      maxWidth="98vw"
      maxHeight="98vh"
      minWidth={280}
      minHeight={400}
      resizable={true}
      minimizable={true}
      maximizable={true}
      windowId="project-manager"
      zIndex={9100}
    >
      <div className="h-full w-full flex flex-col bg-primary">
        {/* Modern Header Bar */}
        <div 
          className="border-b p-4"
          style={{ 
            backgroundColor: themeColors.interactive.secondary.background,
            borderColor: themeColors.interactive.secondary.border 
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                style={{ color: themeColors.interactive.secondary.text }}
              />
              <input
                type="text"
                placeholder="Search projects by name, description, tags, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-base rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: themeState.theme.colors.background.primary,
                  border: `1px solid ${themeState.theme.colors.border.primary}`,
                  color: themeState.theme.colors.text.primary
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeState.theme.colors.primary[500]
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = themeState.theme.colors.border.primary
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 flex items-center gap-2 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: showFilters 
                    ? themeColors.interactive.primary.background
                    : themeColors.interactive.secondary.background,
                  color: showFilters 
                    ? themeColors.interactive.primary.text
                    : themeColors.interactive.secondary.text,
                  border: `1px solid ${themeColors.interactive.secondary.border}`
                }}
                onMouseEnter={(e) => {
                  if (!showFilters) {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.secondary.hover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showFilters) {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.secondary.background
                  }
                }}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-3 rounded-xl text-sm transition-all duration-200"
                style={{
                  backgroundColor: themeState.theme.colors.background.primary,
                  border: `1px solid ${themeState.theme.colors.border.primary}`,
                  color: themeState.theme.colors.text.primary
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeState.theme.colors.primary[500]
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = themeState.theme.colors.border.primary
                }}
              >
                <option value="updated">Recently Updated</option>
                <option value="created">Recently Created</option>
                <option value="title">Name A-Z</option>
                <option value="panels">Panel Count</option>
              </select>

              {/* View Mode */}
              <div 
                className="flex rounded-lg p-1"
                style={{ backgroundColor: themeColors.interactive.secondary.background }}
              >
                <button
                  onClick={() => setViewMode('grid')}
                  className="p-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: viewMode === 'grid' 
                      ? themeColors.interactive.primary.background
                      : 'transparent',
                    color: viewMode === 'grid' 
                      ? themeColors.interactive.primary.text
                      : themeColors.interactive.secondary.text
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'grid') {
                      e.currentTarget.style.color = themeState.theme.colors.text.primary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'grid') {
                      e.currentTarget.style.color = themeColors.interactive.secondary.text
                    }
                  }}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: viewMode === 'list' 
                      ? themeColors.interactive.primary.background
                      : 'transparent',
                    color: viewMode === 'list' 
                      ? themeColors.interactive.primary.text
                      : themeColors.interactive.secondary.text
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'list') {
                      e.currentTarget.style.color = themeState.theme.colors.text.primary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'list') {
                      e.currentTarget.style.color = themeColors.interactive.secondary.text
                    }
                  }}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* New Project */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 flex items-center gap-2 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: themeColors.interactive.primary.background,
                  color: themeColors.interactive.primary.text
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.interactive.primary.hover
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.interactive.primary.background
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div 
              className="mt-4 flex flex-wrap gap-2 p-4 rounded-xl"
              style={{ backgroundColor: themeColors.interactive.secondary.background }}
            >
              {['all', 'starred', 'recent', 'archived'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterBy(filter as any)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: filterBy === filter
                      ? themeColors.interactive.primary.background
                      : 'transparent',
                    color: filterBy === filter
                      ? themeColors.interactive.primary.text
                      : themeColors.interactive.secondary.text,
                    border: `1px solid ${filterBy === filter 
                      ? themeColors.interactive.primary.background 
                      : 'transparent'}`
                  }}
                  onMouseEnter={(e) => {
                    if (filterBy !== filter) {
                      e.currentTarget.style.backgroundColor = themeColors.interactive.secondary.hover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filterBy !== filter) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {filter === 'all' ? 'All Projects' : 
                   filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Bulk Actions */}
          {selectedProjects.length > 0 && (
            <div 
              className="mt-4 flex items-center justify-between p-3 rounded-xl border"
              style={{ 
                backgroundColor: themeColors.status.info.light,
                borderColor: themeColors.status.info.border
              }}
            >
              <span 
                className="text-sm font-medium"
                style={{ color: themeColors.status.info.background }}
              >
                {selectedProjects.length} project{selectedProjects.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportProjects(selectedProjects)}
                  className="px-3 py-2 text-sm rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: themeColors.interactive.secondary.background,
                    color: themeColors.interactive.secondary.text,
                    border: `1px solid ${themeColors.interactive.secondary.border}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.secondary.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.secondary.background
                  }}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => archiveProjects(selectedProjects)}
                  className="px-3 py-2 text-sm rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: themeColors.interactive.secondary.background,
                    color: themeColors.interactive.secondary.text,
                    border: `1px solid ${themeColors.interactive.secondary.border}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.secondary.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.secondary.background
                  }}
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteProjects(selectedProjects)}
                  className="px-3 py-2 text-sm rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: themeColors.status.error.background,
                    color: themeColors.status.error.text
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.status.error.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.status.error.background
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto w-full">
          {showCreateForm ? (
            /* Enhanced Create Form with Customization */
            <div 
              className="max-w-4xl mx-auto rounded-2xl p-8 border m-6"
              style={{
                backgroundColor: themeColors.interactive.secondary.background,
                borderColor: themeColors.interactive.secondary.border
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 
                  className="text-2xl font-bold"
                  style={{ color: themeColors.text.primary.color }}
                >
                  Create New Project
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{
                    color: themeColors.interactive.secondary.text
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.secondary.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-3"
                      style={{ color: themeColors.text.primary.color }}
                    >
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter your project name..."
                      className="w-full text-lg p-4 rounded-xl transition-all duration-200"
                      style={{
                        backgroundColor: themeState.theme.colors.background.primary,
                        border: `1px solid ${themeState.theme.colors.border.primary}`,
                        color: themeColors.text.primary.color
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = themeState.theme.colors.primary[500]
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = themeState.theme.colors.border.primary
                      }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-semibold mb-3"
                      style={{ color: themeColors.text.primary.color }}
                    >
                      Description
                    </label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your project..."
                      rows={3}
                      className="w-full p-4 rounded-xl transition-all duration-200"
                      style={{
                        backgroundColor: themeState.theme.colors.background.primary,
                        border: `1px solid ${themeState.theme.colors.border.primary}`,
                        color: themeColors.text.primary.color
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = themeState.theme.colors.primary[500]
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = themeState.theme.colors.border.primary
                      }}
                    />
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-semibold mb-3"
                      style={{ color: themeColors.text.primary.color }}
                    >
                      Category
                    </label>
                    <input
                      type="text"
                      value={newProject.category}
                      onChange={(e) => setNewProject(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Marketing, Internal, Client Work..."
                      className="w-full p-4 rounded-xl transition-all duration-200"
                      style={{
                        backgroundColor: themeState.theme.colors.background.primary,
                        border: `1px solid ${themeState.theme.colors.border.primary}`,
                        color: themeColors.text.primary.color
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = themeState.theme.colors.primary[500]
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = themeState.theme.colors.border.primary
                      }}
                    />
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-semibold mb-3"
                      style={{ color: themeColors.text.primary.color }}
                    >
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {newProject.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add tags (press Enter)..."
                      className="input-modern w-full p-3 bg-primary border border-primary/30 focus:border-primary/60 rounded-xl"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Customization Options */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-3">Template</label>
                    <div className="grid grid-cols-2 gap-3">
                      {PROJECT_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setNewProject(prev => ({ ...prev, template: template.id }))}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            newProject.template === template.id
                              ? 'border-primary/60 bg-primary/20'
                              : 'border-primary/20 bg-primary/5 hover:border-primary/40'
                          }`}
                        >
                          <div className="text-2xl mb-2">{template.icon}</div>
                          <div className="font-semibold text-primary text-sm">{template.name}</div>
                          <div className="text-xs text-secondary mt-1">{template.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-primary mb-3">Project Color</label>
                    <div className="flex flex-wrap gap-3">
                      {PROJECT_COLORS.map((colorOption) => (
                        <button
                          key={colorOption.id}
                          onClick={() => setNewProject(prev => ({ ...prev, color: colorOption.color }))}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            newProject.color === colorOption.color
                              ? 'border-white scale-110 shadow-lg'
                              : 'border-primary/20 hover:scale-105'
                          }`}
                          style={{ backgroundColor: colorOption.color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-3">Status</label>
                      <select
                        value={newProject.status}
                        onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value as Project['status'] }))}
                        className="select-modern w-full p-3 bg-primary border border-primary/30 focus:border-primary/60 rounded-xl"
                      >
                        <option value="draft">Draft</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-primary mb-3">Priority</label>
                      <select
                        value={newProject.priority}
                        onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value as Project['priority'] }))}
                        className="select-modern w-full p-3 bg-primary border border-primary/30 focus:border-primary/60 rounded-xl"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className="flex gap-4 pt-8 mt-8 border-t"
                style={{ borderColor: themeColors.interactive.secondary.border }}
              >
                <button
                  onClick={createProject}
                  disabled={!newProject.title.trim()}
                  className="flex-1 py-4 text-lg font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: !newProject.title.trim() 
                      ? themeColors.interactive.primary.disabled
                      : themeColors.interactive.primary.background,
                    color: themeColors.interactive.primary.text
                  }}
                  onMouseEnter={(e) => {
                    if (newProject.title.trim()) {
                      e.currentTarget.style.backgroundColor = themeColors.interactive.primary.hover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newProject.title.trim()) {
                      e.currentTarget.style.backgroundColor = themeColors.interactive.primary.background
                    }
                  }}
                >
                  Create Project
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-4 text-lg font-semibold rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: themeColors.interactive.secondary.background,
                    color: themeColors.interactive.secondary.text,
                    border: `1px solid ${themeColors.interactive.secondary.border}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.secondary.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.secondary.background
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 px-6">
              <div 
                className="w-32 h-32 rounded-3xl mx-auto mb-8 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}20, ${themeState.theme.colors.secondary[500]}20)`
                }}
              >
                <FolderOpen 
                  className="w-16 h-16"
                  style={{ color: `${themeState.theme.colors.text.primary}60` }}
                />
              </div>
              <h3 
                className="text-2xl font-bold mb-4"
                style={{ color: themeColors.text.primary.color }}
              >
                {searchTerm ? 'No projects found' : 'No projects yet'}
              </h3>
              <p 
                className="text-lg mb-8 max-w-md mx-auto"
                style={{ color: themeColors.text.secondary.color }}
              >
                {searchTerm 
                  ? 'Try adjusting your search terms or filters' 
                  : 'Create your first project to start building amazing storyboards'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl"
                  style={{
                    backgroundColor: themeColors.interactive.primary.background,
                    color: themeColors.interactive.primary.text
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.primary.hover
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.primary.background
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Project
                </button>
              )}
            </div>
          ) : (
            /* Enhanced Projects Grid/List */
            <div 
              className={viewMode === 'grid' ? 'grid p-6' : 'space-y-4 p-6'}
              style={viewMode === 'grid' ? {
                gridTemplateColumns: `repeat(${responsiveLayout.columns}, 1fr)`,
                gap: responsiveLayout.gap
              } : {}}
            >
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`group relative transition-all duration-300 transform hover:scale-105 rounded-2xl border hover:shadow-xl ${
                    viewMode === 'grid' ? 'p-6' : 'p-4 flex items-center gap-4'
                  }`}
                  style={{ 
                    backgroundColor: themeColors.interactive.secondary.background,
                    borderColor: themeColors.interactive.secondary.border,
                    borderLeftColor: project.color,
                    borderLeftWidth: viewMode === 'grid' ? '4px' : '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = themeState.theme.colors.primary[300]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = themeColors.interactive.secondary.border
                  }}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          <span 
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: getPriorityColor(project.priority!) === 'text-red-600' ? '#fee2e2' : 
                                              getPriorityColor(project.priority!) === 'text-yellow-600' ? '#fef3c7' : '#f0fdf4',
                              color: getPriorityColor(project.priority!) === 'text-red-600' ? '#dc2626' : 
                                     getPriorityColor(project.priority!) === 'text-yellow-600' ? '#d97706' : '#059669'
                            }}
                          >
                            {project.priority?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStar(project.id)
                            }}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                              color: project.isStarred ? '#eab308' : themeColors.text.tertiary.color,
                              backgroundColor: project.isStarred ? '#fef3c720' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              if (!project.isStarred) {
                                e.currentTarget.style.color = '#eab308'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!project.isStarred) {
                                e.currentTarget.style.color = themeColors.text.tertiary.color
                              }
                            }}
                          >
                            <Star className="w-4 h-4" fill={project.isStarred ? 'currentColor' : 'none'} />
                          </button>
                          
                          {/* Inline Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                duplicateProject(project)
                              }}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: themeColors.text.tertiary.color }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = themeColors.text.primary.color
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = themeColors.text.tertiary.color
                              }}
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingProject(project)
                              }}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: themeColors.text.tertiary.color }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = themeColors.text.primary.color
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = themeColors.text.tertiary.color
                              }}
                              title="Edit"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                exportProjects([project.id])
                              }}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: themeColors.text.tertiary.color }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = themeColors.text.primary.color
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = themeColors.text.tertiary.color
                              }}
                              title="Export"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4" onClick={() => openProject(project)}>
                        <h3 
                          className="font-bold text-lg mb-2 line-clamp-2"
                          style={{ color: themeColors.text.primary.color }}
                        >
                          {project.title}
                        </h3>
                        {project.description && (
                          <p 
                            className="text-sm line-clamp-3 mb-3"
                            style={{ color: themeColors.text.secondary.color }}
                          >
                            {project.description}
                          </p>
                        )}
                        
                        {project.category && (
                          <div className="flex items-center gap-1 mb-2">
                            <FileText 
                              className="w-3 h-3"
                              style={{ color: themeColors.text.tertiary.color }}
                            />
                            <span 
                              className="text-xs"
                              style={{ color: themeColors.text.tertiary.color }}
                            >
                              {project.category}
                            </span>
                          </div>
                        )}

                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {project.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 rounded-full text-xs"
                                style={{
                                  backgroundColor: `${themeState.theme.colors.primary[500]}20`,
                                  color: themeState.theme.colors.primary[600]
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            {project.tags.length > 3 && (
                              <span 
                                className="px-2 py-1 rounded-full text-xs"
                                style={{
                                  backgroundColor: themeColors.interactive.secondary.background,
                                  color: themeColors.text.tertiary.color
                                }}
                              >
                                +{project.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div 
                          className="flex items-center justify-between text-xs"
                          style={{ color: themeColors.text.muted.color }}
                        >
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {project.panels.length} panels
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status!)} text-white`}>
                          {getStatusText(project.status!)}
                        </span>
                        
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            setSelectedProjects(prev => 
                              e.target.checked 
                                ? [...prev, project.id]
                                : prev.filter(id => id !== project.id)
                            )
                          }}
                          className="w-4 h-4 rounded accent-primary"
                        />
                      </div>
                    </>
                  ) : (
                    /* List View */
                    <>
                      <div 
                        className="w-6 h-6 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: project.color }}
                      />
                      
                      <div className="flex-1 min-w-0" onClick={() => openProject(project)}>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 
                            className="font-semibold text-lg truncate"
                            style={{ color: themeColors.text.primary.color }}
                          >
                            {project.title}
                          </h3>
                          {project.isStarred && <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />}
                          <span 
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: getPriorityColor(project.priority!) === 'text-red-600' ? '#fee2e2' : 
                                              getPriorityColor(project.priority!) === 'text-yellow-600' ? '#fef3c7' : '#f0fdf4',
                              color: getPriorityColor(project.priority!) === 'text-red-600' ? '#dc2626' : 
                                     getPriorityColor(project.priority!) === 'text-yellow-600' ? '#d97706' : '#059669'
                            }}
                          >
                            {project.priority?.toUpperCase()}
                          </span>
                        </div>
                        {project.description && (
                          <p 
                            className="text-sm truncate mb-2"
                            style={{ color: themeColors.text.secondary.color }}
                          >
                            {project.description}
                          </p>
                        )}
                        <div 
                          className="flex items-center gap-4 text-xs"
                          style={{ color: themeColors.text.muted.color }}
                        >
                          <span>{project.panels.length} panels</span>
                          <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                          <span className="capitalize">{getStatusText(project.status!)}</span>
                          {project.category && <span>{project.category}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Inline Actions */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateProject(project)
                          }}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: themeColors.text.tertiary.color }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = themeColors.text.primary.color
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = themeColors.text.tertiary.color
                          }}
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingProject(project)
                          }}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: themeColors.text.tertiary.color }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = themeColors.text.primary.color
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = themeColors.text.tertiary.color
                          }}
                          title="Edit"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            setSelectedProjects(prev => 
                              e.target.checked 
                                ? [...prev, project.id]
                                : prev.filter(id => id !== project.id)
                            )
                          }}
                          className="w-4 h-4 rounded accent-primary"
                        />
                      </div>
                    </>
                  )}

                  {/* Selection Overlay for Grid */}
                  {viewMode === 'grid' && selectedProjects.includes(project.id) && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-2xl border-2 border-primary/50 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Edit Modal */}
        {editingProject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-secondary rounded-2xl p-6 max-w-md w-full border border-primary/20">
              <h3 className="text-xl font-bold text-primary mb-4">Edit Project</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">Project Name</label>
                  <input
                    type="text"
                    value={editingProject.title}
                    onChange={(e) => setEditingProject(prev => prev ? {...prev, title: e.target.value} : null)}
                    className="input-modern w-full p-3 bg-primary border border-primary/30 rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">Color</label>
                  <div className="flex gap-2">
                    {PROJECT_COLORS.map((colorOption) => (
                      <button
                        key={colorOption.id}
                        onClick={() => setEditingProject(prev => prev ? {...prev, color: colorOption.color} : null)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          editingProject.color === colorOption.color
                            ? 'border-white scale-110'
                            : 'border-primary/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: colorOption.color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">Status</label>
                    <select
                      value={editingProject.status}
                      onChange={(e) => setEditingProject(prev => prev ? {...prev, status: e.target.value as Project['status']} : null)}
                      className="select-modern w-full p-2 bg-primary border border-primary/30 rounded-lg text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">Priority</label>
                    <select
                      value={editingProject.priority}
                      onChange={(e) => setEditingProject(prev => prev ? {...prev, priority: e.target.value as Project['priority']} : null)}
                      className="select-modern w-full p-2 bg-primary border border-primary/30 rounded-lg text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    updateProject(editingProject.id, editingProject)
                  }}
                  className="btn-primary flex-1 py-3"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingProject(null)}
                  className="btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WindowFrame>
  )
} 