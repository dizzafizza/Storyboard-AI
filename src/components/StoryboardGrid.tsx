import { Plus, Camera, Square, CheckSquare, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import StoryboardPanel from './StoryboardPanel'
import ContextualTips from './ContextualTips'
import { useState, useEffect, useRef } from 'react'

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
  const { state: themeState } = useTheme()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; panelId: string } | null>(null)
  const [draggedPanel, setDraggedPanel] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [showMobileActions, setShowMobileActions] = useState<string | null>(null)

  // Detect mobile device - improved detection
  useEffect(() => {
    const checkMobile = () => {
      // More reliable mobile detection - only treat as mobile if narrow screen AND actually mobile device
      const isMobileDevice = window.innerWidth <= 768 && (
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      )
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-focus grid for keyboard navigation
  useEffect(() => {
    if (gridRef.current && !isMobile) {
      gridRef.current.focus()
    }
  }, [state.panels.length, isMobile])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when grid is focused or when no other input is focused
      const activeElement = document.activeElement
      const isInputFocused = activeElement?.tagName === 'INPUT' || 
                           activeElement?.tagName === 'TEXTAREA' || 
                           (activeElement as HTMLElement)?.isContentEditable

      if (isInputFocused || isMobile) return

      // Auto-focus grid if no element is focused
      if (!gridRef.current?.contains(activeElement)) {
        gridRef.current?.focus()
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault()
          handleArrowNavigation(e.key)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedPanel) {
            onEditPanel(selectedPanel)
          }
          break
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          if (selectedPanel) {
            handleDeletePanel(selectedPanel)
          }
          break
        case 'Escape':
          e.preventDefault()
          onSelectPanel(null)
          setContextMenu(null)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedPanel, state.panels, isMobile])

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  // Hide mobile actions when tapping elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMobileActions && gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setShowMobileActions(null)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMobileActions])

  const handleArrowNavigation = (key: string) => {
    const currentIndex = selectedPanel ? state.panels.findIndex(p => p.id === selectedPanel) : 0
    let newIndex = currentIndex

    // Calculate grid dimensions for arrow navigation
    const gridElement = gridRef.current?.querySelector('.storyboard-grid-container')
    if (!gridElement) return
    
    const style = window.getComputedStyle(gridElement)
    const gap = parseFloat(style.gap) || 16
    const containerWidth = gridElement.clientWidth
    const itemMinWidth = 280 // From CSS
    const columnsPerRow = Math.floor((containerWidth + gap) / (itemMinWidth + gap))

    switch (key) {
      case 'ArrowUp':
        newIndex = Math.max(0, currentIndex - columnsPerRow)
        break
      case 'ArrowDown':
        newIndex = Math.min(state.panels.length - 1, currentIndex + columnsPerRow)
        break
      case 'ArrowLeft':
        newIndex = Math.max(0, currentIndex - 1)
        break
      case 'ArrowRight':
        newIndex = Math.min(state.panels.length - 1, currentIndex + 1)
        break
    }

    if (newIndex !== currentIndex && state.panels[newIndex]) {
      const newPanelId = state.panels[newIndex].id
      onSelectPanel(newPanelId)
    }
  }

  const handlePanelClick = (panelId: string) => {
    // Simple single selection
    onSelectPanel(panelId)
    
    // Double-click to edit (or single click if already selected)
    if (selectedPanel === panelId) {
      onEditPanel(panelId)
    }
  }

  const handleMobilePanelClick = (panelId: string) => {
    if (selectedPanel === panelId) {
      // If already selected, show context menu
      setShowMobileActions(panelId)
    } else {
      // If not selected, select it
      onSelectPanel(panelId)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, panelId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Select the panel if not already selected
    if (selectedPanel !== panelId) {
      onSelectPanel(panelId)
    }
    
    setContextMenu({ x: e.clientX, y: e.clientY, panelId })
  }

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

    // Auto-select the new panel
    onSelectPanel(newPanel.id)
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
    if (confirm(`Are you sure you want to delete this panel?`)) {
      dispatch({ type: 'DELETE_PANEL', payload: panelId })
      if (selectedPanel === panelId) {
        onSelectPanel(null)
      }
    }
  }

  const handleDuplicatePanel = (panelId: string) => {
    const panel = state.panels.find(p => p.id === panelId)
    if (!panel) return

    const duplicatedPanel = {
      ...panel,
      id: `panel-${Date.now()}-${Math.random()}`,
      title: `${panel.title} (Copy)`,
      order: state.panels.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    dispatch({
      type: 'ADD_PANEL',
      payload: duplicatedPanel,
    })
    
    onSelectPanel(duplicatedPanel.id)
  }

  const handleDragStart = (e: React.DragEvent, panelId: string) => {
    setDraggedPanel(panelId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', panelId)
    
    // Select the panel being dragged
    if (selectedPanel !== panelId) {
      onSelectPanel(panelId)
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (!draggedPanel) return
    
    const dragIndex = state.panels.findIndex(p => p.id === draggedPanel)
    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggedPanel(null)
      setDragOverIndex(null)
      return
    }

    dispatch({
      type: 'REORDER_PANELS',
      payload: {
        fromIndex: dragIndex,
        toIndex: dropIndex,
      },
    })

    setDraggedPanel(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedPanel(null)
    setDragOverIndex(null)
  }

  const handleTouchStart = (e: React.TouchEvent, panelId: string) => {
    if (isMobile) {
      const touch = e.touches[0]
      setTouchStartPos({ x: touch.clientX, y: touch.clientY })
      
      // Start long press timer for context menu
      const timer = setTimeout(() => {
        setContextMenu({ 
          x: touch.clientX, 
          y: touch.clientY, 
          panelId 
        })
        
        // Vibrate if available (mobile feedback)
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }, 500) // 500ms long press
      
      setLongPressTimer(timer)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer && touchStartPos) {
      const touch = e.touches[0]
      const distance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.x, 2) + 
        Math.pow(touch.clientY - touchStartPos.y, 2)
      )
      
      // Cancel long press if finger moved too much
      if (distance > 10) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setTouchStartPos(null)
  }

  const getButtonStyles = (type: 'primary' | 'secondary' | 'success' | 'danger' | 'warning') => {
    const baseStyles = "rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation"
    
    const colors = {
      primary: {
        backgroundColor: themeState.theme.colors.primary[500],
        color: '#ffffff'
      },
      secondary: {
        backgroundColor: themeState.theme.colors.background.secondary,
        color: themeState.theme.colors.text.secondary,
        border: `1px solid ${themeState.theme.colors.border.primary}`
      },
      success: {
        backgroundColor: '#10b981',
        color: '#ffffff'
      },
      danger: {
        backgroundColor: '#ef4444',
        color: '#ffffff'
      },
      warning: {
        backgroundColor: '#f59e0b',
        color: '#ffffff'
      }
    }

    return {
      className: baseStyles,
      style: colors[type]
    }
  }

  return (
    <div className="h-full flex flex-col bg-secondary" ref={gridRef} tabIndex={0}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-tertiary">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-1 truncate">
            Storyboard Grid
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-secondary">
            {state.panels.length} panel{state.panels.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddPanel}
            className={`${isMobile ? 'px-4 py-3 ml-2' : 'px-3 py-2 sm:px-4 sm:py-2 md:px-4 md:py-2 ml-2'} rounded-lg transition-all duration-200 flex items-center gap-2 text-sm md:text-base font-medium shadow-sm hover:shadow-md hover:scale-105 touch-manipulation`}
            style={{
              backgroundColor: themeState.theme.colors.primary[500],
              color: '#ffffff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[600]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[500]
            }}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className={`${isMobile ? '' : 'hidden xs:inline'}`}>Add Panel</span>
            {!isMobile && <span className="xs:hidden">Add</span>}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div 
        ref={gridRef}
        className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 relative"
        tabIndex={0}
        role="grid"
        aria-label="Storyboard panels grid"
        style={{ outline: 'none' }}
      >
        {/* Contextual Tips */}
        {state.panels.length === 0 && (
          <ContextualTips 
            context="empty" 
            className="absolute top-4 right-4 max-w-sm z-10 hidden sm:block"
          />
        )}
        
        {state.panels.length === 1 && (
          <ContextualTips 
            context="first-panel" 
            className="absolute top-4 right-4 max-w-sm z-10 hidden sm:block"
          />
        )}
        
        {state.panels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-tertiary rounded-full flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
              No panels yet
            </h3>
            <p className="text-secondary mb-6 max-w-md text-sm sm:text-base px-4">
              Start building your storyboard by adding your first panel. 
              Create scenes, add descriptions, and generate images.
            </p>
            <button
              onClick={handleAddPanel}
              className="px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 transform font-medium shadow-md hover:shadow-lg touch-manipulation"
              style={{
                backgroundColor: themeState.theme.colors.primary[500],
                color: '#ffffff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[600]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[500]
              }}
            >
              <Plus className="w-5 h-5" />
              Create First Panel
            </button>
          </div>
        ) : (
          <div className="storyboard-grid-container">
            {state.panels.map((panel, index) => (
              <div
                key={panel.id}
                className={`storyboard-grid-item animate-fadeIn ${
                  draggedPanel === panel.id ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index ? 'ring-2 ring-blue-400 ring-opacity-60' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onContextMenu={(e) => handleContextMenu(e, panel.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                <StoryboardPanel
                  panel={panel}
                  isSelected={selectedPanel === panel.id}
                  onSelect={() => {
                    if (isMobile) {
                      handleMobilePanelClick(panel.id)
                    } else {
                      handlePanelClick(panel.id)
                    }
                  }}
                  onEdit={() => onEditPanel(panel.id)}
                  onDelete={() => handleDeletePanel(panel.id)}
                  onMoveUp={() => handleMovePanel(panel.id, 'up')}
                  onMoveDown={() => handleMovePanel(panel.id, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < state.panels.length - 1}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, panel.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  isMobile={isMobile}
                  showActions={isMobile ? showMobileActions === panel.id || selectedPanel === panel.id : undefined}
                />
              </div>
            ))}
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed context-menu rounded-lg py-2 z-50 min-w-48"
            style={{ 
              left: contextMenu.x, 
              top: contextMenu.y,
              backgroundColor: themeState.theme.colors.background.primary,
              border: `1px solid ${themeState.theme.colors.border.primary}`,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onEditPanel(contextMenu.panelId)
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left context-menu-item flex items-center gap-2 hover:bg-opacity-10"
              style={{ 
                color: themeState.theme.colors.text.primary,
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${themeState.theme.colors.primary[500]}20`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div 
                className="w-4 h-4 rounded flex items-center justify-center"
                style={{ backgroundColor: '#10b981' }}
              >
                <span className="text-xs" style={{ color: '#ffffff' }}>✏️</span>
              </div>
              Edit Panel
            </button>
            
            <button
              onClick={() => {
                handleDuplicatePanel(contextMenu.panelId)
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left context-menu-item flex items-center gap-2"
              style={{ 
                color: themeState.theme.colors.text.primary,
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${themeState.theme.colors.primary[500]}20`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Copy className="w-4 h-4" style={{ color: themeState.theme.colors.primary[500] }} />
              Duplicate Panel
            </button>

            <button
              onClick={() => {
                handleMovePanel(contextMenu.panelId, 'up')
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left context-menu-item flex items-center gap-2"
              disabled={state.panels.findIndex(p => p.id === contextMenu.panelId) === 0}
              style={{ 
                color: themeState.theme.colors.text.primary,
                transition: 'background-color 0.15s ease',
                opacity: state.panels.findIndex(p => p.id === contextMenu.panelId) === 0 ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = `${themeState.theme.colors.primary[500]}20`
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ArrowUp className="w-4 h-4" style={{ color: themeState.theme.colors.primary[500] }} />
              Move Up
            </button>
            
            <button
              onClick={() => {
                handleMovePanel(contextMenu.panelId, 'down')
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left context-menu-item flex items-center gap-2"
              disabled={state.panels.findIndex(p => p.id === contextMenu.panelId) === state.panels.length - 1}
              style={{ 
                color: themeState.theme.colors.text.primary,
                transition: 'background-color 0.15s ease',
                opacity: state.panels.findIndex(p => p.id === contextMenu.panelId) === state.panels.length - 1 ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = `${themeState.theme.colors.primary[500]}20`
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ArrowDown className="w-4 h-4" style={{ color: themeState.theme.colors.primary[500] }} />
              Move Down
            </button>

            <hr style={{ 
              margin: '4px 0',
              border: 'none',
              height: '1px',
              backgroundColor: themeState.theme.colors.border.primary
            }} />
            <button
              onClick={() => {
                handleDeletePanel(contextMenu.panelId)
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left context-menu-item flex items-center gap-2"
              style={{ 
                color: '#ef4444',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ef444420'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
              Delete Panel
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 