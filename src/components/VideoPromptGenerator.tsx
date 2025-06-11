import { useState, useEffect } from 'react'
import { Wand2, Play, Download, RefreshCw, AlertCircle, Copy, Check, Sparkles, Zap, FileText, Grid, List, Search, Clock, Video } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import { aiService } from '../services/ai'
import type { StoryboardPanel } from '../types'

import WindowFrame from './WindowFrame'

interface VideoPromptGeneratorProps {
  isOpen: boolean
  onClose: () => void
}

export default function VideoPromptGenerator({ isOpen, onClose }: VideoPromptGeneratorProps) {
  const { state, dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  const [selectedPanels, setSelectedPanels] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPrompts, setGeneratedPrompts] = useState<Record<string, string>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'generated' | 'pending'>('all')
  const [copiedPrompts, setCopiedPrompts] = useState<Record<string, boolean>>({})
  const [progressStats, setProgressStats] = useState({ generated: 0, total: 0 })
  const [globalSettings, setGlobalSettings] = useState({
    style: 'cinematic',
    duration: '3-5 seconds',
    aspectRatio: '16:9',
    quality: 'high',
    motion: 'smooth',
    lighting: 'dramatic',
    mood: 'dynamic'
  })
  const [showSettings, setShowSettings] = useState(false)

  // Auto-select all panels when opening
  useEffect(() => {
    if (isOpen && state.panels.length > 0) {
      setSelectedPanels(state.panels.map(p => p.id))
    }
  }, [isOpen, state.panels])

  // Update progress stats
  useEffect(() => {
    const generated = Object.keys(generatedPrompts).length
    const total = state.panels.length
    setProgressStats({ generated, total })
  }, [generatedPrompts, state.panels])

  // Filter panels based on search and status
  const filteredPanels = state.panels.filter(panel => {
    const matchesSearch = !searchQuery || 
      panel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      panel.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'generated' && generatedPrompts[panel.id]) ||
      (filterStatus === 'pending' && !generatedPrompts[panel.id])
    
    return matchesSearch && matchesFilter
  })

  const generateVideoPrompt = async (panel: StoryboardPanel): Promise<string> => {
    console.log('🎯 generateVideoPrompt called for panel:', panel.id, 'Description:', panel.description)
    
    // Try AI service first with full project context
    if (aiService.isReady()) {
      console.log('🤖 AI service is ready, generating contextual prompt with full project data...')
      try {
        // Build comprehensive project context for AI
        const projectContext = {
          projectTitle: state.currentProject?.title || 'Untitled Project',
          projectDescription: state.currentProject?.description || '',
          directorNotes: state.currentProject?.directorNotes || '',
          videoStyle: state.currentProject?.videoStyle || {},
          totalPanels: state.panels.length,
          currentPanelIndex: state.panels.findIndex(p => p.id === panel.id) + 1,
          previousPanels: state.panels.slice(0, state.panels.findIndex(p => p.id === panel.id)).map(p => ({
            title: p.title,
            description: p.description,
            shotType: p.shotType,
            cameraAngle: p.cameraAngle,
            duration: p.duration,
            notes: p.notes
          })),
          nextPanels: state.panels.slice(state.panels.findIndex(p => p.id === panel.id) + 1).map(p => ({
            title: p.title,
            description: p.description,
            shotType: p.shotType,
            cameraAngle: p.cameraAngle,
            duration: p.duration,
            notes: p.notes
          })),
          currentPanel: {
            title: panel.title,
            description: panel.description,
            shotType: panel.shotType,
            cameraAngle: panel.cameraAngle,
            duration: panel.duration,
            notes: panel.notes
          }
        }

        // Use enhanced AI prompt generation with full context
        const contextualPrompt = await generateContextualVideoPrompt(projectContext)
        
        if (contextualPrompt && typeof contextualPrompt === 'string' && contextualPrompt.length > 0) {
          console.log('✅ AI generated contextual prompt:', contextualPrompt.substring(0, 100) + '...')
          return contextualPrompt
        } else {
          console.log('⚠️ AI contextual generation failed, trying scene generation...')
          
          // Fallback to scene generation with enhanced context
          const sceneData = await aiService.generateScene(
            `${panel.description} | Project: ${projectContext.projectTitle} | Director's Vision: ${projectContext.directorNotes} | Context: Panel ${projectContext.currentPanelIndex} of ${projectContext.totalPanels}`,
            panel.shotType,
            panel.cameraAngle,
            'cinematic'
          )
          
          console.log('🔍 AI service returned scene data:', {
            hasVideoPrompt: !!sceneData.videoPrompt,
            videoPromptType: typeof sceneData.videoPrompt,
            videoPromptLength: sceneData.videoPrompt?.length,
            sceneDataKeys: Object.keys(sceneData)
          })
          
          if (sceneData && sceneData.videoPrompt && typeof sceneData.videoPrompt === 'string' && sceneData.videoPrompt.length > 0) {
            console.log('✅ AI generated scene prompt:', sceneData.videoPrompt.substring(0, 50) + '...')
            return sceneData.videoPrompt
          } else {
            console.log('⚠️ AI service returned invalid videoPrompt - using intelligent fallback')
            console.log('   - videoPrompt type:', typeof sceneData.videoPrompt)
            console.log('   - videoPrompt value:', sceneData.videoPrompt)
            console.log('   - sceneData:', sceneData)
          }
        }
      } catch (error) {
        console.error('❌ Error generating AI video prompt:', error)
        const errorDetails = error as Error
        console.log('📄 Error details:', {
          name: errorDetails.name || 'Unknown',
          message: errorDetails.message || 'Unknown error',
          stack: errorDetails.stack?.substring(0, 200) || 'No stack trace'
        })
      }
    } else {
      console.log('🔧 AI service not ready, using intelligent contextual fallback')
    }
    
    // INTELLIGENT CONTEXTUAL FALLBACK - Only if AI completely fails
    console.log('📝 Creating intelligent contextual fallback prompt with project data...')
    return generateIntelligentContextualPrompt(panel, state)
  }

  // New function to generate contextual prompts using AI service directly
  const generateContextualVideoPrompt = async (context: any): Promise<string> => {
    try {
      const enhancedPrompt = `Create a professional, cinematic video generation prompt for an AI video tool (RunwayML, Pika Labs, Stable Video Diffusion, Luma Dream Machine).

PROJECT CONTEXT:
- Title: "${context.projectTitle}"
- Description: "${context.projectDescription}"
- Director's Vision: "${context.directorNotes}"
- Video Style: ${JSON.stringify(context.videoStyle)}

CURRENT PANEL (${context.currentPanelIndex} of ${context.totalPanels}):
- Title: "${context.currentPanel.title}"
- Description: "${context.currentPanel.description}"
- Shot Type: ${context.currentPanel.shotType}
- Camera Angle: ${context.currentPanel.cameraAngle}
- Duration: ${context.currentPanel.duration} seconds
- Notes: "${context.currentPanel.notes}"

STORY CONTEXT:
Previous panels: ${context.previousPanels.map((p: any, i: number) => `Panel ${i + 1}: ${p.title} - ${p.description}`).join(' | ')}
Next panels: ${context.nextPanels.map((p: any, i: number) => `Panel ${context.currentPanelIndex + i + 1}: ${p.title} - ${p.description}`).join(' | ')}

REQUIREMENTS:
Create a detailed video generation prompt that:
1. Reflects the director's creative vision and project style
2. Maintains visual continuity with previous/next panels
3. Uses professional cinematography terminology
4. Includes specific technical specifications (4K, 24fps, lighting, color grading)
5. Incorporates camera movement and framing details
6. Considers the panel's role in the overall story flow
7. Optimizes for AI video generation tools

Generate ONLY the video prompt text, no explanations or formatting.`

      const response = await aiService.sendMessage(
        [{ role: 'user', content: enhancedPrompt }],
        {
          projectTitle: context.projectTitle,
          projectDescription: context.projectDescription,
          panelCount: context.totalPanels,
          totalDuration: context.totalPanels * 4, // rough estimate
          currentPanel: context.currentPanel,
          allPanels: [...context.previousPanels, context.currentPanel, ...context.nextPanels],
          directorNotes: context.directorNotes
        }
      )

      return response || ''
    } catch (error) {
      console.error('❌ Error in contextual prompt generation:', error)
      return ''
    }
  }

  // Intelligent contextual fallback when AI is not available
  const generateIntelligentContextualPrompt = (panel: StoryboardPanel, stateData: any): string => {
    const project = stateData.currentProject
    const allPanels = stateData.panels
    const panelIndex = allPanels.findIndex((p: any) => p.id === panel.id)
    
    // Build contextual elements from project
    const projectElements = []
    
    if (project?.directorNotes) {
      projectElements.push(`Directors Vision: ${project.directorNotes}`)
    }
    
    if (project?.description) {
      projectElements.push(`Project Theme: ${project.description}`)
    }
    
    // Analyze story flow context
    const storyContext = []
    if (panelIndex > 0) {
      const prevPanel = allPanels[panelIndex - 1]
      storyContext.push(`Following: ${prevPanel.title} (${prevPanel.shotType})`)
    }
    
    if (panelIndex < allPanels.length - 1) {
      const nextPanel = allPanels[panelIndex + 1]
      storyContext.push(`Leading to: ${nextPanel.title} (${nextPanel.shotType})`)
    }
    
    // Video style adaptation from project
    const videoStyle = project?.videoStyle || {}
    const styleElements = []
    
    if (videoStyle.genre) styleElements.push(`Genre: ${videoStyle.genre}`)
    if (videoStyle.mood) styleElements.push(`Mood: ${videoStyle.mood}`)
    if (videoStyle.colorPalette) styleElements.push(`Color Palette: ${videoStyle.colorPalette}`)
    if (videoStyle.cinematicStyle) styleElements.push(`Style: ${videoStyle.cinematicStyle}`)
    
    // Technical specifications based on shot type and angle
    const shotDetails = getShotSpecificDetails(panel.shotType, panel.cameraAngle)
    
    // Construct intelligent prompt
    const promptParts = [
      `${panel.description}.`,
      
      // Shot specifications
      `${shotDetails.description} ${shotDetails.movement}`,
      
      // Project context integration
      projectElements.length > 0 ? projectElements.join('. ') + '.' : '',
      
      // Story flow context
      storyContext.length > 0 ? storyContext.join(', ') + '.' : '',
      
      // Style specifications
      styleElements.length > 0 ? styleElements.join(', ') + '.' : '',
      
      // Technical details
      `Professional cinematography, ${shotDetails.technical}`,
      `Duration: ${panel.duration} seconds`,
      
      // Quality specifications
      '4K resolution, cinematic lighting, color graded, film grain texture'
    ].filter(Boolean)
    
    const result = promptParts.join(' ')
    console.log('📝 Generated intelligent fallback prompt:', result.substring(0, 100) + '...')
    return result
  }

  const getShotSpecificDetails = (shotType: string, cameraAngle: string) => {
    const shotSpecs: Record<string, any> = {
      'extreme-wide': {
        description: 'Extreme wide shot capturing vast environment',
        movement: 'with slow, sweeping camera movement',
        technical: '24fps, wide-angle lens, deep focus'
      },
      'wide': {
        description: 'Wide shot establishing scene context',
        movement: 'with smooth establishing movement',
        technical: '24fps, standard lens, balanced exposure'
      },
      'medium': {
        description: 'Medium shot focusing on subject interaction',
        movement: 'with subtle tracking or static framing',
        technical: '24fps, 50mm lens equivalent, natural depth of field'
      },
      'close-up': {
        description: 'Close-up shot capturing emotional detail',
        movement: 'with intimate, controlled camera work',
        technical: '24fps, 85mm lens equivalent, shallow depth of field'
      },
      'extreme-close-up': {
        description: 'Extreme close-up revealing intricate details',
        movement: 'with precise, minimal camera movement',
        technical: '24fps, macro lens, ultra-shallow focus'
      }
    }

    const angleSpecs: Record<string, string> = {
      'eye-level': 'at natural eye level perspective',
      'low-angle': 'from dramatic low angle looking up',
      'high-angle': 'from elevated high angle looking down',
      'bird-eye': 'from aerial bird\'s eye perspective',
      'dutch-angle': 'with dynamic tilted dutch angle'
    }

    const shot = shotSpecs[shotType] || shotSpecs['medium']
    const angle = angleSpecs[cameraAngle] || ''

    return {
      ...shot,
      description: `${shot.description} ${angle}`.trim()
    }
  }

  const generatePromptsForAll = async () => {
    if (!aiService.isReady()) {
      alert('Please set up your OpenAI API key first in the AI Assistant settings.')
      return
    }

    setIsGenerating(true)
    const newPrompts: Record<string, string> = {}

    try {
      for (let i = 0; i < state.panels.length; i++) {
        const panel = state.panels[i]
        
        // Skip if already has prompt
        if (generatedPrompts[panel.id]) {
          newPrompts[panel.id] = generatedPrompts[panel.id]
          continue
        }

        console.log(`🎬 Generating prompt ${i + 1}/${state.panels.length} for panel: ${panel.title}`)
        
        try {
          const prompt = await generateVideoPrompt(panel)
          if (prompt && prompt.length > 0) {
            newPrompts[panel.id] = prompt
            
            // Update panel with generated prompt (save to both fields for compatibility)
            dispatch({
              type: 'UPDATE_PANEL',
              payload: {
                id: panel.id,
                updates: {
                  aiGeneratedPrompt: prompt,
                  videoPrompt: prompt,
                  updatedAt: new Date(),
                },
              },
            })
            
            console.log(`✅ Generated prompt for panel ${i + 1}: ${prompt.substring(0, 50)}...`)
          } else {
            console.warn(`⚠️ Empty prompt generated for panel ${i + 1}`)
          }
        } catch (error) {
          console.error(`❌ Error generating prompt for panel ${i + 1}:`, error)
        }

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      setGeneratedPrompts(prev => ({ ...prev, ...newPrompts }))
      console.log('🎉 Batch generation completed')
      
    } catch (error) {
      console.error('❌ Error in batch generation:', error)
      alert('Error generating prompts. Please check your API settings and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const regeneratePrompt = async (panel: StoryboardPanel) => {
    if (!aiService.isReady()) {
      alert('Please set up your OpenAI API key first in the AI Assistant settings.')
      return
    }

    setIsGenerating(true)
    try {
      const prompt = await generateVideoPrompt(panel)
      if (prompt) {
        setGeneratedPrompts(prev => ({ ...prev, [panel.id]: prompt }))
        
        dispatch({
          type: 'UPDATE_PANEL',
          payload: {
            id: panel.id,
            updates: {
              aiGeneratedPrompt: prompt,
              videoPrompt: prompt,
              updatedAt: new Date(),
            },
          },
        })
      }
    } catch (error) {
      console.error('Error regenerating prompt:', error)
      alert('Error regenerating prompt. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyPrompt = async (prompt: string, panelId: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompts(prev => ({ ...prev, [panelId]: true }))
      setTimeout(() => {
        setCopiedPrompts(prev => ({ ...prev, [panelId]: false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const exportPrompts = () => {
    const promptsData = state.panels.map(panel => ({
      panelNumber: panel.order + 1,
      title: panel.title,
      description: panel.description,
      shotType: panel.shotType,
      cameraAngle: panel.cameraAngle,
      duration: panel.duration,
      prompt: generatedPrompts[panel.id] || 'Not generated'
    }))

    const exportText = promptsData.map(panel => 
      `Panel ${panel.panelNumber}: ${panel.title}\n` +
      `Description: ${panel.description}\n` +
      `Shot: ${panel.shotType} | Angle: ${panel.cameraAngle} | Duration: ${panel.duration}s\n` +
      `Video Prompt: ${panel.prompt}\n` +
      `${'='.repeat(80)}\n`
    ).join('\n')

    const blob = new Blob([exportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.currentProject?.title || 'storyboard'}_video_prompts.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Video Prompt Generator"
      subtitle="AI-powered prompts for video generation tools"
      icon={<Video className="w-5 h-5" />}
              defaultWidth="min(88vw, 750px)"
      defaultHeight="650px"
      minWidth={400}
      minHeight={500}
      maxWidth="98vw"
      maxHeight="95vh"
      className="flex flex-col"
    >
        
        {/* Enhanced Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-primary bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-[length:200%_100%] text-white animate-gradientMove">
          <div className="flex items-center space-x-4">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center animate-float"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)'
              }}
            >
              <Play className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-3xl font-bold flex items-center space-x-2">
                <span>Video Prompt Generator</span>
                <Sparkles className="w-6 h-6 animate-sparkle" />
              </h2>
              <p className="text-blue-100 text-lg">AI-powered prompts for video generation tools</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="text-blue-200 text-sm">
                  Progress: {progressStats.generated}/{progressStats.total} prompts
                </div>
                            <div 
              className="w-32 h-2 rounded-full overflow-hidden"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)'
              }}
            >
                            <div 
                className="h-full rounded-full transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  width: `${(progressStats.generated / Math.max(progressStats.total, 1)) * 100}%`
                }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                              className="p-3 rounded-xl transition-all duration-300 group hover:bg-opacity-20"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? (
                <List className="w-6 h-6 group-hover:scale-110 transition-transform" />
              ) : (
                <Grid className="w-6 h-6 group-hover:scale-110 transition-transform" />
              )}
            </button>
            <button
              onClick={exportPrompts}
              disabled={Object.keys(generatedPrompts).length === 0}
                              className="p-3 rounded-xl transition-all duration-300 disabled:opacity-50 group hover:bg-opacity-20"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
              title="Export All Prompts"
            >
              <Download className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={onClose}
                              className="p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:bg-opacity-20"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Enhanced Controls */}
                  <div className="p-6 border-b border-primary bg-secondary bg-opacity-70">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            
            {/* Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-purple-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search panels by title or description..."
                className="w-full pl-12 pr-4 py-3 bg-primary border border-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-primary placeholder-secondary transition-all duration-300 hover:bg-opacity-80 focus:scale-[1.02]"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-primary border border-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-primary min-w-[200px] transition-all duration-300 hover:bg-opacity-80 focus:scale-[1.02]"
            >
              <option value="all">All Panels ({state.panels.length})</option>
              <option value="generated">Generated ({progressStats.generated})</option>
              <option value="pending">Pending ({progressStats.total - progressStats.generated})</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={generatePromptsForAll}
              disabled={isGenerating}
              className={`btn-primary flex items-center space-x-2 transform hover:scale-105 transition-all duration-300 ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <div 
                  className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" 
                  style={{ borderColor: themeState.theme.colors.text.primary }}
                />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Generate All Prompts</span>
                </>
              )}
            </button>

            {!aiService.isReady() && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Please configure your OpenAI API key first</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Panels List */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar scrollable">
          {filteredPanels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center animate-fadeIn">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <Search className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">No panels found</h3>
              <p className="text-secondary text-lg">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
                : 'space-y-4'
            }`}>
              {filteredPanels.map((panel, index) => {
                const hasPrompt = !!generatedPrompts[panel.id]
                const isCopied = copiedPrompts[panel.id]
                
                return (
                  <div
                    key={panel.id}
                    className={`bg-primary rounded-2xl border border-primary p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl glass-panel group ${
                      hasPrompt ? 'ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-blue-50' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Panel Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          hasPrompt ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}>
                          {panel.order + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-primary text-lg group-hover:text-purple-600 transition-colors">
                            {panel.title}
                          </h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {panel.shotType}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {panel.cameraAngle}
                            </span>
                            <div className="flex items-center space-x-1 text-secondary text-xs">
                              <Clock className="w-3 h-3" />
                              <span>{panel.duration}s</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {hasPrompt && (
                          <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                            <Check className="w-4 h-4" />
                            <span>Generated</span>
                          </div>
                        )}
                        <button
                          onClick={() => regeneratePrompt(panel)}
                          disabled={isGenerating}
                          className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 disabled:opacity-50"
                          title="Generate/Regenerate Prompt"
                        >
                          {isGenerating ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RefreshCw className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Panel Description */}
                    <div 
            className="mb-4 p-3 rounded-lg"
            style={{
              backgroundColor: themeState.theme.colors.background.secondary
            }}
          >
                      <p className="text-secondary text-sm leading-relaxed">{panel.description}</p>
                    </div>

                    {/* Generated Prompt */}
                    {hasPrompt ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-primary flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>Video Prompt</span>
                          </h4>
                          <button
                            onClick={() => copyPrompt(generatedPrompts[panel.id], panel.id)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                              isCopied
                                ? 'bg-green-500 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span className="text-sm">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span className="text-sm">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                          <p className="text-primary text-sm leading-relaxed whitespace-pre-wrap">
                            {generatedPrompts[panel.id]}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-secondary-200 to-secondary-300 rounded-full flex items-center justify-center mb-4 animate-pulse">
                          <Wand2 
                  className="w-8 h-8"
                  style={{
                    color: themeState.theme.colors.text.tertiary
                  }}
                />
                        </div>
                        <p className="text-secondary font-medium mb-2">No prompt generated yet</p>
                        <p className="text-secondary text-sm">Click the regenerate button to create a video prompt</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
    </WindowFrame>
  )
} 