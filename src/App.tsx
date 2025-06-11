import { useState } from 'react'
import { StoryboardProvider, useStoryboard } from './context/StoryboardContext'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import StoryboardGrid from './components/StoryboardGrid'
import TimelineView from './components/TimelineView'
import AIAssistant from './components/AIAssistant'
import PanelEditor from './components/PanelEditor'
import ProjectTemplates from './components/ProjectTemplates'
import VideoPromptGenerator from './components/VideoPromptGenerator'
import ProjectManager from './components/ProjectManager'
import ThemeSettings from './components/ThemeSettings'
import SettingsMenu from './components/SettingsMenu'
import UserGuide from './components/UserGuide'
import AIAgentSelector from './components/AIAgentSelector'
import MobileDrawer from './components/MobileDrawer'
import ExportDialog from './components/ExportDialog'

import { Plus, Bot, Video, FileText, Sparkles } from 'lucide-react'

type ViewMode = 'grid' | 'timeline'

interface OpenPanelEditor {
  id: string
  panelId: string
  isOpen: boolean
}

function AppContent() {
  const { state } = useStoryboard()
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null)
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  
  // Change to support multiple panel editors
  const [openPanelEditors, setOpenPanelEditors] = useState<OpenPanelEditor[]>([])
  
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [isVideoPromptGeneratorOpen, setIsVideoPromptGeneratorOpen] = useState(false)
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false)
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false)
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false)
  const [isAIAgentSelectorOpen, setIsAIAgentSelectorOpen] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)


  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentSection, setCurrentSection] = useState('storyboard')

  const handleEditPanel = (panelId: string) => {
    // Check if panel editor is already open for this panel
    const existingEditor = openPanelEditors.find(editor => editor.panelId === panelId)
    
    if (existingEditor) {
      // Focus existing editor (WindowFrame handles this)
      return
    }
    
    // Create new editor instance
    const newEditor: OpenPanelEditor = {
      id: `editor-${panelId}-${Date.now()}`,
      panelId,
      isOpen: true
    }
    
    setOpenPanelEditors(prev => [...prev, newEditor])
    setSelectedPanel(panelId)
  }

  const handleClosePanelEditor = (editorId: string) => {
    setOpenPanelEditors(prev => prev.filter(editor => editor.id !== editorId))
  }

  const handleNewPanel = () => {
    // Create a temporary new panel for editing
    const tempPanel = {
      id: `temp-panel-${Date.now()}`,
      title: '',
      description: '',
      shotType: 'medium-shot' as const,
      cameraAngle: 'eye-level' as const,
      duration: 3,
      order: state.panels.length,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Open editor for new panel
    const newEditor: OpenPanelEditor = {
      id: `editor-new-${Date.now()}`,
      panelId: tempPanel.id,
      isOpen: true
    }
    
    setOpenPanelEditors(prev => [...prev, newEditor])
  }

  const handleMobileNavigation = (section: string) => {
    setCurrentSection(section)
    
    // Close all modals first
    setIsAIAssistantOpen(false)
    setIsVideoPromptGeneratorOpen(false)
    setIsProjectManagerOpen(false)
    setIsTemplatesOpen(false)
    setIsThemeSettingsOpen(false)
    setIsSettingsMenuOpen(false)
    setIsUserGuideOpen(false)
    setIsAIAgentSelectorOpen(false)
    
    // Open the appropriate modal based on section
    switch (section) {
      case 'ai-assistant':
        setIsAIAssistantOpen(true)
        break
      case 'video-prompts':
        setIsVideoPromptGeneratorOpen(true)
        break
      case 'projects':
        setIsProjectManagerOpen(true)
        break
      case 'templates':
        setIsTemplatesOpen(true)
        break
      case 'settings':
        setIsSettingsMenuOpen(true)
        break
      default:
        // For storyboard, just close all modals to show the main view
        break
    }
  }

  return (
    <div className="h-screen bg-secondary flex flex-col overflow-hidden relative">
      {/* Animated Background Elements - Removed blur effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary rounded-full mix-blend-multiply opacity-20 animate-float" style={{ backgroundColor: 'var(--primary-200)' }}></div>
        <div className="absolute top-40 right-10 w-40 h-40 bg-primary rounded-full mix-blend-multiply opacity-20 animate-float" style={{ animationDelay: '2s', backgroundColor: 'var(--primary-300)' }}></div>
        <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-primary rounded-full mix-blend-multiply opacity-20 animate-float" style={{ animationDelay: '4s', backgroundColor: 'var(--primary-400)' }}></div>
      </div>

      {/* Modern Header */}
      <Header 
        onToggleAI={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
        isAIOpen={isAIAssistantOpen}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenThemeSettings={() => setIsThemeSettingsOpen(true)}
        onOpenSettings={() => setIsSettingsMenuOpen(true)}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
        onOpenExportDialog={() => setIsExportDialogOpen(true)}
        currentSection={currentSection}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        isMobileDrawerOpen={isMobileDrawerOpen}
      />



      <div className="flex-1 flex overflow-hidden relative">
        {/* Enhanced Sidebar - Hidden on Mobile */}
        <div className="hidden md:block">
          <Sidebar 
            onNewProject={() => setIsProjectManagerOpen(true)}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            onToggleAI={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
            onGenerateVideoPrompts={() => setIsVideoPromptGeneratorOpen(true)}
            onOpenProjectManager={() => setIsProjectManagerOpen(true)}
            onOpenSettings={() => setIsSettingsMenuOpen(true)}
          />
        </div>

        {/* Main Content Area with Proper Theme */}
        <main className="flex-1 flex flex-col bg-primary relative overflow-hidden">
          {/* Content - Switch between Grid and Timeline */}
          <div className="flex-1 overflow-hidden p-2 md:p-4">
            {viewMode === 'timeline' ? (
              <TimelineView />
            ) : (
              <StoryboardGrid 
                selectedPanel={selectedPanel}
                onSelectPanel={setSelectedPanel}
                onEditPanel={handleEditPanel}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Friendly Floating Action Buttons */}
      <div className="md:hidden fixed bottom-20 right-4 flex flex-col space-y-3 z-30">
        {/* AI Assistant FAB - Better touch target */}
        <button
          onClick={() => setIsAIAssistantOpen(true)}
          className="w-14 h-14 btn-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 touch-manipulation"
          aria-label="Open AI Assistant"
        >
          <Bot className="w-6 h-6" />
        </button>

        {/* Video Prompts FAB */}
        <button
          onClick={() => setIsVideoPromptGeneratorOpen(true)}
          className="w-14 h-14 btn-success rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 touch-manipulation"
          aria-label="Video Prompts"
        >
          <Video className="w-6 h-6" />
        </button>

        {/* Templates FAB */}
        <button
          onClick={() => setIsTemplatesOpen(true)}
          className="w-14 h-14 btn-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 touch-manipulation"
          aria-label="Templates"
        >
          <FileText className="w-6 h-6" />
        </button>

        {/* Add Panel FAB - Primary action, larger */}
        <button
          onClick={handleNewPanel}
          className="w-16 h-16 btn-warning rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 touch-manipulation"
          aria-label="Add Panel"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onNavigate={handleMobileNavigation}
        currentSection={currentSection}
      />

      {/* Modern Modals with WindowFrame */}
      <AIAssistant 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)}
      />

      {/* Multiple Panel Editors */}
      {openPanelEditors.map((editor) => {
        const panelData = state.panels.find(p => p.id === editor.panelId) || null
        
        return (
          <PanelEditor 
            key={editor.id}
            panel={panelData}
            isOpen={editor.isOpen}
            onClose={() => handleClosePanelEditor(editor.id)}
          />
        )
      })}

      <ProjectTemplates 
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
      />

      <VideoPromptGenerator
        isOpen={isVideoPromptGeneratorOpen}
        onClose={() => setIsVideoPromptGeneratorOpen(false)}
      />

      <ProjectManager
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
      />

      {/* Main Settings Menu */}
      <SettingsMenu
        isOpen={isSettingsMenuOpen}
        onClose={() => setIsSettingsMenuOpen(false)}
        onOpenThemeSettings={() => {
          setIsSettingsMenuOpen(false)
          setIsThemeSettingsOpen(true)
        }}
      />

      {/* Standalone Theme Settings (can be opened from Settings Menu) */}
      <ThemeSettings
        isOpen={isThemeSettingsOpen}
        onClose={() => setIsThemeSettingsOpen(false)}
      />

      <UserGuide
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />

      <AIAgentSelector
        isOpen={isAIAgentSelectorOpen}
        onClose={() => setIsAIAgentSelectorOpen(false)}
        onSelectAgent={(agent) => {
          console.log('Selected agent:', agent)
          setIsAIAgentSelectorOpen(false)
        }}
      />

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />

      {/* Modern Status Bar - Mobile Only */}
      <div className="md:hidden bg-primary text-primary px-4 py-3 flex items-center justify-between border-t border-primary">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Ready to create</span>
        </div>
        <div className="flex items-center space-x-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">AI Powered</span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <StoryboardProvider>
        <AppContent />
      </StoryboardProvider>
    </ThemeProvider>
  )
} 