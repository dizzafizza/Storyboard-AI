export interface StoryboardPanel {
  id: string
  title: string
  description: string
  imageUrl?: string
  videoUrl?: string
  videoPrompt?: string
  aiGeneratedPrompt?: string
  shotType: ShotType
  cameraAngle: CameraAngle
  notes: string
  duration: number // in seconds
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface StoryboardProject {
  id: string
  title: string
  description: string
  panels: StoryboardPanel[]
  directorNotes?: string // Overall director notes for video generation
  videoStyle?: VideoStyle // Preferred video style settings
  lastOpened?: Date // Track when project was last opened
  createdAt: Date
  updatedAt: Date
}

export interface VideoStyle {
  cinematicStyle?: string // e.g., "cinematic", "documentary", "animated"
  colorGrading?: string // e.g., "warm", "cool", "vintage", "high-contrast"
  lightingMood?: string // e.g., "dramatic", "soft", "natural", "moody"
  pacing?: string // e.g., "fast", "medium", "slow", "dynamic"
  specialEffects?: string[] // e.g., ["slow-motion", "time-lapse", "particles"]
}

export interface DragResult {
  draggableId: string
  type: string
  source: {
    droppableId: string
    index: number
  }
  destination?: {
    droppableId: string
    index: number
  } | null
}

export type ShotType = 
  | 'wide-shot'
  | 'medium-shot'
  | 'close-up'
  | 'extreme-close-up'
  | 'over-the-shoulder'
  | 'two-shot'
  | 'establishing-shot'

export type CameraAngle = 
  | 'high-angle'
  | 'low-angle'
  | 'eye-level'
  | 'birds-eye-view'
  | 'worms-eye-view'
  | 'dutch-angle'

export interface AIPrompt {
  id: string
  prompt: string
  response: string
  createdAt: Date
}

export interface AIGenerationRequest {
  prompt: string
  projectContext?: string
  existingPanels?: StoryboardPanel[]
}

export interface AIAgent {
  id: string
  name: string
  description: string
  specialty: string
  personality: 'friendly' | 'professional' | 'creative' | 'analytical' | 'enthusiastic' | 'calm' | 'witty' | 'inspiring'
  skills: string[]
  avatar: string
  prompt: string // System prompt that defines their behavior
  theme: {
    primary: string
    secondary: string
    accent: string
    gradient: string
  }
  examples: string[] // Example prompts they're good at handling
  capabilities?: string[] // Special capabilities like web_search, thinking, step_by_step, visual_analysis
  preferredModel?: string // Preferred AI model to use for this agent
}

export interface AgentCategory {
  id: string
  name: string
  description: string
  icon: string
  agents: AIAgent[]
}

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentId?: string
}

export interface SavedChat {
  id: string
  name: string
  messages: ChatMessage[]
  agentId: string
  agentName: string
  projectId?: string
  projectName?: string
  createdAt: Date
  updatedAt: Date
  lastActivity: Date
  messageCount: number
}

export interface ChatSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  error?: string
} 