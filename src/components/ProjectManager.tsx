import { useState, useEffect } from 'react'
import { Plus, FolderOpen, Trash2, Edit3, Calendar, User, Star, Archive, Search, Filter, Grid, List, Clock, CheckCircle2, Sparkles, Download, Upload, Settings, MoreVertical, Eye, Copy, Tag } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import { storage } from '../utils/storage'

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
}

export default function ProjectManager({ isOpen, onClose }: ProjectManagerProps) {
  const { state, dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'starred' | 'recent' | 'archived'>('all')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'panels'>('updated')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    status: 'draft' as Project['status']
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const savedProjects = await storage.getAllProjects()
      // Convert StoryboardProject to our Project interface
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
        status: 'draft' as Project['status']
      }))
      setProjects(convertedProjects)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const saveProject = async (project: Project) => {
    try {
      // Convert our Project back to StoryboardProject for storage
      const storyboardProject = {
        id: project.id,
        title: project.title,
        description: project.description,
        panels: project.panels,
        createdAt: project.createdAt,
        updatedAt: new Date()
      }
      
      await storage.saveProject(storyboardProject)
      
      // Update local state
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
      thumbnailUrl: ''
    }

    // Save to storage first
    const storyboardProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      panels: project.panels,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }
    await storage.saveProject(storyboardProject)

    // Update local state
    const updatedProjects = [project, ...projects]
    setProjects(updatedProjects)
    
    setNewProject({ title: '', description: '', tags: [], status: 'draft' })
    setShowCreateForm(false)
    
    // Auto-open the new project
    openProject(project)
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
    
    // Delete each project from storage
    for (const projectId of projectIds) {
      try {
        await storage.deleteProject(projectId)
      } catch (error) {
        console.error(`Error deleting project ${projectId}:`, error)
      }
    }
    
    // Update local state
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
    // Since storage doesn't support archiving, we'll just update local state
    // In a real app, you'd implement archive functionality in storage
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

    // Save the duplicated project
    const storyboardProject = {
      id: duplicatedProject.id,
      title: duplicatedProject.title,
      description: duplicatedProject.description,
      panels: duplicatedProject.panels,
      createdAt: duplicatedProject.createdAt,
      updatedAt: duplicatedProject.updatedAt
    }
    await storage.saveProject(storyboardProject)

    // Update local state
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
                          project.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
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

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'review': return 'bg-blue-500'
      case 'in-progress': return 'bg-yellow-500'
      case 'draft': return 'bg-secondary-500'
      default: return 'bg-secondary-500'
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-primary/95 backdrop-blur-xl rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl border border-primary/20 animate-scale-in"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(var(--primary), 0.95), rgba(var(--secondary), 0.9))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 100px rgba(var(--primary), 0.1)',
          transform: 'translateZ(0)'
        }}
      >
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/20 bg-secondary/30 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg animate-float">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
                Project Manager
              </h2>
              <p className="text-sm text-secondary/80 mt-1">
                {projects.length} projects • {filteredProjects.length} showing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>

              {selectedProjects.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-tertiary/50 rounded-lg border border-primary/20">
                  <span className="text-sm text-secondary">{selectedProjects.length} selected</span>
                  <button
                    onClick={() => exportProjects(selectedProjects)}
                    className="p-1 hover:bg-tertiary rounded transition-colors"
                    title="Export selected"
                  >
                    <Download className="w-4 h-4 text-secondary" />
                  </button>
                  <button
                    onClick={() => archiveProjects(selectedProjects)}
                    className="p-1 hover:bg-tertiary rounded transition-colors"
                    title="Archive selected"
                  >
                    <Archive className="w-4 h-4 text-secondary" />
                  </button>
                  <button
                    onClick={() => deleteProjects(selectedProjects)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    title="Delete selected"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-3 hover:bg-tertiary/50 rounded-xl transition-all duration-300 border border-transparent hover:border-primary/30 hover:shadow-lg group"
            >
              <Eye className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

        <div className="flex h-full max-h-[85vh]">
          {/* Enhanced Sidebar */}
          <div className="w-80 border-r border-primary/20 p-6 bg-secondary/20 backdrop-blur-sm">
            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern w-full pl-10 bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                />
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="select-modern flex-1 bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                >
                  <option value="all">All Projects</option>
                  <option value="starred">Starred</option>
                  <option value="recent">Recent</option>
                  <option value="archived">Archived</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="select-modern flex-1 bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                >
                  <option value="updated">Last Updated</option>
                  <option value="created">Created Date</option>
                  <option value="title">Title</option>
                  <option value="panels">Panel Count</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 flex items-center justify-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'bg-tertiary/30 text-secondary hover:bg-tertiary/50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span className="text-sm">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 flex items-center justify-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'bg-tertiary/30 text-secondary hover:bg-tertiary/50'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="text-sm">List</span>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-xl border border-blue-500/30 backdrop-blur-sm">
                <div className="text-lg font-bold text-primary">{projects.length}</div>
                <div className="text-xs text-secondary">Total Projects</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-4 rounded-xl border border-green-500/30 backdrop-blur-sm">
                <div className="text-lg font-bold text-primary">
                  {projects.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-xs text-secondary">Completed</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 p-4 rounded-xl border border-yellow-500/30 backdrop-blur-sm">
                <div className="text-lg font-bold text-primary">
                  {projects.filter(p => p.isStarred).length}
                </div>
                <div className="text-xs text-secondary">Starred</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                <div className="text-lg font-bold text-primary">
                  {projects.reduce((sum, p) => sum + p.panels.length, 0)}
                </div>
                <div className="text-xs text-secondary">Total Panels</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-tertiary/30 rounded-xl p-4 border border-primary/20">
              <h3 className="font-semibold text-primary mb-3 flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Recent Activity</span>
              </h3>
              <div className="space-y-2">
                {projects
                  .filter(p => p.lastOpenedAt)
                  .sort((a, b) => new Date(b.lastOpenedAt!).getTime() - new Date(a.lastOpenedAt!).getTime())
                  .slice(0, 5)
                  .map(project => (
                    <div key={project.id} className="flex items-center space-x-2 p-2 hover:bg-tertiary/30 rounded-lg transition-colors cursor-pointer"
                         onClick={() => openProject(project)}>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status!)}`} />
                      <span className="text-sm text-primary truncate flex-1">{project.title}</span>
                    </div>
                  ))}
                {projects.filter(p => p.lastOpenedAt).length === 0 && (
                  <p className="text-sm text-secondary/60">No recent projects</p>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollable bg-primary/30 backdrop-blur-sm">
            {showCreateForm ? (
              /* Enhanced Create Project Form */
              <div className="max-w-2xl mx-auto bg-secondary/40 backdrop-blur-sm rounded-xl p-8 border border-primary/20 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-primary flex items-center space-x-3">
                    <Sparkles className="w-6 h-6 text-blue-500" />
                    <span>Create New Project</span>
                  </h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 hover:bg-tertiary/50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-5 h-5 text-secondary" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Project Title</label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter project title..."
                      className="input-modern w-full bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Description</label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your project..."
                      rows={3}
                      className="input-modern w-full bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Status</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value as Project['status'] }))}
                      className="select-modern w-full bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                    >
                      <option value="draft">Draft</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newProject.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30"
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
                      className="input-modern w-full bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={createProject}
                      disabled={!newProject.title.trim()}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Create Project
                    </button>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Enhanced Projects Display */
              <>
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-20 animate-fade-in">
                    <div className="w-20 h-20 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl mx-auto mb-6 flex items-center justify-center">
                      <FolderOpen className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-primary mb-2">No Projects Found</h3>
                    <p className="text-secondary mb-6">
                      {searchTerm ? 'Try adjusting your search terms' : 'Create your first project to get started'}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="btn-primary shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Project
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={`${
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                      : 'space-y-4'
                  } animate-fade-in`}>
                    {filteredProjects.map((project, index) => (
                      <div
                        key={project.id}
                        className={`group relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                          viewMode === 'grid' 
                            ? 'bg-secondary/40 backdrop-blur-sm rounded-xl p-6 border border-primary/20 hover:border-primary/40 hover:shadow-xl' 
                            : 'bg-secondary/30 backdrop-blur-sm rounded-lg p-4 border border-primary/20 hover:border-primary/40 flex items-center space-x-4'
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                          transform: 'translateZ(0)'
                        }}
                        onClick={() => openProject(project)}
                      >
                        {viewMode === 'grid' ? (
                          <>
                            {/* Grid View */}
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status!)}`} />
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleStar(project.id)
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    project.isStarred ? 'text-yellow-500' : 'text-secondary hover:text-yellow-500'
                                  }`}
                                >
                                  <Star className="w-4 h-4" fill={project.isStarred ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowProjectMenu(showProjectMenu === project.id ? null : project.id)
                                  }}
                                  className="p-1 text-secondary hover:text-primary rounded transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="mb-4">
                              <h3 className="font-bold text-primary mb-2 line-clamp-2">{project.title}</h3>
                              <p className="text-sm text-secondary/80 line-clamp-3 mb-3">{project.description}</p>
                              
                              <div className="flex items-center space-x-4 text-xs text-secondary/70 mb-3">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{project.panels.length} panels</span>
                                </span>
                              </div>

                              {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {project.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs border border-primary/30"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {project.tags.length > 3 && (
                                    <span className="px-2 py-1 bg-tertiary/50 text-secondary rounded-full text-xs">
                                      +{project.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status!)} text-white`}>
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
                                className="rounded accent-primary"
                              />
                            </div>
                          </>
                        ) : (
                          /* List View */
                          <>
                            <div className={`w-4 h-4 rounded-full ${getStatusColor(project.status!)}`} />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="font-semibold text-primary truncate">{project.title}</h3>
                                {project.isStarred && <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />}
                              </div>
                              <p className="text-sm text-secondary/80 truncate">{project.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-secondary/70 mt-1">
                                <span>{project.panels.length} panels</span>
                                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                <span className="capitalize">{getStatusText(project.status!)}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowProjectMenu(showProjectMenu === project.id ? null : project.id)
                                }}
                                className="p-2 text-secondary hover:text-primary rounded transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
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
                                className="rounded accent-primary"
                              />
                            </div>
                          </>
                        )}

                        {/* Enhanced Context Menu */}
                        {showProjectMenu === project.id && (
                          <div className="absolute top-full right-0 mt-2 w-48 bg-primary/95 backdrop-blur-xl rounded-lg shadow-xl border border-primary/20 z-50 animate-scale-in">
                            <div className="p-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openProject(project)
                                  setShowProjectMenu(null)
                                }}
                                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-primary hover:bg-secondary/50 rounded transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Open Project</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  duplicateProject(project)
                                  setShowProjectMenu(null)
                                }}
                                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-primary hover:bg-secondary/50 rounded transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Duplicate</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleStar(project.id)
                                  setShowProjectMenu(null)
                                }}
                                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-primary hover:bg-secondary/50 rounded transition-colors"
                              >
                                <Star className="w-4 h-4" />
                                <span>{project.isStarred ? 'Unstar' : 'Star'}</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  archiveProjects([project.id])
                                  setShowProjectMenu(null)
                                }}
                                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-primary hover:bg-secondary/50 rounded transition-colors"
                              >
                                <Archive className="w-4 h-4" />
                                <span>{project.isArchived ? 'Unarchive' : 'Archive'}</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  exportProjects([project.id])
                                  setShowProjectMenu(null)
                                }}
                                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-primary hover:bg-secondary/50 rounded transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                <span>Export</span>
                              </button>
                              
                              <hr className="my-2 border-primary/20" />
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteProjects([project.id])
                                  setShowProjectMenu(null)
                                }}
                                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Selection Checkbox for Grid */}
                        {viewMode === 'grid' && selectedProjects.includes(project.id) && (
                          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-xl border-2 border-primary/50 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showProjectMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProjectMenu(null)}
        />
      )}
    </div>
  )
} 