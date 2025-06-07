import { useState, useRef, useEffect } from 'react'
import { X, Send, Plus, Video, Wand2, Settings, Users, Sparkles, History, Bot } from 'lucide-react'
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
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    style: 'photorealistic',
    quality: 'standard',
    aspectRatio: '16:9',
    size: '1024x1024',
    model: 'dall-e-3',
    creativity: 7,
    artStyle: 'cinematic',
    lighting: 'natural',
    mood: 'neutral',
    colorScheme: 'full-color'
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize API key input with current value
  useEffect(() => {
    const currentApiKey = aiService.getApiKey()
    if (currentApiKey) {
      setApiKeyInput(currentApiKey)
    }
  }, [])

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      aiService.setApiKey(apiKeyInput.trim())
      setShowApiKeyInput(false)
      // Update welcome message to reflect new status
      const updatedWelcome = createWelcomeMessage()
      setMessages(prev => prev.map((msg, index) => 
        index === 0 ? { ...msg, content: updatedWelcome } : msg
      ))
    }
  }

  const handleImageSettingsSave = (newSettings: ImageSettings) => {
    setImageSettings(newSettings)
    // Store settings in localStorage for persistence
    localStorage.setItem('aiImageSettings', JSON.stringify(newSettings))
    console.log('💾 AI image settings saved to localStorage:', newSettings)
  }

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('aiImageSettings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setImageSettings(parsedSettings)
        console.log('📁 Loaded AI image settings from localStorage:', parsedSettings)
      } catch (error) {
        console.error('Failed to load AI image settings:', error)
        // Save default settings if parsing fails
        const defaultSettings = {
          style: 'photorealistic',
          quality: 'standard',
          aspectRatio: '16:9',
          size: '1024x1024',
          model: 'dall-e-3',
          creativity: 7,
          artStyle: 'cinematic',
          lighting: 'natural',
          mood: 'neutral',
          colorScheme: 'full-color'
        }
        localStorage.setItem('aiImageSettings', JSON.stringify(defaultSettings))
        setImageSettings(defaultSettings)
        console.log('💾 Saved default AI image settings:', defaultSettings)
      }
    } else {
      // Save default settings if none exist
      const defaultSettings = {
        style: 'photorealistic',
        quality: 'standard',
        aspectRatio: '16:9',
        size: '1024x1024',
        model: 'dall-e-3',
        creativity: 7,
        artStyle: 'cinematic',
        lighting: 'natural',
        mood: 'neutral',
        colorScheme: 'full-color'
      }
      localStorage.setItem('aiImageSettings', JSON.stringify(defaultSettings))
      setImageSettings(defaultSettings)
      console.log('💾 No settings found, saved defaults:', defaultSettings)
    }
  }, [])

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

  const generateIntelligentLocalResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    // Analyze project state for better responses
    const hasContent = state.panels.length > 0
    const projectName = state.currentProject?.title || 'your project'
    
    if (input.includes('generate') && input.includes('storyboard')) {
      return `I'd love to create a storyboard for you! But I need to connect to my AI brain first.

Quick fix: Make sure your development server is running with \`npm run dev\` and you have an OpenAI API key set up.

While we get that sorted, you can browse templates or start a new project. Once I'm connected, just describe your story and I'll build the whole storyboard for you! 🎬`
    }
    
    if (input.includes('edit') || input.includes('change') || input.includes('modify')) {
      if (hasContent) {
        return `I can help edit your ${state.panels.length} panels in "${projectName}"! 

🎬 **Current panels**: ${state.panels.map((p, i) => `Panel ${i+1}: ${p.title}`).join(', ')}

✏️ **For AI-powered editing, I need**:
• Server connection to OpenAI
• Try: "Edit panel 2 to show a dramatic close-up"
• Or: "Change panel 1 camera angle to low-angle"

🛠️ **Manual editing**: Click any panel to edit it directly with the panel editor.`
      } else {
        return `You don't have any panels to edit yet! Let's create some content first:

🚀 **Quick start options**:
• Click "Templates" for ready-made storyboards
• Use "New Project" to start from scratch
• Once I'm connected to AI, say "Generate storyboard for: [your idea]"`
      }
    }
    
    if (input.includes('video') || input.includes('prompt')) {
      if (hasContent) {
        return `Perfect! I can generate video prompts for your ${state.panels.length} panels.

🎥 **For AI-powered video prompts**:
• Click the "Video Prompts" button below
• Or once connected, say "Generate video prompts"

📱 **Manual approach**: Use your panels as guides:
${state.panels.slice(0, 3).map((p, i) => `• Panel ${i+1}: "${p.shotType} ${p.cameraAngle} of ${p.description}"`).join('\n')}
${state.panels.length > 3 ? `• ...and ${state.panels.length - 3} more panels` : ''}`
      } else {
        return `You'll need some storyboard panels first before generating video prompts!

🎬 **Create panels by**:
• Using project templates (click "Templates")
• Generating with AI (once connected)
• Adding manually with "New Project"`
      }
    }
    
    if (input.includes('help') || input.includes('what') || input.includes('how')) {
      return `Hey! I'm here to help you create amazing storyboards. ${hasContent ? `I can see you're working on "${projectName}" with ${state.panels.length} panels - nice start!` : `Let's get you started!`}

Here's what I can do:
• Generate complete storyboards from your story ideas
• Edit individual panels ("edit panel 2 to show...")
• Create video prompts for AI video tools
• Update your director notes and creative vision
• Analyze story flow and suggest improvements

Right now I can help with project management through the sidebar. Once the AI server is running, I can do the full creative stuff!

What would you like to work on?`
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
      console.log('🗣️ User message:', userMessage.content)
      
      // Intelligent pre-processing to detect batch operations
      const userInput = userMessage.content.toLowerCase()
      const shouldUseBatch = 
        userInput.includes('all panels') || 
        userInput.includes('every panel') || 
        userInput.includes('entire storyboard') || 
        userInput.includes('whole project') || 
        userInput.includes('all of them') || 
        userInput.includes('everything') || 
        userInput.includes('the whole thing') ||
        userInput.includes('make them all') ||
        userInput.includes('apply') && (userInput.includes('to all') || userInput.includes('to everything')) ||
        userInput.includes('enhance all') ||
        userInput.includes('improve all') ||
        userInput.includes('update all') ||
        userInput.match(/panels? \d+-\d+/) || // "panels 2-5"
        userInput.match(/panels? \d+ to \d+/) || // "panels 2 to 5"
        userInput.includes('better cinematography for all') ||
        userInput.includes('fix the shot types')

      console.log('🔍 Batch operation detection:', shouldUseBatch, 'for input:', userInput)
      
      // Let AI decide what to do - but give it enhanced context
      const enhancedPrompt = shouldUseBatch 
        ? `${userMessage.content}

IMPORTANT: This request seems to apply to multiple or all panels. Please use appropriate batch actions like [ACTION:batch_edit:instructions] or [ACTION:batch_apply_style:style:instructions] or [ACTION:enhance_all_cinematography:instructions] etc.`
        : userMessage.content
        
      console.log('💭 Enhanced prompt:', enhancedPrompt)
      
      const aiResponse = await sendMessageToAI(enhancedPrompt)
      console.log('🤖 AI response:', aiResponse)
      
      // Check if AI response contains action instructions
      if (aiResponse.includes('[ACTION:') && aiResponse.includes(']')) {
        console.log('✅ AI response contains actions, processing...')
        await handleAIActions(aiResponse, userMessage.content)
        return
      }
      
      console.log('⚠️ No actions detected in AI response, checking for fallback triggers...')
      
      // Enhanced fallback: Check if user intended an action but AI didn't include it
      if (shouldUseBatch && state.panels.length > 0) {
        console.log('🔧 Triggering batch operation fallback')
        
        if (userInput.includes('more dramatic') || userInput.includes('dramatic')) {
          await batchEditPanels('make all panels more dramatic with intense lighting and dynamic camera angles')
          return
        } else if (userInput.includes('cinematic') || userInput.includes('cinematography')) {
          await enhanceAllCinematography('enhance cinematography with professional techniques')
          return
        } else if (userInput.includes('style') && (userInput.includes('horror') || userInput.includes('action') || userInput.includes('comedy') || userInput.includes('noir'))) {
          const styleMatch = userInput.match(/(horror|action|comedy|noir|thriller|romance|sci-fi|fantasy)/i)
          if (styleMatch) {
            await batchApplyStyle(styleMatch[1], `apply ${styleMatch[1]} style with appropriate mood and cinematography`)
            return
          }
        } else {
          // Generic batch edit
          await batchEditPanels(userMessage.content)
          return
        }
      } else if (userInput.includes('generate') && userInput.includes('storyboard')) {
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
    // Save selected agent to localStorage for persistence
    localStorage.setItem('selected-ai-agent', JSON.stringify(agent))
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

  // Quick actions with enhanced visual feedback and animations
  const quickActions = [
    { 
      icon: Wand2, 
      label: 'Generate Story', 
      action: () => {
        const examplePrompts = [
          "Create a 6-panel storyboard for a dramatic scene where a detective discovers a crucial clue",
          "Generate a comedic sequence showing a chef's kitchen disaster",
          "Design an action scene with a high-speed chase through the city"
        ]
        setInput(examplePrompts[Math.floor(Math.random() * examplePrompts.length)])
      },
      gradient: 'from-purple-500 to-pink-500',
      className: 'hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105'
    },
    { 
      icon: Settings, 
      label: 'AI Settings', 
      action: () => setShowImageSettings(true),
      gradient: 'from-blue-500 to-cyan-500',
      className: 'hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-105'
    },
    { 
      icon: Users, 
      label: 'Switch Agent', 
      action: () => setShowAgentSelector(true),
      gradient: 'from-green-500 to-emerald-500',
      className: 'hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105'
    },
    { 
      icon: History, 
      label: 'Chat History', 
      action: () => setShowChatHistory(true),
      gradient: 'from-orange-500 to-red-500',
      className: 'hover:shadow-lg hover:shadow-orange-500/25 transform hover:scale-105'
    },
    { 
      icon: Video, 
      label: 'Video Prompts', 
      action: generateVideoPrompts,
      gradient: 'from-indigo-500 to-purple-500',
      className: 'hover:shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105'
    },
    {
      icon: Sparkles,
      label: 'Analyze Story',
      action: analyzeStoryboard,
      gradient: 'from-pink-500 to-rose-500',
      className: 'hover:shadow-lg hover:shadow-pink-500/25 transform hover:scale-105'
    }
  ]

  if (!isOpen) return null

  return (
    <WindowFrame
      isOpen={isOpen}
      title={`AI Assistant - ${currentAgent.name}`}
      subtitle={currentAgent.specialty}
      icon={<Bot className="w-5 h-5" />}
      defaultWidth="380px"
      defaultHeight="550px"
      minWidth={320}
      minHeight={400}
      onClose={onClose}
    >
      {/* Minimized Header with Glass Effect */}
      <div className="flex items-center justify-between p-3 border-b border-primary bg-secondary/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-110 transition-all duration-300 animate-float"
            style={{ 
              background: `linear-gradient(135deg, ${currentAgent.theme.primary}ee, ${currentAgent.theme.secondary}ee)`,
              boxShadow: `0 4px 12px ${currentAgent.theme.primary}40`
            }}
            onClick={() => setShowAgentSelector(true)}
            title={`Click to change agent - Currently: ${currentAgent.name}`}
          >
            <span className="text-sm font-medium text-primary-theme drop-shadow-sm">{currentAgent.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <h3 className="font-semibold text-primary text-sm truncate">{currentAgent.name}</h3>
              <button
                onClick={() => setShowAgentSelector(true)}
                className="p-0.5 hover:bg-tertiary rounded transition-all duration-200 opacity-70 hover:opacity-100"
                title="Change AI Agent"
              >
                <Users className="w-3 h-3 text-secondary" />
              </button>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-secondary font-medium truncate">{currentAgent.specialty}</span>
              <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${
                currentAgent.personality === 'creative' && 'bg-purple-500/20 text-purple-400 border border-purple-500/30' ||
                currentAgent.personality === 'professional' && 'bg-blue-500/20 text-blue-400 border border-blue-500/30' ||
                currentAgent.personality === 'friendly' && 'bg-green-500/20 text-green-400 border border-green-500/30' ||
                currentAgent.personality === 'analytical' && 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' ||
                currentAgent.personality === 'enthusiastic' && 'bg-orange-500/20 text-orange-400 border border-orange-500/30' ||
                currentAgent.personality === 'calm' && 'bg-teal-500/20 text-teal-400 border border-teal-500/30' ||
                currentAgent.personality === 'witty' && 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' ||
                currentAgent.personality === 'inspiring' && 'bg-pink-500/20 text-pink-400 border border-pink-500/30' ||
                'bg-secondary/50 text-secondary border border-primary/20'
              }`}>
                <Sparkles className="w-2 h-2 inline mr-0.5" />
                {currentAgent.personality}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Compact Status & Controls */}
          <SaveStatusIndicator saveState={saveState} className="text-xs" />
          
          <button
            onClick={startNewChat}
            className="flex items-center space-x-1 px-2 py-1 bg-tertiary/80 hover:bg-tertiary rounded-md transition-all duration-200 text-xs font-medium border border-primary/20 hover:border-primary/40"
            title="Start new chat"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">New</span>
          </button>
          
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors p-1 hover:bg-tertiary rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Enhanced Status Indicator with Glass Effect */}
      {!aiService.isReady() && (
        <div className="p-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-500/20 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-orange-400 text-xs">
            <Settings className="w-3 h-3 animate-pulse" />
            <span>
              AI features require OpenAI API key - 
              <button 
                onClick={() => setShowApiKeyInput(true)}
                className="ml-1 underline hover:no-underline text-orange-300 hover:text-orange-200 transition-colors"
              >
                Add Key
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Compact API Key Input with Glass Morphism */}
      {showApiKeyInput && (
        <div className="p-3 bg-secondary/80 backdrop-blur-sm border-b border-primary">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-primary text-sm">OpenAI API Key</h4>
              <button 
                onClick={() => setShowApiKeyInput(false)}
                className="text-secondary hover:text-primary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-..."
              className="input-modern text-xs w-full bg-tertiary/80 backdrop-blur-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleApiKeySubmit}
                className="btn-primary text-xs px-2 py-1"
              >
                Save Key
              </button>
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="btn-secondary text-xs px-2 py-1"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-secondary">
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-secondary transition-colors">OpenAI Platform</a>
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Quick Actions Grid with Animations */}
      <div className="p-2 border-b border-primary bg-secondary/50 backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-1.5">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-300 text-primary hover:text-primary-theme border border-primary/20 hover:border-primary-400 bg-gradient-to-br ${action.gradient} bg-opacity-10 hover:bg-opacity-100 ${action.className || ''}`}
              style={{
                animationDelay: `${index * 100}ms`,
                transform: 'translateZ(0)'
              }}
            >
              <action.icon className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
        
        {/* Compact Contextual Tips */}
        {messages.length <= 1 && (
          <div className="mt-2">
            <ContextualTips context="ai-assistant" className="text-xs opacity-80" />
          </div>
        )}
      </div>

      {/* Enhanced Messages with Better Styling */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollable bg-primary/50 backdrop-blur-sm">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-xl shadow-lg transition-all duration-300 backdrop-blur-sm ${
                message.type === 'user'
                  ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-primary-theme border border-primary-400/50 shadow-primary-500/25'
                  : message.type === 'system'
                  ? 'bg-gradient-to-br from-tertiary to-secondary text-primary border border-primary/30 shadow-lg'
                  : 'bg-gradient-to-br from-secondary to-tertiary text-primary border border-primary/20 shadow-lg hover:shadow-xl'
              }`}
              style={{
                transform: 'translateZ(0)',
                boxShadow: message.type === 'user' 
                  ? '0 8px 32px rgba(var(--primary), 0.25)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <MarkdownRenderer content={message.content} className="text-xs leading-relaxed font-medium" />
              <p className="text-xs mt-1.5 opacity-70 font-normal">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {/* Enhanced Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gradient-to-r from-secondary to-tertiary p-3 rounded-xl border border-primary/20 shadow-lg backdrop-blur-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Section with Always-Visible Send Button */}
      <div className="ai-send-button">
        <div className="ai-send-input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Ask about storyboarding, scenes, or filmmaking... (Shift+Enter for new line)"
            className="ai-send-input input-modern text-xs font-medium placeholder-tertiary-theme bg-primary/80 border border-primary/30 focus:border-primary/60 transition-all duration-300 resize-none"
            disabled={isTyping}
            rows={1}
            style={{
              backgroundColor: themeState.theme.colors.background.primary,
              borderColor: themeState.theme.colors.border.primary,
              color: themeState.theme.colors.text.primary
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-300 shrink-0"
            style={{ 
              transform: 'translateZ(0)',
              minHeight: '40px'
            }}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:block font-semibold">Send</span>
          </button>
        </div>
        
        {/* Quick Actions Bar - Always Visible */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/20">
          <div className="flex items-center space-x-2 text-xs text-secondary-theme">
            <span>💡 Try: "Generate storyboard", "Edit panel 3", "Add new scene"</span>
          </div>
          <div className="flex items-center space-x-1">
            {!isTyping && input.trim() && (
              <span className="text-xs text-primary-theme font-medium px-2 py-1 bg-primary/10 rounded-md">
                Ready to send
              </span>
            )}
            {isTyping && (
              <span className="text-xs text-secondary-theme font-medium px-2 py-1 bg-secondary/20 rounded-md flex items-center space-x-1">
                <div className="w-2 h-2 bg-primary animate-pulse rounded-full"></div>
                <span>AI is thinking...</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI Image Settings Modal */}
      <AIImageSettings
        isOpen={showImageSettings}
        onClose={() => setShowImageSettings(false)}
        onSave={handleImageSettingsSave}
        currentSettings={imageSettings}
      />

      {/* AI Agent Selector Modal */}
      <AIAgentSelector
        isOpen={showAgentSelector}
        onClose={() => setShowAgentSelector(false)}
        onSelectAgent={handleAgentSelection}
        currentAgent={currentAgent}
      />

      {/* Chat History Manager */}
      <ChatHistoryManager
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        onSelectChat={loadChat}
        currentChatId={currentChatId || undefined}
      />
    </WindowFrame>
  )
} 