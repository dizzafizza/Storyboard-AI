import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import type { StoryboardPanel, StoryboardProject } from '../types'
import { storage } from '../utils/storage'

interface StoryboardState {
  currentProject: StoryboardProject | null
  panels: StoryboardPanel[]
  selectedPanel: string | null
  isLoading: boolean
  error: string | null
}

type StoryboardAction = 
  | { type: 'SET_PROJECT'; payload: StoryboardProject }
  | { type: 'ADD_PANEL'; payload: StoryboardPanel }
  | { type: 'UPDATE_PANEL'; payload: { id: string; updates: Partial<StoryboardPanel> } }
  | { type: 'DELETE_PANEL'; payload: string }
  | { type: 'REORDER_PANELS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SELECT_PANEL'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PANELS'; payload: StoryboardPanel[] }

// Sample data for demonstration
const samplePanels: StoryboardPanel[] = [
  {
    id: '1',
    title: 'Opening Shot',
    description: 'Wide establishing shot of the cityscape at dawn',
    shotType: 'wide-shot',
    cameraAngle: 'high-angle',
    notes: 'Golden hour lighting, peaceful atmosphere',
    duration: 5,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Character Introduction',
    description: 'Close-up of protagonist waking up',
    shotType: 'close-up',
    cameraAngle: 'eye-level',
    notes: 'Focus on facial expression, natural lighting',
    duration: 3,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Daily Routine',
    description: 'Medium shot of character preparing coffee',
    shotType: 'medium-shot',
    cameraAngle: 'eye-level',
    notes: 'Show character\'s morning routine, warm tones',
    duration: 4,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const getInitialState = (): StoryboardState => {
  // Start with loading state since we need to load async
  return {
    currentProject: null,
    panels: [],
    selectedPanel: null,
    isLoading: true,
    error: null,
  }
}

function storyboardReducer(state: StoryboardState, action: StoryboardAction): StoryboardState {
  let newState: StoryboardState
  
  switch (action.type) {
    case 'SET_PROJECT':
      newState = {
        ...state,
        currentProject: action.payload,
        panels: action.payload.panels,
      }
      // Save to storage (async)
      storage.saveProject(action.payload).catch(console.error)
      return newState
      
    case 'ADD_PANEL':
      const updatedPanelsAdd = [...state.panels, action.payload]
      newState = {
        ...state,
        panels: updatedPanelsAdd,
      }
      // Update project in storage
      if (state.currentProject) {
        const updatedProject = {
          ...state.currentProject,
          panels: updatedPanelsAdd,
          updatedAt: new Date()
        }
        storage.saveProject(updatedProject).catch(console.error)
        newState.currentProject = updatedProject
      }
      return newState
      
    case 'UPDATE_PANEL':
      const updatedPanelsEdit = state.panels.map(panel => 
        panel.id === action.payload.id 
          ? { ...panel, ...action.payload.updates, updatedAt: new Date() }
          : panel
      )
      newState = {
        ...state,
        panels: updatedPanelsEdit,
      }
      // Update project in storage
      if (state.currentProject) {
        const updatedProject = {
          ...state.currentProject,
          panels: updatedPanelsEdit,
          updatedAt: new Date()
        }
        storage.saveProject(updatedProject).catch(console.error)
        newState.currentProject = updatedProject
      }
      return newState
      
    case 'DELETE_PANEL':
      const updatedPanelsDelete = state.panels.filter(panel => panel.id !== action.payload)
      newState = {
        ...state,
        panels: updatedPanelsDelete,
        selectedPanel: state.selectedPanel === action.payload ? null : state.selectedPanel,
      }
      // Update project in storage
      if (state.currentProject) {
        const updatedProject = {
          ...state.currentProject,
          panels: updatedPanelsDelete,
          updatedAt: new Date()
        }
        storage.saveProject(updatedProject).catch(console.error)
        newState.currentProject = updatedProject
      }
      return newState
      
    case 'REORDER_PANELS':
      console.log('🔄 Processing REORDER_PANELS action:', action.payload)
      console.log('📋 Original panels:', state.panels.map(p => ({ id: p.id, order: p.order })))
      
      const newPanels = [...state.panels]
      const [movedPanel] = newPanels.splice(action.payload.fromIndex, 1)
      newPanels.splice(action.payload.toIndex, 0, movedPanel)
      const reorderedPanels = newPanels.map((panel, index) => ({ ...panel, order: index }))
      
      console.log('📋 Reordered panels:', reorderedPanels.map(p => ({ id: p.id, order: p.order })))
      
      newState = {
        ...state,
        panels: reorderedPanels,
      }
      // Update project in storage
      if (state.currentProject) {
        const updatedProject = {
          ...state.currentProject,
          panels: reorderedPanels,
          updatedAt: new Date()
        }
        storage.saveProject(updatedProject).catch(console.error)
        newState.currentProject = updatedProject
      }
      return newState
      
    case 'SELECT_PANEL':
      return {
        ...state,
        selectedPanel: action.payload,
      }
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }
      
    case 'SET_PANELS':
      const updatedPanelsSet = action.payload
      newState = {
        ...state,
        panels: updatedPanelsSet,
      }
      // Update project in storage
      if (state.currentProject) {
        const updatedProject = {
          ...state.currentProject,
          panels: updatedPanelsSet,
          updatedAt: new Date()
        }
        storage.saveProject(updatedProject).catch(console.error)
        newState.currentProject = updatedProject
      }
      return newState
      
    default:
      return state
  }
}

const StoryboardContext = createContext<{
  state: StoryboardState
  dispatch: React.Dispatch<StoryboardAction>
} | null>(null)

export function StoryboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storyboardReducer, getInitialState())

  // Initialize from storage
  useEffect(() => {
    const initializeFromStorage = async () => {
      try {
        // Try to load from storage first
        const savedProject = await storage.getCurrentProject()
        
        if (savedProject) {
          dispatch({ type: 'SET_PROJECT', payload: savedProject })
          dispatch({ type: 'SET_LOADING', payload: false })
        } else {
          // Fallback to sample data
          const sampleProject = {
            id: 'sample-project',
            title: 'My First Storyboard',
            description: 'A sample storyboard project to get you started',
            panels: samplePanels,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          
          // Save the sample project to storage
          await storage.saveProject(sampleProject)
          dispatch({ type: 'SET_PROJECT', payload: sampleProject })
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Failed to initialize from storage:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load project data' })
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initializeFromStorage()
  }, [])

  // Auto-save functionality
  useEffect(() => {
    const settings = storage.getSettings()
    if (settings.autoSave && state.currentProject) {
      const timeoutId = setTimeout(() => {
        storage.saveProject(state.currentProject!).catch(console.error)
      }, 1000) // Auto-save after 1 second of inactivity
      
      return () => clearTimeout(timeoutId)
    }
  }, [state.panels, state.currentProject])

  return (
    <StoryboardContext.Provider value={{ state, dispatch }}>
      {children}
    </StoryboardContext.Provider>
  )
}

export function useStoryboard() {
  const context = useContext(StoryboardContext)
  if (!context) {
    throw new Error('useStoryboard must be used within a StoryboardProvider')
  }
  return context
} 