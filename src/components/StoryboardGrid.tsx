import { Plus, Camera } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import StoryboardPanel from './StoryboardPanel'
import ContextualTips from './ContextualTips'

interface StoryboardGridProps {
  selectedPanel: string | null
  onSelectPanel: (panelId: string | null) => void
  onEditPanel: (panelId: string) => void
}

export default function StoryboardGrid({
  selectedPanel,
  onSelectPanel,
  onEditPanel
}: StoryboardGridProps) {
  const { state, dispatch } = useStoryboard()

  const handleAddPanel = () => {
    const newPanel = {
      id: `panel-${Date.now()}`,
      title: `Panel ${state.panels.length + 1}`,
      description: 'New panel description',
      shotType: 'medium-shot' as const,
      cameraAngle: 'eye-level' as const,
      duration: 4,
      order: state.panels.length,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    dispatch({
      type: 'ADD_PANEL',
      payload: newPanel,
    })
  }

  const handleMovePanel = (panelId: string, direction: 'up' | 'down') => {
    const currentIndex = state.panels.findIndex(p => p.id === panelId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= state.panels.length) return

    dispatch({
      type: 'REORDER_PANELS',
      payload: {
        fromIndex: currentIndex,
        toIndex: newIndex,
      },
    })
  }

  const handleDeletePanel = (panelId: string) => {
    if (confirm('Are you sure you want to delete this panel?')) {
      dispatch({
        type: 'DELETE_PANEL',
        payload: panelId,
      })
      
      if (selectedPanel === panelId) {
        onSelectPanel(null)
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-tertiary">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">
            Storyboard Grid
          </h2>
          <p className="text-secondary">
            {state.panels.length} panel{state.panels.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <button
          onClick={handleAddPanel}
          className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors flex items-center gap-2 group hover:scale-105 transform"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Add Panel
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6 relative">
        {/* Contextual Tips */}
        {state.panels.length === 0 && (
          <ContextualTips 
            context="empty" 
            className="absolute top-4 right-4 max-w-sm z-10"
          />
        )}
        
        {state.panels.length === 1 && (
          <ContextualTips 
            context="first-panel" 
            className="absolute top-4 right-4 max-w-sm z-10"
          />
        )}
        
        {state.panels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              No panels yet
            </h3>
            <p className="text-secondary mb-6 max-w-md">
              Start building your storyboard by adding your first panel. 
              Create scenes, add descriptions, and generate images.
            </p>
            <button
              onClick={handleAddPanel}
              className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/80 transition-all flex items-center gap-2 hover:scale-105 transform"
            >
              <Plus className="w-5 h-5" />
              Create First Panel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {state.panels.map((panel, index) => (
              <div
                key={panel.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <StoryboardPanel
                  panel={panel}
                  isSelected={selectedPanel === panel.id}
                  onSelect={() => onSelectPanel(panel.id)}
                  onEdit={() => onEditPanel(panel.id)}
                  onDelete={() => handleDeletePanel(panel.id)}
                  onMoveUp={() => handleMovePanel(panel.id, 'up')}
                  onMoveDown={() => handleMovePanel(panel.id, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < state.panels.length - 1}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 