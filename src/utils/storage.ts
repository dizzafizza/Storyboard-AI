import type { StoryboardProject } from '../types'

const STORAGE_KEYS = {
  PROJECTS: 'storyboard_projects',
  CURRENT_PROJECT: 'storyboard_current_project',
  SETTINGS: 'storyboard_settings',
  AI_CONVERSATIONS: 'storyboard_ai_conversations'
} as const

// IndexedDB configuration for storing large images
const DB_NAME = 'StoryboardAI'
const DB_VERSION = 1
const IMAGES_STORE = 'images'

interface StorageSettings {
  openaiApiKey?: string
  darkMode: boolean
  autoSave: boolean
  notifications?: boolean
  videoQuality?: 'standard' | 'high' | 'ultra'
  exportFormat?: 'json' | 'pdf' | 'video'
  aiModel?: 'gpt-4' | 'gpt-4o' | 'gpt-4o-mini'
  imageModel?: 'dall-e-2' | 'dall-e-3'
  maxTokens?: number
  temperature?: number
  language?: 'en' | 'es' | 'fr' | 'de' | 'ja'
  lastUsed: Date
}

interface ImageData {
  id: string
  data: string
  createdAt: Date
}

export class StoryboardStorage {
  private static instance: StoryboardStorage
  private db: IDBDatabase | null = null
  
  private constructor() {
    this.initDB()
  }
  
  static getInstance(): StoryboardStorage {
    if (!StoryboardStorage.instance) {
      StoryboardStorage.instance = new StoryboardStorage()
    }
    return StoryboardStorage.instance
  }

  // Initialize IndexedDB for image storage
  private async initDB(): Promise<void> {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
      }
      
      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB initialized successfully')
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(IMAGES_STORE)) {
          const imageStore = db.createObjectStore(IMAGES_STORE, { keyPath: 'id' })
          imageStore.createIndex('createdAt', 'createdAt', { unique: false })
          console.log('📦 IndexedDB object store created')
        }
      }
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
    }
  }

  // Image storage methods
  private async saveImageToDB(imageId: string, imageData: string): Promise<void> {
    const request = indexedDB.open('StoryboardAI', 1)
    
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' })
      }
    }
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['images'], 'readwrite')
        const store = transaction.objectStore('images')
        store.put({ id: imageId, data: imageData })
        
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  // Public method to retrieve images for export
  async getImageFromDB(imageId: string): Promise<string | null> {
    const request = indexedDB.open('StoryboardAI', 1)
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('images')) {
          resolve(null)
          return
        }
        
        const transaction = db.transaction(['images'], 'readonly')
        const store = transaction.objectStore('images')
        const getRequest = store.get(imageId)
        
        getRequest.onsuccess = () => {
          const result = getRequest.result
          resolve(result ? result.data : null)
        }
        
        getRequest.onerror = () => resolve(null)
      }
      
      request.onerror = () => resolve(null)
    })
  }

  private async deleteImageFromDB(imageId: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        // Fallback to localStorage
        try {
          localStorage.removeItem(`storyboard_image_${imageId}`)
        } catch (error) {
          console.warn('Failed to delete image from localStorage:', error)
        }
        resolve()
        return
      }

      const transaction = this.db.transaction([IMAGES_STORE], 'readwrite')
      const store = transaction.objectStore(IMAGES_STORE)
      const request = store.delete(imageId)
      
      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.warn('Failed to delete image from IndexedDB:', request.error)
        resolve()
      }
    })
  }

  // Enhanced project management with image separation
  async saveProject(project: StoryboardProject): Promise<void> {
    try {
      console.log('💾 Saving project with enhanced storage...')
      
      // Separate images from project data
      const projectCopy = JSON.parse(JSON.stringify(project))
      const imagePromises: Promise<void>[] = []
      
      // Process panels and extract images
      projectCopy.panels = await Promise.all(
        project.panels.map(async (panel) => {
          const panelCopy = { ...panel }
          
          // If panel has base64 image, store it separately
          if (panel.imageUrl && panel.imageUrl.startsWith('data:image/')) {
            const imageId = `panel_${panel.id}_${Date.now()}`
            imagePromises.push(this.saveImageToDB(imageId, panel.imageUrl))
            panelCopy.imageUrl = `stored:${imageId}` // Reference to stored image
            console.log(`📸 Storing large image separately: ${imageId}`)
          }
          
          return panelCopy
        })
      )
      
      // Wait for all images to be stored
      await Promise.all(imagePromises)
      
      // Now save the lightweight project data to localStorage
      const projects = await this.getAllProjects()
      const existingIndex = projects.findIndex(p => p.id === project.id)
      
      const updatedProject = {
        ...projectCopy,
        updatedAt: new Date()
      }
      
      if (existingIndex >= 0) {
        projects[existingIndex] = updatedProject
      } else {
        projects.push(updatedProject)
      }
      
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(updatedProject))
      
      console.log('✅ Project saved successfully with separated image storage')
    } catch (error) {
      console.error('Failed to save project:', error)
      throw new Error('Failed to save project to browser storage')
    }
  }

  async getCurrentProject(): Promise<StoryboardProject | null> {
    try {
      const projectData = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT)
      if (!projectData) return null
      
      const project = JSON.parse(projectData)
      
      // Restore images from IndexedDB
      const restoredProject = {
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        lastOpened: project.lastOpened ? new Date(project.lastOpened) : undefined,
        panels: await Promise.all(
          project.panels.map(async (panel: any) => {
            const restoredPanel = {
              ...panel,
              createdAt: new Date(panel.createdAt),
              updatedAt: new Date(panel.updatedAt)
            }
            
            // Restore image if it was stored separately
            if (panel.imageUrl && panel.imageUrl.startsWith('stored:')) {
              const imageId = panel.imageUrl.replace('stored:', '')
              const imageData = await this.getImageFromDB(imageId)
              if (imageData) {
                restoredPanel.imageUrl = imageData
                console.log(`📸 Restored image: ${imageId}`)
              } else {
                console.warn(`⚠️ Could not restore image: ${imageId}`)
                restoredPanel.imageUrl = null
              }
            }
            
            return restoredPanel
          })
        )
      }
      
      return restoredProject
    } catch (error) {
      console.error('Failed to load current project:', error)
      return null
    }
  }

  async getAllProjects(): Promise<StoryboardProject[]> {
    try {
      const projectsData = localStorage.getItem(STORAGE_KEYS.PROJECTS)
      if (!projectsData) return []
      
      const projects = JSON.parse(projectsData)
      
      // For the project list, we don't need to load images (performance optimization)
      return projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        lastOpened: project.lastOpened ? new Date(project.lastOpened) : undefined,
        panels: project.panels.map((panel: any) => ({
          ...panel,
          createdAt: new Date(panel.createdAt),
          updatedAt: new Date(panel.updatedAt),
          // Don't load images for project list - they'll be loaded when project is opened
          imageUrl: panel.imageUrl && panel.imageUrl.startsWith('stored:') ? null : panel.imageUrl
        }))
      }))
    } catch (error) {
      console.error('Failed to load projects:', error)
      return []
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const projects = await this.getAllProjects()
      const projectToDelete = projects.find(p => p.id === projectId)
      
      // Delete associated images
      if (projectToDelete) {
        const imageDeletePromises = projectToDelete.panels
          .filter(panel => panel.imageUrl && panel.imageUrl.startsWith('stored:'))
          .map(panel => {
            const imageId = panel.imageUrl!.replace('stored:', '')
            return this.deleteImageFromDB(imageId)
          })
        
        await Promise.all(imageDeletePromises)
        console.log('🗑️ Deleted associated images')
      }
      
      const filteredProjects = projects.filter(p => p.id !== projectId)
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filteredProjects))
      
      // If current project was deleted, clear it
      const currentProject = await this.getCurrentProject()
      if (currentProject && currentProject.id === projectId) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT)
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw new Error('Failed to delete project from browser storage')
    }
  }

  // Settings Management
  getSettings(): StorageSettings {
    try {
      const settingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (!settingsData) {
        return {
          darkMode: false,
          autoSave: true,
          lastUsed: new Date()
        }
      }
      
      const settings = JSON.parse(settingsData)
      return {
        ...settings,
        lastUsed: new Date(settings.lastUsed)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      return {
        darkMode: false,
        autoSave: true,
        lastUsed: new Date()
      }
    }
  }

  saveSettings(settings: Partial<StorageSettings>): void {
    try {
      const currentSettings = this.getSettings()
      const updatedSettings = {
        ...currentSettings,
        ...settings,
        lastUsed: new Date()
      }
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings))
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw new Error('Failed to save settings to browser storage')
    }
  }

  // AI Conversations
  saveConversation(conversationId: string, messages: any[]): void {
    try {
      const conversations = this.getConversations()
      conversations[conversationId] = {
        messages,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEYS.AI_CONVERSATIONS, JSON.stringify(conversations))
    } catch (error) {
      console.error('Failed to save conversation:', error)
    }
  }

  getConversations(): Record<string, any> {
    try {
      const conversationsData = localStorage.getItem(STORAGE_KEYS.AI_CONVERSATIONS)
      return conversationsData ? JSON.parse(conversationsData) : {}
    } catch (error) {
      console.error('Failed to load conversations:', error)
      return {}
    }
  }

  // Utility Methods
  async exportData(): Promise<string> {
    try {
      const projects = await this.getAllProjects()
      
      // Restore images for export
      const projectsWithImages = await Promise.all(
        projects.map(async (project) => ({
          ...project,
          panels: await Promise.all(
            project.panels.map(async (panel) => {
              if (panel.imageUrl && panel.imageUrl.startsWith('stored:')) {
                const imageId = panel.imageUrl.replace('stored:', '')
                const imageData = await this.getImageFromDB(imageId)
                return { ...panel, imageUrl: imageData }
              }
              return panel
            })
          )
        }))
      )
      
      const data = {
        projects: projectsWithImages,
        settings: this.getSettings(),
        conversations: this.getConversations(),
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('Failed to export data:', error)
      throw new Error('Failed to export data')
    }
  }

  async importData(jsonData: string): Promise<{ projects: number; settings: boolean; conversations: boolean }> {
    try {
      const data = JSON.parse(jsonData)
      let importedProjects = 0
      let importedSettings = false
      let importedConversations = false
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid import data structure')
      }
      
      // Import projects with validation
      if (data.projects && Array.isArray(data.projects)) {
        console.log(`📦 Importing ${data.projects.length} projects...`)
        
        for (const project of data.projects) {
          try {
            // Validate project structure
            if (!project.id || !project.title || !Array.isArray(project.panels)) {
              console.warn('⚠️ Skipping invalid project:', project.title || 'Unnamed')
              continue
            }
            
            // Ensure required fields and fix any issues
            const validatedProject = {
              ...project,
              id: project.id || `imported-${Date.now()}-${Math.random()}`,
              title: project.title || 'Imported Project',
              description: project.description || '',
              createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
              updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
              panels: project.panels.map((panel: any, index: number) => ({
                id: panel.id || `imported-panel-${Date.now()}-${index}`,
                title: panel.title || `Panel ${index + 1}`,
                description: panel.description || '',
                imageUrl: panel.imageUrl,
                videoUrl: panel.videoUrl,
                videoPrompt: panel.videoPrompt || panel.aiGeneratedPrompt,
                aiGeneratedPrompt: panel.aiGeneratedPrompt || panel.videoPrompt,
                shotType: panel.shotType || 'medium-shot',
                cameraAngle: panel.cameraAngle || 'eye-level',
                notes: panel.notes || '',
                duration: typeof panel.duration === 'number' ? panel.duration : 3,
                order: index,
                createdAt: panel.createdAt ? new Date(panel.createdAt) : new Date(),
                updatedAt: panel.updatedAt ? new Date(panel.updatedAt) : new Date()
              }))
            }
            
            await this.saveProject(validatedProject)
            importedProjects++
            console.log(`✅ Imported project: ${validatedProject.title}`)
            
          } catch (projectError) {
            console.error(`❌ Failed to import project ${project.title || 'Unknown'}:`, projectError)
            // Continue with other projects
          }
        }
      }
      
      // Import single project (direct project format)
      else if (data.project) {
        console.log('📦 Importing single project...')
        try {
          const project = data.project
          if (project.id && project.title && Array.isArray(project.panels)) {
            await this.saveProject(project)
            importedProjects = 1
            console.log(`✅ Imported project: ${project.title}`)
          } else {
            throw new Error('Invalid project structure in import data')
          }
        } catch (projectError) {
          console.error('❌ Failed to import project:', projectError)
        }
      }
      
      // Import direct project format
      else if (data.id && data.title && Array.isArray(data.panels)) {
        console.log('📦 Importing direct project format...')
        try {
          await this.saveProject(data)
          importedProjects = 1
          console.log(`✅ Imported project: ${data.title}`)
        } catch (projectError) {
          console.error('❌ Failed to import project:', projectError)
        }
      }
      
      // Import settings
      if (data.settings && typeof data.settings === 'object') {
        try {
          // Validate and clean settings
          const validatedSettings = {
            ...data.settings,
            lastUsed: new Date()
          }
          
          // Remove sensitive data if present
          delete validatedSettings.openaiApiKey
          
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(validatedSettings))
          importedSettings = true
          console.log('✅ Imported settings')
        } catch (settingsError) {
          console.error('❌ Failed to import settings:', settingsError)
        }
      }
      
      // Import conversations
      if (data.conversations && typeof data.conversations === 'object') {
        try {
          localStorage.setItem(STORAGE_KEYS.AI_CONVERSATIONS, JSON.stringify(data.conversations))
          importedConversations = true
          console.log('✅ Imported AI conversations')
        } catch (conversationsError) {
          console.error('❌ Failed to import conversations:', conversationsError)
        }
      }
      
      console.log(`📈 Import summary: ${importedProjects} projects, settings: ${importedSettings}, conversations: ${importedConversations}`)
      
      return {
        projects: importedProjects,
        settings: importedSettings,
        conversations: importedConversations
      }
      
    } catch (error) {
      console.error('Failed to import data:', error)
      
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format - please check your import file')
      } else if (error instanceof Error) {
        throw new Error(`Import failed: ${error.message}`)
      } else {
        throw new Error('Failed to import data - unknown error')
      }
    }
  }

  clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear IndexedDB
      if (this.db) {
        const transaction = this.db.transaction([IMAGES_STORE], 'readwrite')
        const store = transaction.objectStore(IMAGES_STORE)
        store.clear()
      }
    } catch (error) {
      console.error('Failed to clear data:', error)
      throw new Error('Failed to clear browser storage')
    }
  }

  async getStorageUsage(): Promise<{ used: number; available: number; percentage: number; breakdown: any }> {
    try {
      let localStorageSize = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage[key].length + key.length
        }
      }
      
      // Estimate IndexedDB usage
      let indexedDBSize = 0
      if (this.db) {
        // This is an approximation - IndexedDB doesn't provide direct size info
        indexedDBSize = await this.estimateIndexedDBSize()
      }
      
      const totalSize = localStorageSize + indexedDBSize
      const estimatedLimit = 50 * 1024 * 1024 // 50MB combined estimate
      const percentage = (totalSize / estimatedLimit) * 100
      
      return {
        used: totalSize,
        available: estimatedLimit - totalSize,
        percentage: Math.min(percentage, 100),
        breakdown: {
          localStorage: localStorageSize,
          indexedDB: indexedDBSize
        }
      }
    } catch (error) {
      console.error('Failed to calculate storage usage:', error)
      return { used: 0, available: 0, percentage: 0, breakdown: {} }
    }
  }

  private async estimateIndexedDBSize(): Promise<number> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(0)
        return
      }

      try {
        const transaction = this.db.transaction([IMAGES_STORE], 'readonly')
        const store = transaction.objectStore(IMAGES_STORE)
        const request = store.getAll()
        
        request.onsuccess = () => {
          const images = request.result as ImageData[]
          const totalSize = images.reduce((sum, img) => sum + img.data.length, 0)
          resolve(totalSize)
        }
        
        request.onerror = () => resolve(0)
      } catch (error) {
        resolve(0)
      }
    })
  }
}

// Export singleton instance
export const storage = StoryboardStorage.getInstance() 