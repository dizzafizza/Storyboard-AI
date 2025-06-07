import { SavedChat, ChatMessage, AIAgent } from '../types'
import { aiService } from './ai'

class ChatManagerService {
  private readonly STORAGE_KEY = 'ai-assistant-chats'
  private readonly MAX_CHATS = 50 // Limit to prevent storage overflow
  
  // Save a chat to localStorage
  async saveChat(
    messages: ChatMessage[], 
    agent: AIAgent, 
    projectId?: string, 
    projectName?: string,
    existingChatId?: string,
    forceRegenerateName?: boolean
  ): Promise<SavedChat> {
    const chats = this.getAllChats()
    const now = new Date()
    
    let chatName = ''
    
    // Check if we should generate/regenerate the chat name
    const shouldGenerateName = messages.length > 1 && (
      !existingChatId || // New chat
      forceRegenerateName || // Forced regeneration
      (existingChatId && chats.find(c => c.id === existingChatId)?.name.startsWith('New ')) // Replace default name
    )
    
    if (shouldGenerateName) {
      // Generate AI-powered chat name based on conversation context
      chatName = await this.generateChatName(messages, agent)
    } else if (existingChatId) {
      // Keep existing name
      const existingChat = chats.find(c => c.id === existingChatId)
      chatName = existingChat?.name || `${agent.name} Chat`
    } else {
      chatName = `New ${agent.name} Chat`
    }
    
    const chatId = existingChatId || this.generateChatId()
    
    const savedChat: SavedChat = {
      id: chatId,
      name: chatName,
      messages: messages,
      agentId: agent.id,
      agentName: agent.name,
      projectId,
      projectName,
      createdAt: existingChatId ? chats.find(c => c.id === existingChatId)?.createdAt || now : now,
      updatedAt: now,
      lastActivity: now,
      messageCount: messages.length
    }
    
    // Update or add the chat
    const chatIndex = chats.findIndex(c => c.id === chatId)
    if (chatIndex >= 0) {
      chats[chatIndex] = savedChat
    } else {
      chats.unshift(savedChat) // Add to beginning for recency
    }
    
    // Limit number of stored chats
    if (chats.length > this.MAX_CHATS) {
      chats.splice(this.MAX_CHATS)
    }
    
    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chats))
    
    return savedChat
  }
  
  // Get all saved chats
  getAllChats(): SavedChat[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const chats = JSON.parse(stored) as SavedChat[]
      
      // Convert date strings back to Date objects
      return chats.map(chat => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        lastActivity: new Date(chat.lastActivity),
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      })).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
      
    } catch (error) {
      console.error('Failed to load chats:', error)
      return []
    }
  }
  
  // Get a specific chat by ID
  getChat(chatId: string): SavedChat | null {
    const chats = this.getAllChats()
    return chats.find(chat => chat.id === chatId) || null
  }
  
  // Delete a chat
  deleteChat(chatId: string): boolean {
    try {
      const chats = this.getAllChats()
      const filteredChats = chats.filter(chat => chat.id !== chatId)
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredChats))
      return true
    } catch (error) {
      console.error('Failed to delete chat:', error)
      return false
    }
  }
  
  // Rename a chat
  renameChat(chatId: string, newName: string): boolean {
    try {
      const chats = this.getAllChats()
      const chatIndex = chats.findIndex(chat => chat.id === chatId)
      
      if (chatIndex >= 0) {
        chats[chatIndex].name = newName
        chats[chatIndex].updatedAt = new Date()
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chats))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to rename chat:', error)
      return false
    }
  }
  
  // Clear all chats
  clearAllChats(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear chats:', error)
      return false
    }
  }
  
  // Generate a unique chat ID
  private generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Generate AI-powered chat name based on conversation context
  private async generateChatName(messages: ChatMessage[], agent: AIAgent): Promise<string> {
    try {
      if (!aiService.isReady()) {
        return this.generateFallbackName(messages, agent)
      }
      
      // Get the first few meaningful messages for context
      const contextMessages = messages
        .filter(msg => msg.type !== 'system' && msg.content.length > 10)
        .slice(0, 6)
        .map(msg => `${msg.type}: ${msg.content.substring(0, 200)}`)
        .join('\n')
      
      if (!contextMessages) {
        return this.generateFallbackName(messages, agent)
      }
      
      const namePrompt = `Based on this conversation with ${agent.name} (a ${agent.specialty} specialist), generate a concise, descriptive chat title (2-4 words max). Focus on the main topic or creative goal discussed:

${contextMessages}

Generate ONLY the title, no quotes or explanation. Examples of good titles:
- "Action Hero Storyboard"
- "Romance Scene Creation"  
- "Horror Atmosphere Design"
- "Comedy Timing Analysis"
- "Epic Battle Sequence"`

      const response = await aiService.sendMessage([
        { role: 'user', content: namePrompt }
      ], {
        projectTitle: 'Chat Naming',
        projectDescription: 'Generate chat title',
        panelCount: 0,
        totalDuration: 0,
        allPanels: []
      })
      
      // Clean up the response and ensure it's concise
      const cleanName = response
        .replace(/['"]/g, '')
        .replace(/^(Title:|Chat:|Name:)/i, '')
        .trim()
        .substring(0, 50) // Max length limit
      
      return cleanName || this.generateFallbackName(messages, agent)
      
    } catch (error) {
      console.error('Failed to generate AI chat name:', error)
      return this.generateFallbackName(messages, agent)
    }
  }
  
  // Generate fallback name when AI naming fails
  private generateFallbackName(messages: ChatMessage[], agent: AIAgent): string {
    const userMessages = messages.filter(msg => msg.type === 'user')
    
    if (userMessages.length === 0) {
      return `New ${agent.name} Chat`
    }
    
    // Try to extract key topics from the first user message
    const firstMessage = userMessages[0].content.toLowerCase()
    
    // Common filmmaking keywords to look for
    const keywords = [
      'storyboard', 'scene', 'character', 'action', 'horror', 'comedy', 'romance',
      'animation', 'music', 'sound', 'lighting', 'camera', 'edit', 'color',
      'fantasy', 'sci-fi', 'western', 'documentary', 'corporate', 'food',
      'fashion', 'travel', 'nature', 'children', 'blockbuster', 'indie'
    ]
    
    const foundKeyword = keywords.find(keyword => firstMessage.includes(keyword))
    
    if (foundKeyword) {
      return `${foundKeyword.charAt(0).toUpperCase() + foundKeyword.slice(1)} Discussion`
    }
    
    // Fallback to agent specialty
    return `${agent.specialty} Chat`
  }
  
  // Get chat statistics
  getChatStats() {
    const chats = this.getAllChats()
    return {
      totalChats: chats.length,
      totalMessages: chats.reduce((sum, chat) => sum + chat.messageCount, 0),
      agentUsage: chats.reduce((usage, chat) => {
        usage[chat.agentName] = (usage[chat.agentName] || 0) + 1
        return usage
      }, {} as Record<string, number>),
      oldestChat: chats.length > 0 ? chats[chats.length - 1].createdAt : null,
      newestChat: chats.length > 0 ? chats[0].createdAt : null
    }
  }
}

export const chatManager = new ChatManagerService() 