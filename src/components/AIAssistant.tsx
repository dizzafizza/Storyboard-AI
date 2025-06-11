import { useState, useRef, useEffect } from 'react'
import { X, Send, Users, History, Star, Lightbulb, ChevronDown, ChevronUp, Search, Trash2, Edit3, Clock, User, Settings, Bot, Plus } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import { aiService, type ProjectContext } from '../services/ai'
import AIImageSettings, { type AIImageSettings as ImageSettings } from './AIImageSettings'
import AIAgentSelector from './AIAgentSelector'
import ChatHistoryManager from './ChatHistoryManager'
import SaveStatusIndicator from './SaveStatusIndicator'
import MarkdownRenderer from './MarkdownRenderer'
import ContextualTips from './ContextualTips'
import WindowFrame from './WindowFrame'
import { AIAgent, ChatMessage, SavedChat, ChatSaveState, ShotType, CameraAngle } from '../types'
import { aiAgents, getAgentById } from '../services/aiAgents'
import { chatManager } from '../services/chatManager'

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const { state, dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  
  // Create dynamic welcome message based on current state and agent
  const createWelcomeMessage = () => {
    return `${currentAgent.avatar} **${currentAgent.name} - ${currentAgent.specialty}**

${currentAgent.description}

**🎯 MY SPECIALTIES:**
${currentAgent.skills.map(skill => `• ${skill}`).join('\n')}

**💡 TRY THESE PROMPTS:**
${currentAgent.examples.map(example => `• "${example}"`).join('\n')}

Current Project: **${state.currentProject?.title || 'Untitled'}** (${state.panels.length} panels)

I'm ready to help with your ${currentAgent.specialty.toLowerCase()}! What can we create together?`
  }

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showImageSettings, setShowImageSettings] = useState(false)
  const [showAgentSelector, setShowAgentSelector] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<AIAgent>(aiAgents[0]) // Default to first agent
  const [saveState, setSaveState] = useState<ChatSaveState>({ status: 'idle' })
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [favoriteAgents, setFavoriteAgents] = useState<string[]>([])
  const [showFavoritesPanel, setShowFavoritesPanel] = useState(false)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  // Integrated panel state (replaces separate modals)
  const [activePanel, setActivePanel] = useState<'agent' | 'history' | 'settings' | null>(null)
  
  // Chat history state for inline panel
  const [chats, setChats] = useState<SavedChat[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredChats, setFilteredChats] = useState<SavedChat[]>([])
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'standard',
    style: 'photorealistic',
    artStyle: 'cinematic',
    lighting: 'natural',
    mood: 'neutral',
    colorScheme: 'full-color',
    aspectRatio: '16:9',
    creativity: 7
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize welcome message when component mounts or agent changes
  useEffect(() => {
    // Only reset messages if we don't have a current chat loaded
    if (!currentChatId) {
      setMessages([{
        id: '1',
        type: 'assistant',
        content: createWelcomeMessage(),
        timestamp: new Date(),
        agentId: currentAgent.id
      }])
      setSaveState({ status: 'idle' })
    }
  }, [currentAgent, state.currentProject?.title, state.panels.length])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load API key and favorites from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('openai-api-key')
    if (savedKey) {
      aiService.setApiKey(savedKey)
    }

    const savedFavorites = localStorage.getItem('ai-agent-favorites')
    if (savedFavorites) {
      setFavoriteAgents(JSON.parse(savedFavorites))
    }
  }, [])

  // Load chats when history panel opens
  useEffect(() => {
    if (activePanel === 'history') {
      const allChats = chatManager.getAllChats()
      setChats(allChats)
    }
  }, [activePanel])

  // Filter chats based on search
  useEffect(() => {
    let filtered = chats
    if (searchQuery) {
      filtered = filtered.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some(msg => 
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }
    setFilteredChats(filtered)
  }, [chats, searchQuery])

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      aiService.setApiKey(apiKeyInput.trim())
      localStorage.setItem('openai-api-key', apiKeyInput.trim())
      setApiKeyInput('')
      setShowApiKeyInput(false)
      
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '🔑 **API Key Saved!** I\'m now ready to help you with advanced AI features like generating storyboards, editing panels, and creating video prompts!',
        timestamp: new Date(),
        agentId: currentAgent.id
      }
      setMessages(prev => [...prev, successMessage])
    }
  }

  const handleImageSettingsSave = (settings: ImageSettings) => {
    setImageSettings(settings)
    setShowImageSettings(false)
  }



  const sendMessageToAI = async (userMessage: string): Promise<string> => {
    try {
      // Create comprehensive context for the AI
      const projectContext: ProjectContext = {
        projectTitle: state.currentProject?.title || 'Untitled Storyboard',
        projectDescription: state.currentProject?.description || 'No description',
        panelCount: state.panels.length,
        totalDuration: state.panels.reduce((acc, p) => acc + (p.duration || 0), 0),
        currentPanel: state.selectedPanel ? state.panels.find(p => p.id === state.selectedPanel) : null,
        allPanels: state.panels.map((panel, index) => ({
          number: index + 1,
          title: panel.title,
          description: panel.description,
          shotType: panel.shotType,
          cameraAngle: panel.cameraAngle,
          duration: panel.duration,
          notes: panel.notes || 'No notes'
        })),
        directorNotes: state.currentProject?.directorNotes
      }

      // Get recent conversation history (last 8 messages for context)
      const recentMessages = messages
        .slice(-8)
        .filter(m => m.type !== 'system')
        .map(m => ({
          role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content
        }))

      // Add current message
      recentMessages.push({
        role: 'user' as const,
        content: userMessage
      })

      // Create modified project context with agent personality
      const agentContext = {
        ...projectContext,
        agentPersonality: currentAgent.prompt
      }

      return await aiService.sendMessage(recentMessages, agentContext)
    } catch (error) {
      console.error('AI service error:', error)
      return generateIntelligentLocalResponse(userMessage)
    }
  }

  const generateIntelligentLocalResponse = (userInput: string) => {
    const input = userInput.toLowerCase()
    const hasContent = state.panels.length > 0 || state.currentProject?.title
    const projectName = state.currentProject?.title || 'your project'
    
    // Context-aware responses based on current state
    if (input.includes('storyboard') || input.includes('generate')) {
      return `🎬 **Storyboard Generation**

I'd love to help you create a professional storyboard! ${hasContent ? `I see you're working on "${projectName}" with ${state.panels.length} panels.` : ''}

Here's what I can do once you add your OpenAI API key:
• **Generate** complete storyboards from story ideas
• **Enhance** existing panels with better descriptions
• **Add** new scenes with cinematic details
• **Create** video prompts for each panel

**Quick Start:** Add your API key in Settings, then tell me your story idea!`
    }
    
    if (input.includes('panel') || input.includes('scene')) {
      return `🎥 **Panel & Scene Management**

${hasContent ? `Your "${projectName}" currently has ${state.panels.length} panels.` : 'No panels created yet.'}

I can help you:
• **Add** new cinematic panels
• **Edit** existing scene descriptions  
• **Enhance** shot compositions
• **Optimize** story flow and pacing

**Need Ideas?** Try: "Add a dramatic close-up scene" or "Enhance panel 3 with better lighting"`
    }
    
    if (input.includes('video') || input.includes('prompt')) {
      return `📹 **Video Prompt Generation**

Transform your storyboard into video prompts! ${hasContent ? `Ready to process ${state.panels.length} panels.` : 'Create some panels first.'}

I can generate:
• **Detailed** video descriptions
• **Technical** camera specifications
• **Professional** filming instructions
• **Creative** visual effects notes

**Pro Tip:** Each panel becomes a detailed video prompt perfect for AI video generation!`
    }

    return `${hasContent ? `I see you're working on "${projectName}" - that's awesome!` : `Ready to create something amazing?`} 

I'm having trouble connecting to my AI servers right now, but I can still help you get organized:

Quick options:
• **Projects** - Save and manage your work
• **Templates** - Start with professional layouts
• **New Project** - Fresh creative start

Once I'm back online, just tell me your story ideas and I'll help bring them to life with storyboards, video prompts, and all the creative tools you need!

What sounds good to you?`
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
      agentId: currentAgent.id
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      // Intelligent routing based on message content
      const userInput = userMessage.content.toLowerCase()
      
      // Check for specific action patterns first
      console.log('🔍 Analyzing user input:', userInput)
      
      // Handle AI actions (this covers multi-action messages)
      await handleAIActions(userMessage.content, userMessage.content)
      
      // Always continue with regular AI conversation unless specific actions were triggered
      console.log('💬 No actions detected, sending to AI for conversation')
      
      const aiResponse = await sendMessageToAI(userMessage.content)
      
      // Determine if we should use batch editing or single actions
      const shouldUseBatch = userInput.includes('all') || userInput.includes('batch') || 
                            userInput.includes('every') || userInput.includes('entire')
      
      // Handle specific storyboard operations if AI is available
      if (userInput.includes('generate') && userInput.includes('storyboard')) {
        console.log('🔧 Fallback: Triggering storyboard generation')
        await generateStoryboard(userMessage.content)
        return
      } else if (userInput.includes('add') && (userInput.includes('panel') || userInput.includes('scene'))) {
        console.log('🔧 Fallback: Triggering panel addition')
        await addPanel(userMessage.content)
        return
      } else if (userInput.includes('edit') && userInput.includes('panel') && !shouldUseBatch) {
        console.log('🔧 Fallback: Triggering single panel edit')
        if (state.panels.length > 0) {
          const panelMatch = userInput.match(/panel (\d+)/i)
          if (panelMatch) {
            const panelNumber = parseInt(panelMatch[1])
            const panel = state.panels[panelNumber - 1]
            if (panel) {
              await editPanel(panel.id, userMessage.content)
              return
            }
          } else {
            // Edit last panel if no specific number
            const lastPanel = state.panels[state.panels.length - 1]
            await editPanel(lastPanel.id, userMessage.content)
            return
          }
        }
      } else if (userInput.includes('video') && userInput.includes('prompt')) {
        console.log('🔧 Fallback: Triggering video prompts')
        await generateVideoPrompts()
        return
      }
      
      // Default to regular AI conversation
      console.log('💬 Showing regular AI response')
      const response = aiResponse
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        agentId: currentAgent.id
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again or check the server connection.',
        timestamp: new Date(),
        agentId: currentAgent.id
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const generateStoryboard = async (storyIdea: string, panelCount: number = 6) => {
    setIsTyping(true)
    
    try {
      const panels = await aiService.generateStoryboard(storyIdea, panelCount, 'drama')
      
      // Clear existing panels and add generated ones
      dispatch({ type: 'SET_PANELS', payload: [] })
      
      panels.forEach((panel, index) => {
        const newPanel = {
          ...panel,
          order: index,
        }
        dispatch({ type: 'ADD_PANEL', payload: newPanel })
      })
      
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🎬 **Storyboard Generated!** I've created ${panels.length} professional panels for your story. Each panel includes:\n\n• Cinematic shot composition\n• Professional camera angles\n• Director's notes\n• Optimal timing\n\nYou can now edit individual panels, generate video prompts, or ask me to refine specific scenes!`,
        timestamp: new Date(),
          agentId: currentAgent.id
      }
      setMessages(prev => [...prev, successMessage])
      
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Failed to generate storyboard. Please check your API key or try again.',
        timestamp: new Date(),
          agentId: currentAgent.id
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const editPanel = async (panelId: string, instructions: string) => {
    const panel = state.panels.find(p => p.id === panelId)
    if (!panel) return

    setIsTyping(true)
    
    try {
      // Use AI service if available
      if (aiService.isReady()) {
        const sceneData = await aiService.generateScene(
          `${panel.description}. ${instructions}`,
          panel.shotType,
          panel.cameraAngle,
          'enhanced'
        )
        
        const updates = {
          title: sceneData.title || panel.title,
          description: sceneData.description || panel.description,
          shotType: sceneData.shotType || panel.shotType,
          cameraAngle: sceneData.cameraAngle || panel.cameraAngle,
          notes: sceneData.notes || panel.notes,
          duration: panel.duration,
          updatedAt: new Date()
        }
        
        dispatch({ type: 'UPDATE_PANEL', payload: { id: panelId, updates } })
        
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `✅ **Panel Updated!** I've enhanced "${panel.title}" based on your instructions. The panel now features improved cinematography and storytelling elements.`,
          timestamp: new Date(),
          agentId: currentAgent.id
        }
        setMessages(prev => [...prev, successMessage])
      } else {
        // Fallback: Simple text-based update
        const updates = {
          description: `${panel.description} (Updated: ${instructions})`,
          notes: `${panel.notes} | AI Enhancement: ${instructions}`,
          updatedAt: new Date()
        }
        
        dispatch({ type: 'UPDATE_PANEL', payload: { id: panelId, updates } })
        
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `✅ **Panel Updated!** I've applied your instructions to "${panel.title}". For enhanced AI editing, add your OpenAI API key.`,
          timestamp: new Date(),
          agentId: currentAgent.id
        }
        setMessages(prev => [...prev, successMessage])
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Failed to edit panel. Please try again.',
        timestamp: new Date(),
          agentId: currentAgent.id
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const generateVideoPrompts = () => {
    // Minimal test message to isolate the issue
    const testMessage = {
      id: `test-${Date.now()}`,
      type: 'assistant' as const,
      content: '🎬 Video prompts feature is working! This is a test message.',
      timestamp: new Date(),
      agentId: currentAgent.id
    }
    
    setMessages(prevMessages => [...prevMessages, testMessage])
  }

  const generateFallbackVideoPrompt = (panel: any) => {
    return `${panel.shotType} ${panel.cameraAngle} shot: ${panel.description}. Professional cinematography with ${panel.shotType} framing, ${panel.cameraAngle} perspective, smooth camera movement, 4K resolution, 24fps, cinematic lighting, ${panel.duration} second duration, photorealistic quality, film grain texture.`
  }

  const addPanel = async (description: string) => {
    setIsTyping(true)
    
    try {
      let newPanel
      
      // Use AI service if available
      if (aiService.isReady()) {
        const sceneData = await aiService.generateScene(
          description,
          'medium-shot',
          'eye-level',
          'professional'
        )
        
        newPanel = {
          id: `panel-${Date.now()}`,
          title: sceneData.title || `Panel ${state.panels.length + 1}`,
          description: sceneData.description || description,
          shotType: sceneData.shotType || 'medium-shot',
          cameraAngle: sceneData.cameraAngle || 'eye-level',
          notes: sceneData.notes || '',
          duration: 4,
          order: state.panels.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          videoPrompt: sceneData.videoPrompt
        }
      } else {
        // Fallback: Create basic panel
        newPanel = {
          id: `panel-${Date.now()}`,
          title: `Panel ${state.panels.length + 1}`,
          description: description,
          shotType: 'medium-shot' as const,
          cameraAngle: 'eye-level' as const,
          notes: 'Manually created panel - enhance with AI by adding your OpenAI key',
          duration: 4,
          order: state.panels.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
      
      dispatch({ type: 'ADD_PANEL', payload: newPanel })
      
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `✅ **Panel Added!** Created "${newPanel.title}" ${aiService.isReady() ? 'with AI-enhanced cinematography' : 'with basic setup'}. Panel ${state.panels.length + 1} is ready for your story!`,
        timestamp: new Date(),
          agentId: currentAgent.id
      }
      setMessages(prev => [...prev, successMessage])
      
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Failed to add panel. Please try again.',
        timestamp: new Date(),
          agentId: currentAgent.id
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const removePanel = (panelNumber: number) => {
    const panelIndex = panelNumber - 1
    if (panelIndex >= 0 && panelIndex < state.panels.length) {
      const panel = state.panels[panelIndex]
      dispatch({ type: 'DELETE_PANEL', payload: panel.id })
      
      const message: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🗑️ **Panel Removed!** Deleted Panel ${panelNumber} ("${panel.title}"). Remaining panels have been reordered automatically.`,
        timestamp: new Date(),
          agentId: currentAgent.id
      }
      setMessages(prev => [...prev, message])
    } else {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `Panel ${panelNumber} doesn't exist. You have ${state.panels.length} panels (1-${state.panels.length}).`,
        timestamp: new Date(),
          agentId: currentAgent.id
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const updateDirectorNotes = async (newNotes: string) => {
    try {
      if (!state.currentProject) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: "You'll need a project first! Create one and I can help capture your creative vision.",
          timestamp: new Date(),
          agentId: currentAgent.id
        }])
        return
      }

      // Update the project with new director notes
      const updatedProject = {
        ...state.currentProject,
        panels: state.panels,
        directorNotes: newNotes,
        updatedAt: new Date()
      }

      dispatch({ type: 'SET_PROJECT', payload: updatedProject })

      // The project is automatically saved through the context dispatch above

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: `💡 **Director notes updated!** Got it - "${newNotes.length > 60 ? newNotes.slice(0, 60) + '...' : newNotes}"

This vision will guide all future AI video prompts to keep your project consistent. Check the sidebar to see your notes!`,
        timestamp: new Date(),
          agentId: currentAgent.id
      }])
    } catch (error) {
      console.error('Error updating director notes:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: "Had trouble saving that. Try updating director notes in the sidebar instead!",
        timestamp: new Date(),
          agentId: currentAgent.id
      }])
    }
  }

  const handleAIActions = async (response: string, originalUserInput: string) => {
    console.log('🎬 PROCESSING AI ACTIONS:', { response: response.substring(0, 200) + '...', originalUserInput })
    
    // Extract all action commands from the response
    const actionRegex = /\[ACTION:([^:]+):([^\]]*)\]/g
    const actions = []
    let match
    
    while ((match = actionRegex.exec(response)) !== null) {
      const actionType = match[1].trim()
      const actionParams = match[2].trim()
      actions.push({ type: actionType, params: actionParams })
      console.log('🔍 Found action:', { type: actionType, params: actionParams })
    }
    
    console.log('📋 Total actions found:', actions.length)
    
    if (actions.length === 0) {
      console.log('⚠️ No actions found in response, showing as regular message')
      return
    }
    
    // Process each action
    for (const action of actions) {
      console.log('🚀 Executing action:', action.type, 'with params:', action.params)
      
      try {
        switch (action.type) {
          case 'generate_storyboard':
            console.log('📝 Generating storyboard...')
            await generateStoryboard(action.params || originalUserInput)
            break
            
          case 'add_panel':
            console.log('➕ Adding panel...')
            await addPanel(action.params || originalUserInput)
            break
            
          case 'edit_panel':
            console.log('✏️ Editing panel...')
            if (state.panels.length > 0) {
              const lastPanel = state.panels[state.panels.length - 1]
              await editPanel(lastPanel.id, action.params || originalUserInput)
            }
            break
            
          case 'remove_panel':
            console.log('🗑️ Removing panel...')
            const panelNumber = parseInt(action.params) || state.panels.length
            if (panelNumber > 0 && panelNumber <= state.panels.length) {
              const panelToRemove = state.panels[panelNumber - 1]
              dispatch({ type: 'DELETE_PANEL', payload: panelToRemove.id })
            }
            break
            
          case 'analyze_storyboard':
            console.log('🔍 Analyzing storyboard...')
            await analyzeStoryboard()
            break
            
          case 'generate_video_prompts':
            console.log('🎥 Generating video prompts...')
            await generateVideoPrompts()
            break
            
          case 'update_director_notes':
            console.log('📋 Updating director notes...')
            if (state.currentProject) {
              dispatch({
                type: 'SET_PROJECT',
                payload: {
                  ...state.currentProject,
                  directorNotes: action.params
                }
              })
            }
            break
            
          // BATCH OPERATIONS
          case 'batch_edit':
            console.log('🎬 BATCH EDIT: Processing all panels...')
            await batchEditPanels(action.params || originalUserInput)
            break
            
          case 'batch_edit_range':
            console.log('🎬 BATCH EDIT RANGE: Processing panel range...')
            const rangeParts = action.params.split(':')
            if (rangeParts.length >= 3) {
              const start = parseInt(rangeParts[0]) - 1
              const end = parseInt(rangeParts[1]) - 1
              const instructions = rangeParts.slice(2).join(':')
              await batchEditRangeFunction(start, end, instructions)
            } else {
              await batchEditPanels(action.params || originalUserInput)
            }
            break
            
          case 'batch_apply_style':
            console.log('🎨 BATCH APPLY STYLE: Applying style to all panels...')
            const styleParts = action.params.split(':')
            if (styleParts.length >= 2) {
              const styleType = styleParts[0]
              const styleInstructions = styleParts.slice(1).join(':')
              await batchApplyStyle(styleType, styleInstructions)
            } else {
              await batchEditPanels(`apply ${action.params} style to all panels`)
            }
            break
            
          case 'enhance_all_cinematography':
            console.log('📸 ENHANCE ALL CINEMATOGRAPHY: Improving all panels...')
            await enhanceAllCinematography(action.params || 'enhance cinematography with professional techniques')
            break
            
          case 'standardize_shot_types':
            console.log('🎯 STANDARDIZE SHOT TYPES: Optimizing shot progression...')
            await standardizeShotTypes(action.params || 'optimize shot types for better visual flow')
            break
            
          default:
            console.warn('⚠️ Unknown action type:', action.type)
            // For unknown actions, try to interpret as batch edit if it sounds like one
            if (action.params && (action.params.includes('all') || action.params.includes('every'))) {
              console.log('🔄 Interpreting unknown action as batch edit...')
              await batchEditPanels(`${action.type}: ${action.params}` || originalUserInput)
            }
            break
        }
        
        console.log('✅ Action completed:', action.type)
        
      } catch (actionError) {
        console.error(`❌ Error executing action ${action.type}:`, actionError)
        
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `❌ **Action Failed** - I encountered an error while trying to ${action.type.replace('_', ' ')}. ${actionError instanceof Error ? actionError.message : 'Please try again or check your settings.'}`,
          timestamp: new Date(),
          agentId: currentAgent.id
        }
        setMessages(prev => [...prev, errorMessage])
      }
    }
    
    // Show the regular response (without action commands) as well
    const cleanResponse = response.replace(/\[ACTION:[^\]]+\]/g, '').trim()
    if (cleanResponse) {
      console.log('💬 Showing cleaned response alongside actions')
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: cleanResponse,
        timestamp: new Date(),
        agentId: currentAgent.id
      }
      setMessages(prev => [...prev, assistantMessage])
    }
    
    console.log('🎉 All AI actions processed successfully')
  }

  // Enhanced action handlers
  const enhancePanel = async (panelId: string, enhanceType: string, originalMessage: string) => {
    setIsTyping(true)
    try {
      const panel = state.panels.find(p => p.id === panelId) || state.panels[state.panels.length - 1]
      if (!panel) return

      if (aiService.isReady()) {
        const enhancementPrompt = `Enhance this storyboard panel with focus on ${enhanceType}:

CURRENT PANEL:
- Title: ${panel.title}
- Description: ${panel.description}
- Shot Type: ${panel.shotType}
- Camera Angle: ${panel.cameraAngle}
- Notes: ${panel.notes}

ENHANCEMENT REQUEST: ${originalMessage}
FOCUS: ${enhanceType}

PROJECT CONTEXT:
- Project: ${state.currentProject?.title}
- Director Notes: ${state.currentProject?.directorNotes}
- Total Panels: ${state.panels.length}

Provide enhanced version with improved description, notes, and any technical adjustments. Return as JSON with keys: title, description, notes, shotType, cameraAngle.`

        const enhancedData = await aiService.generateScene(enhancementPrompt, panel.shotType, panel.cameraAngle, 'enhanced')
        
        if (enhancedData && enhancedData.description) {
          dispatch({
            type: 'UPDATE_PANEL',
            payload: {
              id: panel.id,
              updates: {
                title: enhancedData.title || panel.title,
                description: enhancedData.description,
                notes: enhancedData.notes || panel.notes,
                updatedAt: new Date()
              }
            }
          })
          
          const successMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `✨ **Panel Enhanced!** "${panel.title}" has been improved with focus on ${enhanceType}. Check out the updated description and technical details!`,
            timestamp: new Date(),
            agentId: currentAgent.id
          }
          setMessages(prev => [...prev, successMessage])
        }
      }
    } catch (error) {
      console.error('Error enhancing panel:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const createProject = async (projectData: string) => {
    try {
      const [title, description] = projectData.split('|')
      const newProject = {
        id: `project-${Date.now()}`,
        title: title || 'New AI Project',
        description: description || 'Created by AI Assistant',
        panels: [],
        directorNotes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      dispatch({ type: 'SET_PROJECT', payload: newProject })
      
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🎬 **New Project Created!** "${newProject.title}" is ready for your creative vision. What story shall we tell?`,
        timestamp: new Date(),
        agentId: currentAgent.id
      }
      setMessages(prev => [...prev, successMessage])
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const optimizeStoryFlow = async (instructions: string) => {
    setIsTyping(true)
    try {
      if (aiService.isReady() && state.panels.length > 0) {
        const optimizationPrompt = `Analyze and optimize the story flow of this storyboard:

CURRENT STORYBOARD:
${state.panels.map((p, i) => `Panel ${i+1}: ${p.title} - ${p.description} (${p.shotType}, ${p.cameraAngle})`).join('\n')}

OPTIMIZATION REQUEST: ${instructions}

PROJECT CONTEXT:
- Title: ${state.currentProject?.title}
- Description: ${state.currentProject?.description}
- Director Notes: ${state.currentProject?.directorNotes}

Provide suggestions for improving story flow, pacing, and visual variety. Include specific recommendations for panel adjustments.`

        const analysis = await aiService.sendMessage(
          [{ role: 'user', content: optimizationPrompt }],
          {
            projectTitle: state.currentProject?.title || '',
            projectDescription: state.currentProject?.description || '',
            panelCount: state.panels.length,
            totalDuration: state.panels.reduce((acc, p) => acc + (p.duration || 0), 0),
            allPanels: state.panels.map((p, i) => ({ number: i + 1, title: p.title, description: p.description, shotType: p.shotType, cameraAngle: p.cameraAngle, duration: p.duration, notes: p.notes })),
            directorNotes: state.currentProject?.directorNotes
          }
        )
        
        const message: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `📊 **Story Flow Analysis**\n\n${analysis}`,
          timestamp: new Date(),
          agentId: currentAgent.id
        }
        setMessages(prev => [...prev, message])
      }
    } catch (error) {
      console.error('Error optimizing story flow:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const generateAlternative = async (panelId: string, altType: string, instructions: string) => {
    setIsTyping(true)
    try {
      const panel = state.panels.find(p => p.id === panelId) || state.panels[state.panels.length - 1]
      if (!panel) return

      if (aiService.isReady()) {
        const alternativePrompt = `Create an alternative version of this storyboard panel:

ORIGINAL PANEL:
- Title: ${panel.title}
- Description: ${panel.description}
- Shot Type: ${panel.shotType}
- Camera Angle: ${panel.cameraAngle}

ALTERNATIVE TYPE: ${altType}
INSTRUCTIONS: ${instructions}

PROJECT CONTEXT:
- Project: ${state.currentProject?.title}
- Story Context: Panel ${state.panels.findIndex(p => p.id === panel.id) + 1} of ${state.panels.length}

Create a fresh take while maintaining story continuity. Focus on ${altType} variations.`

        const altData = await aiService.generateScene(alternativePrompt, panel.shotType, panel.cameraAngle, 'alternative')
        
        if (altData && altData.description) {
          // Create new panel with alternative content
          const newPanel = {
            id: `panel-${Date.now()}`,
            title: `${altData.title || panel.title} (Alt)`,
            description: altData.description,
            shotType: panel.shotType,
            cameraAngle: panel.cameraAngle,
            notes: `Alternative version: ${altData.notes || ''}`,
            duration: panel.duration,
            order: state.panels.length,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          dispatch({ type: 'ADD_PANEL', payload: newPanel })
          
          const successMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `🎭 **Alternative Created!** New panel added with ${altType} variation. Compare with the original to see different creative approaches!`,
            timestamp: new Date(),
            agentId: currentAgent.id
          }
          setMessages(prev => [...prev, successMessage])
        }
      }
    } catch (error) {
      console.error('Error generating alternative:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const batchEditPanels = async (instructions: string) => {
    setIsTyping(true)
    console.log('🚀 BATCH EDIT STARTED:', {
      instructions,
      panelCount: state.panels.length,
      hasApiKey: aiService.isReady(),
      projectTitle: state.currentProject?.title
    })
    
    try {
      if (!aiService.isReady()) {
        console.log('❌ No API key available')
        const message: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: "🔑 **API Key Required** - I need an OpenAI API key to perform batch edits. Please add your key in Settings.",
          timestamp: new Date(),
          agentId: currentAgent.id
        }
        setMessages(prev => [...prev, message])
        return
      }

      if (state.panels.length === 0) {
        console.log('❌ No panels to edit')
        const message: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: "📝 **No Panels to Edit** - Create some storyboard panels first, then I can help you batch edit them!",
          timestamp: new Date(),
          agentId: currentAgent.id
        }
        setMessages(prev => [...prev, message])
        return
      }
        
      console.log('🔄 Starting batch edit for', state.panels.length, 'panels with instructions:', instructions)
      
      // Show immediate feedback
      const startMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🎬 **Batch Edit Starting...** 

Processing ${state.panels.length} panels with: "${instructions}"

This may take a moment as I enhance each panel with AI. Please wait...`,
        timestamp: new Date(),
        agentId: currentAgent.id
      }
      setMessages(prev => [...prev, startMessage])
      
      const batchPrompt = `Apply these batch edits to ALL storyboard panels. For each panel, provide the enhanced version:

INSTRUCTIONS: ${instructions}

PROJECT CONTEXT:
- Title: ${state.currentProject?.title}
- Description: ${state.currentProject?.description}
- Director Notes: ${state.currentProject?.directorNotes}
- Total Panels: ${state.panels.length}

CURRENT PANELS:
${state.panels.map((p, i) => `Panel ${i+1}:
  Title: ${p.title}
  Description: ${p.description}
  Shot Type: ${p.shotType}
  Camera Angle: ${p.cameraAngle}
  Notes: ${p.notes}`).join('\n\n')}

Return a JSON array with exactly ${state.panels.length} updated panels. Each panel object should have:
- title: enhanced title
- description: enhanced description  
- notes: enhanced director notes
- shotType: appropriate shot type from [wide-shot, medium-shot, close-up, extreme-close-up, over-the-shoulder, two-shot, establishing-shot]
- cameraAngle: appropriate camera angle from [eye-level, high-angle, low-angle, birds-eye-view, worms-eye-view, dutch-angle]

Apply the requested changes "${instructions}" while maintaining story flow and continuity. Return ONLY the JSON array, no other text.

Example format:
[
  {
    "title": "Enhanced Panel Title",
    "description": "Enhanced detailed description with improvements",
    "notes": "Enhanced director notes with specific guidance",
    "shotType": "medium-shot",
    "cameraAngle": "eye-level"
  }
]`

      console.log('📤 Sending batch request to AI...')
      const batchResponse = await aiService.sendMessage(
        [{ role: 'user', content: batchPrompt }],
        {
          projectTitle: state.currentProject?.title || '',
          projectDescription: state.currentProject?.description || '',
          panelCount: state.panels.length,
          totalDuration: state.panels.reduce((acc, p) => acc + (p.duration || 0), 0),
          allPanels: state.panels.map((p, i) => ({ number: i + 1, title: p.title, description: p.description, shotType: p.shotType, cameraAngle: p.cameraAngle, duration: p.duration, notes: p.notes })),
          directorNotes: state.currentProject?.directorNotes
        }
      )
      
      console.log('📥 AI batch response received:', batchResponse)
      
      // Try to parse the JSON response with multiple fallback strategies
      try {
        let jsonText = batchResponse.trim()
        console.log('🔍 Original response length:', jsonText.length)
        
        // Strategy 1: Clean up common AI response patterns
        if (jsonText.includes('```json')) {
          console.log('📝 Extracting from markdown json block')
          jsonText = jsonText.split('```json')[1].split('```')[0].trim()
        } else if (jsonText.includes('```')) {
          console.log('📝 Extracting from markdown block')
          jsonText = jsonText.split('```')[1].split('```')[0].trim()
        }
        
        // Strategy 2: Find JSON array boundaries
        const startBracket = jsonText.indexOf('[')
        const endBracket = jsonText.lastIndexOf(']')
        if (startBracket !== -1 && endBracket !== -1 && startBracket < endBracket) {
          console.log('📝 Extracting JSON array from response')
          jsonText = jsonText.substring(startBracket, endBracket + 1)
        }
        
        // Strategy 3: Remove common prefixes/suffixes
        jsonText = jsonText.replace(/^[^[\{]*/, '').replace(/[^\]\}]*$/, '')
        
        console.log('📝 Cleaned JSON text (first 200 chars):', jsonText.substring(0, 200))
        console.log('📝 Cleaned JSON text (last 100 chars):', jsonText.substring(Math.max(0, jsonText.length - 100)))
        
        const updatedPanels = JSON.parse(jsonText)
        console.log('✅ Successfully parsed JSON, received:', updatedPanels.length, 'panels')
        
        if (Array.isArray(updatedPanels) && updatedPanels.length === state.panels.length) {
          console.log('✅ Valid panel updates received, applying changes...')
          
          // Apply updates to each panel with additional validation
          let updatedCount = 0
          for (let i = 0; i < state.panels.length; i++) {
            const currentPanel = state.panels[i]
            const updatedPanel = updatedPanels[i]
            
            if (updatedPanel && typeof updatedPanel === 'object') {
              console.log(`📝 Updating panel ${i + 1}:`, {
                oldTitle: currentPanel.title,
                newTitle: updatedPanel.title,
                hasDescription: !!updatedPanel.description,
                hasNotes: !!updatedPanel.notes
              })
              
              dispatch({
                type: 'UPDATE_PANEL',
                payload: {
                  id: currentPanel.id,
                  updates: {
                    title: updatedPanel.title || currentPanel.title,
                    description: updatedPanel.description || currentPanel.description,
                    notes: updatedPanel.notes || currentPanel.notes,
                    shotType: (updatedPanel.shotType || currentPanel.shotType) as ShotType,
                    cameraAngle: (updatedPanel.cameraAngle || currentPanel.cameraAngle) as CameraAngle,
                    updatedAt: new Date()
                  }
                }
              })
              updatedCount++
            } else {
              console.warn(`⚠️ Invalid panel data for panel ${i + 1}:`, updatedPanel)
            }
          }
          
          console.log('✅ Batch edit completed successfully:', updatedCount, 'panels updated')
          const successMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `🎬 **Batch Edit Complete!** 

✅ Successfully updated **${updatedCount}** panels with: "${instructions}"

All panels have been enhanced while maintaining story flow and continuity. Check your storyboard to see the improvements!

**What was enhanced:**
• Improved titles and descriptions
• Enhanced director notes
• Optimized shot types and camera angles
• Applied consistent style modifications`,
            timestamp: new Date(),
            agentId: currentAgent.id
          }
          setMessages(prev => [...prev, successMessage])
          
        } else {
          console.error('❌ Invalid response format:', {
            isArray: Array.isArray(updatedPanels),
            receivedLength: updatedPanels?.length,
            expectedLength: state.panels.length
          })
          throw new Error(`Invalid response format: expected ${state.panels.length} panels, got ${updatedPanels?.length || 0}`)
        }
        
      } catch (parseError) {
        console.error('❌ Failed to parse batch response:', parseError)
        console.log('📄 Raw response that failed to parse:', batchResponse)
        
        // Fallback: Apply changes individually using AI scene generation
        console.log('🔄 Switching to individual panel processing fallback...')
        await batchEditFallback(instructions)
      }
        
    } catch (error) {
      console.error('❌ Error in batch editing panels:', error)
      await batchEditFallback(instructions)
    } finally {
      setIsTyping(false)
    }
  }

  // Enhanced fallback that processes each panel individually
  const batchEditFallback = async (instructions: string) => {
    console.log('🔄 FALLBACK: Processing panels individually...')
    
    const fallbackMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `🔄 **Switching to Individual Processing...** 

The batch process hit a snag, so I'm now enhancing each panel individually with AI. This ensures every panel gets the attention it deserves!

Processing "${instructions}" on ${state.panels.length} panels...`,
      timestamp: new Date(),
      agentId: currentAgent.id
    }
    setMessages(prev => [...prev, fallbackMessage])
    
    let processedCount = 0
    let successCount = 0
    
    for (let i = 0; i < state.panels.length; i++) {
      const panel = state.panels[i]
      console.log(`🔄 Processing panel ${i + 1}/${state.panels.length}: ${panel.title}`)
      
      try {
        // Apply rate limiting to avoid overwhelming the API
        if (i > 0) {
          console.log('⏱️ Rate limiting: waiting 1 second...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        const enhancedPanel = await aiService.generateScene(
          `${instructions}. Current panel: "${panel.title}" - ${panel.description}. Director notes: ${panel.notes}`,
          panel.shotType,
          panel.cameraAngle,
          'enhanced'
        )
        
        if (enhancedPanel && (enhancedPanel.title || enhancedPanel.description)) {
          console.log(`✅ Enhanced panel ${i + 1}:`, {
            originalTitle: panel.title,
            newTitle: enhancedPanel.title,
            hasNewDescription: !!enhancedPanel.description
          })
          
          dispatch({
            type: 'UPDATE_PANEL',
            payload: {
              id: panel.id,
              updates: {
                title: enhancedPanel.title || panel.title,
                description: enhancedPanel.description || panel.description,
                notes: enhancedPanel.notes || panel.notes,
                shotType: (enhancedPanel.shotType || panel.shotType) as ShotType,
                cameraAngle: (enhancedPanel.cameraAngle || panel.cameraAngle) as CameraAngle,
                updatedAt: new Date()
              }
            }
          })
          successCount++
        } else {
          console.warn(`⚠️ No enhancements generated for panel ${i + 1}`)
        }
        
        processedCount++
        
      } catch (panelError) {
        console.error(`❌ Failed to process panel ${i + 1}:`, panelError)
        processedCount++
        // Continue with next panel instead of failing completely
      }
    }
    
    console.log(`✅ Fallback processing complete: ${successCount}/${processedCount} panels enhanced`)
    
    const resultsMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `🎬 **Individual Processing Complete!** 

✅ Successfully enhanced **${successCount}** out of **${processedCount}** panels with: "${instructions}"

${successCount === processedCount 
  ? "🎉 All panels were successfully enhanced!" 
  : `⚠️ ${processedCount - successCount} panels couldn't be enhanced, but they remain unchanged.`
}

Your storyboard now has improved panels with the requested modifications!`,
      timestamp: new Date(),
      agentId: currentAgent.id
    }
    setMessages(prev => [...prev, resultsMessage])
  }

  const exportProject = async (format: string) => {
    try {
      const exportData = {
        project: state.currentProject,
        panels: state.panels,
        exportedAt: new Date(),
        format: format
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${state.currentProject?.title || 'storyboard'}-export.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `📁 **Project Exported!** Your storyboard has been saved as "${state.currentProject?.title || 'storyboard'}-export.json". You can import it later or share with collaborators.`,
        timestamp: new Date(),
        agentId: currentAgent.id
      }
      setMessages(prev => [...prev, successMessage])
    } catch (error) {
      console.error('Error exporting project:', error)
    }
  }

  const handleAgentSelection = (agent: AIAgent) => {
    setCurrentAgent(agent)
    setShowAgentSelector(false)
    setShowFavoritesPanel(false) // Close favorites panel when selecting agent
    
    // Don't save the chat if it's a new empty one
    if (messages.length > 1 || currentChatId) {
      autoSaveChat()
    }
    
    // Reset messages for new agent if no current chat ID
    if (!currentChatId) {
      setMessages([{
        id: '1',
        type: 'assistant',
        content: createWelcomeMessage(),
        timestamp: new Date(),
        agentId: agent.id
      }])
    }
    
    // Save agent preference
    localStorage.setItem('preferred-ai-agent', agent.id)
  }

  const handleQuickAgentSwitch = (agentId: string) => {
    const agent = aiAgents.find(a => a.id === agentId)
    if (agent) {
      handleAgentSelection(agent)
    }
  }

  const handleHeaderToggle = () => {
    const newCollapsedState = !isHeaderCollapsed
    setIsHeaderCollapsed(newCollapsedState)
    
    // Close all panels when collapsing header
    if (newCollapsedState) {
      setShowFavoritesPanel(false)
      setActivePanel(null)
    }
    // When expanding, auto-show favorites if user has them (for better UX)
    else if (favoriteAgents.length > 0 && favoriteAgents.length <= 3) {
      setShowFavoritesPanel(true)
    }
  }

  // Chat history management functions
  const handleSelectChat = (chat: SavedChat) => {
    loadChat(chat)
    setActivePanel(null)
  }

  const handleDeleteChat = (chatId: string) => {
    const success = chatManager.deleteChat(chatId)
    if (success) {
      const allChats = chatManager.getAllChats()
      setChats(allChats)
    }
  }

  const handleRenameChat = (chatId: string, currentName: string) => {
    setEditingChatId(chatId)
    setEditingName(currentName)
  }

  const handleSaveRename = () => {
    if (editingChatId && editingName.trim()) {
      const success = chatManager.renameChat(editingChatId, editingName.trim())
      if (success) {
        const allChats = chatManager.getAllChats()
        setChats(allChats)
      }
    }
    setEditingChatId(null)
    setEditingName('')
  }

  const handleCancelRename = () => {
    setEditingChatId(null)
    setEditingName('')
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getAgentTheme = (agentId: string) => {
    const agent = getAgentById(agentId)
    return agent?.theme || {
      primary: '#6366F1',
      secondary: '#818CF8',
      accent: '#E0E7FF',
      gradient: 'from-indigo-600 to-purple-600'
    }
  }

  // Load saved agent on component mount
  useEffect(() => {
    const savedAgent = localStorage.getItem('selected-ai-agent')
    if (savedAgent) {
      try {
        const agent = JSON.parse(savedAgent)
        setCurrentAgent(agent)
      } catch (error) {
        console.warn('Failed to load saved agent:', error)
      }
    }
  }, [])

  // Auto-save chat when messages change
  useEffect(() => {
    if (messages.length > 1) { // Don't save just the welcome message
      autoSaveChat()
    }
  }, [messages, currentAgent])

  const autoSaveChat = async () => {
    try {
      setSaveState({ status: 'saving' })
      
      // Check if we should regenerate the chat name (every 3 user messages)
      const userMessageCount = messages.filter(msg => msg.type === 'user').length
      const shouldRegenerateName = userMessageCount > 0 && userMessageCount % 3 === 0
      
      const savedChat = await chatManager.saveChat(
        messages,
        currentAgent,
        state.currentProject?.id,
        state.currentProject?.title,
        currentChatId || undefined,
        shouldRegenerateName
      )
      
      if (!currentChatId) {
        setCurrentChatId(savedChat.id)
      }
      
      setSaveState({ 
        status: 'saved', 
        lastSaved: new Date() 
      })
      
    } catch (error) {
      console.error('Failed to auto-save chat:', error)
      setSaveState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Save failed' 
      })
      
      // Auto-hide error status after 5 seconds
      setTimeout(() => {
        setSaveState(prev => ({ ...prev, status: 'saved', lastSaved: new Date() }))
      }, 5000)
    }
  }

  const loadChat = (chat: SavedChat) => {
    setMessages(chat.messages)
    setCurrentChatId(chat.id)
    
    // Switch to the agent from the loaded chat
    const agent = getAgentById(chat.agentId)
    if (agent) {
      setCurrentAgent(agent)
    }
    
    setSaveState({ status: 'saved', lastSaved: chat.updatedAt })
  }

  const startNewChat = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: createWelcomeMessage(),
      timestamp: new Date(),
          agentId: currentAgent.id
    }])
    setCurrentChatId(null)
    setSaveState({ status: 'idle' })
  }

  // Enhanced batch operations for specific panel ranges
  const batchEditPanelRange = async (startIndex: number, endIndex: number, instructions: string) => {
    setIsTyping(true)
    try {
      const start = Math.max(0, startIndex - 1)
      const end = Math.min(state.panels.length - 1, endIndex - 1)
      const panelsToEdit = state.panels.slice(start, end + 1)
      
      if (panelsToEdit.length === 0) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `❌ **Invalid Range** - Panels ${startIndex} to ${endIndex} don't exist.`,
          timestamp: new Date(),
          agentId: currentAgent.id
        }
        setMessages(prev => [...prev, errorMessage])
        return
      }

      let successCount = 0
      for (let i = 0; i < panelsToEdit.length; i++) {
        const panel = panelsToEdit[i]
        try {
          const enhancementPrompt = `${panel.description} - ${instructions}`
          const enhancedData = await aiService.generateScene(enhancementPrompt, panel.shotType, panel.cameraAngle, 'enhanced')
          
          if (enhancedData && enhancedData.description) {
            dispatch({
              type: 'UPDATE_PANEL',
              payload: {
                id: panel.id,
                updates: {
                  title: enhancedData.title || panel.title,
                  description: enhancedData.description,
                  notes: enhancedData.notes || panel.notes,
                  updatedAt: new Date()
                }
              }
            })
            successCount++
          }
          
          if (i < panelsToEdit.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        } catch (panelError) {
          console.error(`❌ Failed to update panel ${start + i + 1}:`, panelError)
        }
      }
    } catch (error) {
      console.error('❌ Error in range batch edit:', error)
    } finally {
      setIsTyping(false)
    }
  }

  // Apply consistent style to all panels
  const batchApplyStyle = async (styleType: string, styleInstructions: string) => {
    setIsTyping(true)
    try {
      let successCount = 0
      for (let i = 0; i < state.panels.length; i++) {
        const panel = state.panels[i]
        try {
          const stylePrompt = `Apply ${styleType} style to this scene: ${panel.description}. ${styleInstructions}`
          const styledData = await aiService.generateScene(stylePrompt, panel.shotType, panel.cameraAngle, styleType)
          
          if (styledData && styledData.description) {
            dispatch({
              type: 'UPDATE_PANEL',
              payload: {
                id: panel.id,
                updates: {
                  title: styledData.title || panel.title,
                  description: styledData.description,
                  notes: `${styleType} style: ${styledData.notes || panel.notes}`,
                  updatedAt: new Date()
                }
              }
            })
            successCount++
          }
          
          if (i < state.panels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 400))
          }
        } catch (panelError) {
          console.error(`❌ Failed to apply style to panel ${i + 1}:`, panelError)
        }
      }
    } catch (error) {
      console.error('❌ Error applying style:', error)
    } finally {
      setIsTyping(false)
    }
  }

  // Enhance cinematography for all panels
  const enhanceAllCinematography = async (instructions: string) => {
    setIsTyping(true)
    try {
      let successCount = 0
      const shotTypes = ['close-up', 'medium-shot', 'wide-shot', 'extreme-close-up', 'long-shot']
      const cameraAngles = ['eye-level', 'high-angle', 'low-angle', 'bird-eye', 'worm-eye', 'dutch-angle']
      
      for (let i = 0; i < state.panels.length; i++) {
        const panel = state.panels[i]
        try {
          const suggestedShot = shotTypes[i % shotTypes.length]
          const suggestedAngle = cameraAngles[i % cameraAngles.length]
          
          const cinematographyPrompt = `Enhance the cinematography: ${panel.description}. ${instructions}`
          const enhancedData = await aiService.generateScene(cinematographyPrompt, suggestedShot, suggestedAngle, 'cinematic')
          
          if (enhancedData && enhancedData.description) {
            dispatch({
              type: 'UPDATE_PANEL',
              payload: {
                id: panel.id,
                updates: {
                  title: enhancedData.title || panel.title,
                  description: enhancedData.description,
                  notes: `Enhanced cinematography: ${enhancedData.notes || panel.notes}`,
                  shotType: (enhancedData.shotType || suggestedShot) as ShotType,
                  cameraAngle: (enhancedData.cameraAngle || suggestedAngle) as CameraAngle,
                  updatedAt: new Date()
                }
              }
            })
            successCount++
          }
          
          if (i < state.panels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (panelError) {
          console.error(`❌ Failed to enhance cinematography for panel ${i + 1}:`, panelError)
        }
      }
    } catch (error) {
      console.error('❌ Error enhancing cinematography:', error)
    } finally {
      setIsTyping(false)
    }
  }

  // Standardize shot types for better flow
  const standardizeShotTypes = async (instructions: string) => {
    setIsTyping(true)
    try {
      const shotProgression = []
      for (let i = 0; i < state.panels.length; i++) {
        if (i === 0) shotProgression.push('wide-shot')
        else if (i === state.panels.length - 1) shotProgression.push('close-up')
        else if (i % 3 === 0) shotProgression.push('wide-shot')
        else if (i % 3 === 1) shotProgression.push('medium-shot')
        else shotProgression.push('close-up')
      }
      
      let successCount = 0
      for (let i = 0; i < state.panels.length; i++) {
        const panel = state.panels[i]
        const targetShotType = shotProgression[i]
        
        if (panel.shotType !== targetShotType) {
          try {
            dispatch({
              type: 'UPDATE_PANEL',
              payload: {
                id: panel.id,
                updates: {
                  shotType: targetShotType as ShotType,
                  notes: `Standardized shot type: ${panel.notes || ''}`,
                  updatedAt: new Date()
                }
              }
            })
            successCount++
          } catch (panelError) {
            console.error(`❌ Failed to standardize panel ${i + 1}:`, panelError)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error standardizing shot types:', error)
    } finally {
      setIsTyping(false)
    }
  }

  // Additional batch functions
  const batchEditRangeFunction = async (start: number, end: number, instructions: string) => {
    if (start < 0 || end >= state.panels.length || start > end) {
      console.error('❌ Invalid range for batch edit')
      return
    }
    
    const targetPanels = state.panels.slice(start, end + 1)
    
    for (let i = 0; i < targetPanels.length; i++) {
      const panel = targetPanels[i]
      try {
        const enhancedPanel = await aiService.generateScene(
          `${instructions}. Current panel: "${panel.title}" - ${panel.description}`,
          panel.shotType,
          panel.cameraAngle,
          'enhanced'
        )
        
        if (enhancedPanel && (enhancedPanel.title || enhancedPanel.description)) {
          dispatch({
            type: 'UPDATE_PANEL',
            payload: {
              id: panel.id,
              updates: {
                title: enhancedPanel.title || panel.title,
                description: enhancedPanel.description || panel.description,
                notes: enhancedPanel.notes || panel.notes,
                shotType: (enhancedPanel.shotType || panel.shotType) as ShotType,
                cameraAngle: (enhancedPanel.cameraAngle || panel.cameraAngle) as CameraAngle,
                updatedAt: new Date()
              }
            }
          })
        }
        
        if (i < targetPanels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`❌ Failed to process panel ${start + i + 1}:`, error)
      }
    }
  }

  const analyzeStoryboard = async () => {
    if (state.panels.length === 0) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Your storyboard is empty! Start by generating a storyboard or adding panels.',
        timestamp: new Date(),
          agentId: currentAgent.id
      }
      setMessages(prev => [...prev, message])
      return
    }

    setIsTyping(true)
    
    try {
      const storyboardSummary = state.panels.map((panel, index) => 
        `Panel ${index + 1}: ${panel.title} - ${panel.description} (${panel.shotType}, ${panel.cameraAngle}, ${panel.duration}s)`
      ).join('\n')

      const analysisPrompt = `Analyze this storyboard and provide professional feedback:

PROJECT: ${state.currentProject?.title || 'Untitled'}
TOTAL PANELS: ${state.panels.length}

STORYBOARD:
${storyboardSummary}

Please provide:
1. Story structure analysis
2. Visual flow and pacing assessment  
3. Shot variety and composition feedback
4. Suggestions for improvement
5. Professional filmmaking recommendations

Focus on storytelling effectiveness and cinematic quality.`

      const response = await sendMessageToAI(analysisPrompt)
      
      const message: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `📊 **Storyboard Analysis**\n\n${response}`,
        timestamp: new Date(),
          agentId: currentAgent.id
      }
      setMessages(prev => [...prev, message])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Failed to analyze storyboard. Please try again.',
        timestamp: new Date(),
          agentId: currentAgent.id
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <WindowFrame
        isOpen={isOpen}
        title={`AI Assistant - ${currentAgent.name}`}
        subtitle={currentAgent.specialty}
        icon={<Bot className="w-5 h-5" />}
        defaultWidth="340px"
        defaultHeight="500px"
        minWidth={300}
        minHeight={350}
        maxWidth="600px"
        maxHeight="90vh"
        resizable={true}
        minimizable={true}
        maximizable={true}
        windowId="ai-assistant-main"
        zIndex={9050}
        onClose={onClose}
      >
        {/* Fixed Layout Container */}
        <div 
          className="flex flex-col h-full"
          style={{ 
            backgroundColor: themeState.theme.colors.background.primary,
            color: themeState.theme.colors.text.primary
          }}
        >
          {/* Collapsible Header Section */}
          <div 
            className={`border-b flex-shrink-0 transition-all duration-300 ${
              isHeaderCollapsed ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: isHeaderCollapsed 
                ? `${themeState.theme.colors.background.secondary}95`
                : themeState.theme.colors.background.secondary,
              borderColor: themeState.theme.colors.border.primary
            }}
          >
            {/* Always Visible Compact Header */}
            <div className={`flex items-center justify-between transition-all duration-200 ${
              isHeaderCollapsed ? 'p-1.5' : 'p-2'
            }`}>
              <div className="flex items-center space-x-1.5">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-all duration-300 border"
                  style={{ 
                    backgroundColor: currentAgent.theme.primary,
                    borderColor: themeState.theme.colors.border.primary
                  }}
                  onClick={() => setShowAgentSelector(true)}
                  title={`Click to change agent - Currently: ${currentAgent.name}`}
                >
                  <span className="text-xs font-medium text-white">{currentAgent.avatar}</span>
                </div>
                
                {/* Minimal info when collapsed, full info when expanded */}
                {!isHeaderCollapsed ? (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-0.5">
                      <h3 className="font-semibold text-xs truncate" style={{ color: themeState.theme.colors.text.primary }}>
                        {currentAgent.name}
                      </h3>
                      <button
                        onClick={() => setShowAgentSelector(true)}
                        className="p-0.5 rounded transition-colors hover:bg-white/10"
                        title="Change AI Agent"
                        style={{ color: themeState.theme.colors.text.secondary }}
                      >
                        <Users className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs truncate" style={{ color: themeState.theme.colors.text.secondary }}>
                      {currentAgent.specialty}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium truncate max-w-[80px]" style={{ color: themeState.theme.colors.text.primary }}>
                      {currentAgent.name}
                    </span>
                    {favoriteAgents.length > 0 && (
                      <div 
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: themeState.theme.colors.primary[400] }}
                        title={`${favoriteAgents.length} favorite agents available`}
                      />
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-0.5">
                                {/* Minimal panel access when collapsed */}
                {isHeaderCollapsed && (
                  <div className="flex items-center space-x-0.5">
                    {favoriteAgents.length > 0 && (
                      <button
                        onClick={() => setShowAgentSelector(true)}
                        className="text-xs p-1 rounded transition-all duration-200 hover:bg-white/10 hover:scale-110"
                        title="Quick access to favorite agents"
                        style={{ color: themeState.theme.colors.primary[500] }}
                      >
                        <Star className="w-3 h-3 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowAgentSelector(true)}
                      className="text-xs p-1 rounded transition-all duration-200 hover:bg-white/10 hover:scale-110"
                      title="Change agent"
                      style={{ color: themeState.theme.colors.text.secondary }}
                    >
                      <Users className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setShowImageSettings(true)}
                      className="text-xs p-1 rounded transition-all duration-200 hover:bg-white/10 hover:scale-110"
                      title="Image settings"
                      style={{ color: themeState.theme.colors.text.secondary }}
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Collapse/Expand Toggle */}
                <button
                  onClick={handleHeaderToggle}
                  className="text-xs p-1 rounded transition-all duration-200 hover:bg-white/10 hover:scale-110"
                  title={isHeaderCollapsed ? "Expand header for more options" : "Collapse header to save space"}
                  style={{ color: themeState.theme.colors.text.secondary }}
                >
                  {isHeaderCollapsed ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  )}
                </button>

                {/* Conditional buttons based on collapse state */}
                {!isHeaderCollapsed && (
                  <>
                    <SaveStatusIndicator saveState={saveState} className="text-xs" />
                    
                    {/* Favorites Toggle Button */}
                    {favoriteAgents.length > 0 && (
                      <button
                        onClick={() => setShowFavoritesPanel(!showFavoritesPanel)}
                        className={`text-xs px-1.5 py-0.5 flex items-center space-x-0.5 transition-all duration-200 ${
                          showFavoritesPanel ? 'btn-primary' : 'btn-secondary'
                        }`}
                        title="Quick switch favorite agents"
                      >
                        <Star className={`w-3 h-3 ${showFavoritesPanel ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </>
                )}
                
                {/* Always visible new chat button (essential functionality) */}
                <button
                  onClick={startNewChat}
                  className={`btn-secondary text-xs ${
                    isHeaderCollapsed ? 'px-1 py-1' : 'px-1.5 py-0.5'
                  } flex items-center space-x-0.5 transition-all duration-200`}
                  title="Start new chat"
                >
                  <Plus className="w-3 h-3" />
                  {!isHeaderCollapsed && <span>New</span>}
                </button>
              </div>
            </div>

            {/* Collapsible Quick Actions Row */}
            {!isHeaderCollapsed && (
              <div 
                className="px-2 pb-2 animate-slide-down"
                style={{
                  backgroundColor: `${themeState.theme.colors.background.secondary}80`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {/* Quick access buttons */}
                    <button
                      onClick={() => setShowAgentSelector(true)}
                      className="text-xs px-1.5 py-0.5 btn-secondary flex items-center space-x-0.5"
                      title="Change agent"
                    >
                      <Users className="w-3 h-3" />
                      <span>Agent</span>
                    </button>
                    
                    {favoriteAgents.length > 0 && (
                      <button
                        onClick={() => {
                          setShowFavoritesPanel(!showFavoritesPanel)
                          setActivePanel(null)
                        }}
                        className={`text-xs px-1.5 py-0.5 flex items-center space-x-0.5 transition-all duration-200 ${
                          showFavoritesPanel ? 'btn-primary' : 'btn-secondary'
                        }`}
                        title="Favorites"
                      >
                        <Star className={`w-3 h-3 ${showFavoritesPanel ? 'fill-current' : ''}`} />
                        <span>Fav</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setActivePanel(activePanel === 'history' ? null : 'history')
                        setShowFavoritesPanel(false)
                      }}
                      className={`text-xs px-1.5 py-0.5 flex items-center space-x-0.5 transition-all duration-200 ${
                        activePanel === 'history' ? 'btn-primary' : 'btn-secondary'
                      }`}
                      title="Chat history"
                    >
                      <History className="w-3 h-3" />
                      <span>History</span>
                    </button>
                  </div>
                  
                  <SaveStatusIndicator saveState={saveState} className="text-xs" />
                </div>
              </div>
            )}

            {/* Integrated Favorites Panel - Part of the collapsible header */}
            {!isHeaderCollapsed && showFavoritesPanel && favoriteAgents.length > 0 && (
              <div 
                className="px-2 pb-2 animate-slide-down"
                style={{
                  backgroundColor: `${themeState.theme.colors.primary[50]}20`,
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs" style={{ color: themeState.theme.colors.text.primary }}>
                      ⭐ Favorite Agents
                    </h4>
                    <button
                      onClick={() => setShowFavoritesPanel(false)}
                      className="p-0.5 hover:bg-white/10 rounded transition-colors"
                      style={{ color: themeState.theme.colors.text.secondary }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {favoriteAgents.slice(0, 6).map(agentId => {
                      const agent = aiAgents.find(a => a.id === agentId)
                      if (!agent) return null
                      
                      const isCurrentAgent = agent.id === currentAgent.id
                      
                      return (
                        <button
                          key={agent.id}
                          onClick={() => handleQuickAgentSwitch(agent.id)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs transition-all duration-200 hover:scale-105 touch-manipulation ${
                            isCurrentAgent ? 'ring-2' : ''
                          }`}
                          style={{
                            backgroundColor: isCurrentAgent 
                              ? `${agent.theme.primary}40` 
                              : `${agent.theme.primary}20`,
                            color: isCurrentAgent 
                              ? agent.theme.primary 
                              : themeState.theme.colors.text.primary,
                            border: `1px solid ${agent.theme.primary}50`,
                            ...(isCurrentAgent && { ringColor: agent.theme.primary })
                          }}
                          title={`Switch to ${agent.name} - ${agent.specialty}`}
                        >
                          <span className="text-xs">{agent.avatar}</span>
                          <span className="font-medium truncate max-w-[60px]">{agent.name}</span>
                          {isCurrentAgent && <span className="text-xs">•</span>}
                        </button>
                      )
                    })}
                    
                    {favoriteAgents.length > 6 && (
                      <button
                        onClick={() => setShowAgentSelector(true)}
                        className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs transition-all duration-200 hover:scale-105 border-dashed"
                        style={{
                          backgroundColor: `${themeState.theme.colors.background.secondary}50`,
                          color: themeState.theme.colors.text.secondary,
                          borderColor: themeState.theme.colors.border.primary
                        }}
                        title="View all favorites"
                      >
                        <span>+{favoriteAgents.length - 6}</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="text-xs" style={{ color: themeState.theme.colors.text.secondary }}>
                    💡 Tip: Star agents in the selector to add them here
                  </div>
                </div>
              </div>
            )}



            {/* Integrated Chat History Panel */}
            {!isHeaderCollapsed && activePanel === 'history' && (
              <div 
                className="px-2 pb-2 animate-slide-down"
                style={{
                  backgroundColor: `${themeState.theme.colors.background.secondary}40`,
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs" style={{ color: themeState.theme.colors.text.primary }}>
                      📖 Chat History ({chats.length})
                    </h4>
                    <button
                      onClick={() => setActivePanel(null)}
                      className="p-0.5 hover:bg-white/10 rounded transition-colors"
                      style={{ color: themeState.theme.colors.text.secondary }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3" style={{ color: themeState.theme.colors.text.secondary }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats..."
                      className="input-modern w-full text-xs pl-6 pr-2 py-1"
                    />
                  </div>

                  {/* Chat List */}
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredChats.length === 0 ? (
                      <div className="text-xs text-center py-6" style={{ color: themeState.theme.colors.text.secondary }}>
                        {chats.length === 0 ? (
                          <>💡 No saved chats yet<br />Start a conversation to save your first chat</>
                        ) : (
                          'No chats match your search'
                        )}
                      </div>
                    ) : (
                      filteredChats.slice(0, 8).map(chat => {
                        const agent = getAgentById(chat.agentId)
                        const theme = getAgentTheme(chat.agentId)
                        const isCurrentChat = chat.id === currentChatId
                        const isEditing = editingChatId === chat.id

                        return (
                          <div
                            key={chat.id}
                            className={`relative p-2 rounded-lg border transition-all duration-200 hover:bg-white/5 ${
                              isCurrentChat ? 'ring-1' : ''
                            }`}
                            style={{
                              backgroundColor: isCurrentChat ? `${theme.primary}20` : 'transparent',
                              borderColor: isCurrentChat ? theme.primary : themeState.theme.colors.border.primary,
                              ...(isCurrentChat && { ringColor: theme.primary })
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => handleSelectChat(chat)}
                              >
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs">{agent?.avatar || '🤖'}</span>
                                  
                                  {isEditing ? (
                                    <div className="flex-1 flex items-center space-x-1">
                                      <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') handleSaveRename()
                                          if (e.key === 'Escape') handleCancelRename()
                                        }}
                                        className="flex-1 px-1 py-0.5 text-xs border rounded"
                                        style={{
                                          backgroundColor: themeState.theme.colors.background.secondary,
                                          borderColor: themeState.theme.colors.border.primary,
                                          color: themeState.theme.colors.text.primary
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        onClick={handleSaveRename}
                                        className="text-green-600 hover:text-green-700 text-xs"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={handleCancelRename}
                                        className="text-red-600 hover:text-red-700 text-xs"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex-1">
                                      <h5 className="font-medium text-xs truncate" style={{ color: themeState.theme.colors.text.primary }}>
                                        {chat.name}
                                      </h5>
                                      {isCurrentChat && (
                                        <span className="text-xs px-1 py-0.5 rounded text-white" style={{ backgroundColor: theme.primary }}>
                                          Current
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-1 text-xs ml-4" style={{ color: themeState.theme.colors.text.secondary }}>
                                  <User className="w-2.5 h-2.5" />
                                  <span>{chat.agentName}</span>
                                  <span>•</span>
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{formatRelativeTime(chat.lastActivity)}</span>
                                </div>
                                
                                <div className="text-xs ml-4 mt-1 line-clamp-2" style={{ color: themeState.theme.colors.text.secondary }}>
                                  {chat.messages.length > 1 
                                    ? chat.messages.find(msg => msg.type === 'user')?.content?.substring(0, 60) + '...'
                                    : 'New conversation'
                                  }
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center space-x-0.5 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRenameChat(chat.id, chat.name)
                                  }}
                                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                                  style={{ color: themeState.theme.colors.text.secondary }}
                                  title="Rename chat"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteChat(chat.id)
                                  }}
                                  className="p-0.5 hover:bg-red-100 rounded transition-colors text-red-600"
                                  title="Delete chat"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    
                    {filteredChats.length > 8 && (
                      <div className="text-xs text-center py-2" style={{ color: themeState.theme.colors.text.secondary }}>
                        ...and {filteredChats.length - 8} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Integrated Image Settings Panel */}
            {!isHeaderCollapsed && activePanel === 'settings' && (
              <div 
                className="px-2 pb-2 animate-slide-down"
                style={{
                  backgroundColor: `${themeState.theme.colors.background.secondary}40`,
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs" style={{ color: themeState.theme.colors.text.primary }}>
                      🎨 Image Settings
                    </h4>
                    <button
                      onClick={() => setActivePanel(null)}
                      className="p-0.5 hover:bg-white/10 rounded transition-colors"
                      style={{ color: themeState.theme.colors.text.secondary }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium" style={{ color: themeState.theme.colors.text.primary }}>
                        Model
                      </label>
                      <select 
                        value={imageSettings.model}
                        onChange={(e) => setImageSettings(prev => ({ ...prev, model: e.target.value as any }))}
                        className="input-modern w-full text-xs mt-0.5"
                      >
                        <option value="dall-e-3">DALL-E 3 (Best Quality)</option>
                        <option value="dall-e-2">DALL-E 2 (Faster)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium" style={{ color: themeState.theme.colors.text.primary }}>
                        Style
                      </label>
                      <select 
                        value={imageSettings.style}
                        onChange={(e) => setImageSettings(prev => ({ ...prev, style: e.target.value as any }))}
                        className="input-modern w-full text-xs mt-0.5"
                      >
                        <option value="photorealistic">Photorealistic</option>
                        <option value="cinematic">Cinematic</option>
                        <option value="artistic">Artistic</option>
                        <option value="cartoon">Cartoon</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium" style={{ color: themeState.theme.colors.text.primary }}>
                        Quality
                      </label>
                      <select 
                        value={imageSettings.quality}
                        onChange={(e) => setImageSettings(prev => ({ ...prev, quality: e.target.value as any }))}
                        className="input-modern w-full text-xs mt-0.5"
                      >
                        <option value="standard">Standard</option>
                        <option value="hd">HD (Higher Quality)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setActivePanel(null)}
                      className="btn-primary text-xs px-2 py-1 w-full"
                    >
                      Apply Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        
          {/* Fixed Status Indicator */}
          {!aiService.isReady() && (
            <div 
              className="p-1.5 border-b flex-shrink-0"
              style={{
                backgroundColor: `${themeState.theme.colors.primary[100]}20`,
                borderColor: themeState.theme.colors.border.primary
              }}
            >
              <div className="flex items-center space-x-1.5">
                <div 
                  className="p-0.5 rounded"
                  style={{ backgroundColor: `${themeState.theme.colors.primary[500]}20` }}
                >
                  <Settings className="w-3 h-3" style={{ color: themeState.theme.colors.primary[500] }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium" style={{ color: themeState.theme.colors.text.primary }}>
                    Setup Required
                  </p>
                  <p className="text-xs" style={{ color: themeState.theme.colors.text.secondary }}>
                    Add OpenAI API key
                  </p>
                </div>
                <button 
                  onClick={() => setShowApiKeyInput(true)}
                  className="btn-primary text-xs px-1.5 py-0.5"
                >
                  Add Key
                </button>
              </div>
            </div>
          )}

          {/* Fixed API Key Input */}
          {showApiKeyInput && (
            <div 
              className="p-2 border-b flex-shrink-0"
              style={{
                backgroundColor: themeState.theme.colors.background.secondary,
                borderColor: themeState.theme.colors.border.primary
              }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs" style={{ color: themeState.theme.colors.text.primary }}>
                      OpenAI API Key
                    </h4>
                    <p className="text-xs" style={{ color: themeState.theme.colors.text.secondary }}>
                      Required for AI features
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowApiKeyInput(false)}
                    className="p-0.5 hover:bg-white/10 rounded transition-colors"
                    style={{ color: themeState.theme.colors.text.secondary }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="input-modern w-full text-xs"
                  onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
                />
                <div className="flex items-center justify-between">
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs underline transition-colors"
                    style={{ color: themeState.theme.colors.primary[500] }}
                  >
                    Get API key from OpenAI →
                  </a>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setShowApiKeyInput(false)}
                      className="btn-secondary text-xs px-1.5 py-0.5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApiKeySubmit}
                      className="btn-primary text-xs px-1.5 py-0.5"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Scrollable Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-1.5 space-y-1.5"
            style={{
              backgroundColor: themeState.theme.colors.background.primary
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-lg shadow-sm transition-all duration-300 p-2 ${
                    message.type === 'user'
                      ? 'ml-6'
                      : message.type === 'system'
                      ? 'mr-6'
                      : 'mr-6'
                  }`}
                  style={{
                    backgroundColor: message.type === 'user' 
                      ? themeState.theme.colors.primary[500]
                      : message.type === 'system'
                      ? `${themeState.theme.colors.primary[100]}40`
                      : themeState.theme.colors.background.secondary,
                    color: message.type === 'user'
                      ? 'white'
                      : themeState.theme.colors.text.primary,
                    borderColor: themeState.theme.colors.border.primary,
                    border: message.type !== 'user' ? `1px solid ${themeState.theme.colors.border.primary}` : 'none'
                  }}
                >
                  <MarkdownRenderer content={message.content} className="text-xs leading-snug" />
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/20">
                    <p className="text-xs opacity-70 font-medium">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    {message.type === 'assistant' && (
                      <div className="flex items-center space-x-0.5">
                        <Star className="w-3 h-3 opacity-50" />
                        <span className="text-xs opacity-70">AI</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div 
                  className="p-2 rounded-lg border mr-6"
                  style={{
                    backgroundColor: themeState.theme.colors.background.secondary,
                    borderColor: themeState.theme.colors.border.primary
                  }}
                >
                  <div className="flex items-center space-x-1.5">
                    <div className="flex space-x-0.5">
                      <div 
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ backgroundColor: themeState.theme.colors.primary[400] }}
                      ></div>
                      <div 
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ 
                          backgroundColor: themeState.theme.colors.primary[400],
                          animationDelay: '0.1s'
                        }}
                      ></div>
                      <div 
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ 
                          backgroundColor: themeState.theme.colors.primary[400],
                          animationDelay: '0.2s'
                        }}
                      ></div>
                    </div>
                    <span 
                      className="text-xs font-medium"
                      style={{ color: themeState.theme.colors.text.secondary }}
                    >
                      {currentAgent.name} is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Fixed Input Section */}
          <div 
            className="p-1.5 border-t flex-shrink-0"
            style={{
              backgroundColor: themeState.theme.colors.background.secondary,
              borderColor: themeState.theme.colors.border.primary
            }}
          >
            <div className="space-y-1.5">
              {/* Input Row */}
              <div className="flex items-end space-x-1.5">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Ask about storyboarding, scenes, or filmmaking..."
                    className="input-modern w-full text-xs resize-none"
                    disabled={isTyping}
                    rows={input.includes('\n') ? Math.min(input.split('\n').length, 3) : 1}
                    style={{
                      minHeight: '32px',
                      maxHeight: '72px'
                    }}
                  />
                </div>
                
                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  className="btn-primary p-1.5 flex items-center justify-center"
                  style={{ 
                    minHeight: '32px',
                    minWidth: '32px'
                  }}
                >
                  {isTyping ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </button>
              </div>
              
              {/* Status Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-0.5 text-xs" style={{ color: themeState.theme.colors.text.secondary }}>
                  <Lightbulb className="w-3 h-3" style={{ color: themeState.theme.colors.primary[500] }} />
                  <span>Shift+Enter for new line</span>
                </div>
                
                {!isTyping && input.trim() && (
                  <div className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-xs font-medium"
                       style={{ 
                         backgroundColor: `${themeState.theme.colors.primary[100]}40`,
                         color: themeState.theme.colors.primary[600]
                       }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeState.theme.colors.primary[500] }}></div>
                    <span>Ready</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </WindowFrame>

      {/* Fallback Modals - Only for collapsed state */}
      <AIImageSettings
        isOpen={showImageSettings && isHeaderCollapsed}
        onClose={() => setShowImageSettings(false)}
        onSave={handleImageSettingsSave}
        currentSettings={imageSettings}
      />

      <AIAgentSelector
        isOpen={showAgentSelector}
        onClose={() => setShowAgentSelector(false)}
        onSelectAgent={handleAgentSelection}
        currentAgent={currentAgent}
      />

      <ChatHistoryManager
        isOpen={showChatHistory && isHeaderCollapsed}
        onClose={() => setShowChatHistory(false)}
        onSelectChat={loadChat}
        currentChatId={currentChatId || undefined}
      />
    </>
  )
} 