import { useState } from 'react'
import { StoryboardProvider, useStoryboard } from './context/StoryboardContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
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

import { Plus, Bot, Video, FileText, Sparkles, ChevronUp, MoreHorizontal } from 'lucide-react'

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

  // Add state for FAB menu
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const { state: themeState } = useTheme();

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
    setIsExportDialogOpen(false)
    
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
      case 'theme-settings':
        setIsThemeSettingsOpen(true)
        break
      case 'export-project':
        setIsExportDialogOpen(true)
        break
      case 'save-project':
        // Handle quick save action
        const quickSaveBtn = document.getElementById('quick-save-btn')
        if (quickSaveBtn) {
          quickSaveBtn.click()
        } else {
          // Fallback if button isn't found
          const header = document.querySelector('header')
          const saveEvent = new CustomEvent('quicksave')
          if (header) header.dispatchEvent(saveEvent)
        }
        break
      case 'import-project':
        // Handle quick import action
        const quickImportBtn = document.getElementById('quick-import-btn')
        if (quickImportBtn) {
          quickImportBtn.click()
        } else {
          // Fallback if button isn't found
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.json'
          input.click()
        }
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

      {/* Mobile Friendly Floating Action Buttons - Collapsible */}
      <div className="md:hidden fixed bottom-20 right-4 flex flex-col items-center z-30">
        {/* Toggle button - always visible */}
        <button
          onClick={() => setIsFabExpanded(!isFabExpanded)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 mb-3"
          style={{
            backgroundColor: themeState.theme.colors.primary[600],
            color: '#ffffff'
          }}
          aria-label="Toggle menu"
        >
          {isFabExpanded ? 
            <ChevronUp className="w-6 h-6" /> : 
            <MoreHorizontal className="w-6 h-6" />
          }
        </button>
        
        {/* Collapsible buttons */}
        <div className={`flex flex-col space-y-3 transition-all duration-300 ${
          isFabExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}>
          {/* AI Assistant FAB */}
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 touch-manipulation"
            style={{
              backgroundColor: themeState.theme.colors.primary[600],
              color: '#ffffff'
            }}
            aria-label="Open AI Assistant"
          >
            <Bot className="w-6 h-6" />
          </button>

          {/* Video Prompts FAB */}
          <button
            onClick={() => setIsVideoPromptGeneratorOpen(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 touch-manipulation"
            style={{
              backgroundColor: themeState.theme.colors.primary[500],
              color: '#ffffff'
            }}
            aria-label="Video Prompts"
          >
            <Video className="w-6 h-6" />
          </button>

          {/* Templates FAB */}
          <button
            onClick={() => setIsTemplatesOpen(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 touch-manipulation"
            style={{
              backgroundColor: themeState.theme.colors.primary[400],
              color: '#ffffff'
            }}
            aria-label="Templates"
          >
            <FileText className="w-6 h-6" />
          </button>

          {/* Add Panel FAB - Primary action, larger */}
          <button
            onClick={handleNewPanel}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 touch-manipulation"
            style={{
              backgroundColor: themeState.theme.colors.primary[700],
              color: '#ffffff'
            }}
            aria-label="Add Panel"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
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
      <div 
        className="md:hidden px-4 py-3 flex items-center justify-between border-t"
        style={{
          backgroundColor: themeState.theme.colors.background.primary,
          borderColor: themeState.theme.colors.border.primary,
          color: themeState.theme.colors.text.primary
        }}
      >
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: themeState.theme.colors.primary[500] }}
          ></div>
          <span className="text-sm font-medium">Ready to create</span>
        </div>
        <div className="flex items-center space-x-1">
          <Sparkles 
            className="w-4 h-4" 
            style={{ color: themeState.theme.colors.primary[500] }}
          />
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