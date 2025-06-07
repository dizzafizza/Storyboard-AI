import { useState, useRef, useEffect, ReactNode } from 'react'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface WindowFrameProps {
  isOpen: boolean
  onClose: () => void
  onMinimize?: () => void
  title: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  defaultWidth?: string
  defaultHeight?: string
  minWidth?: number
  minHeight?: number
  maxWidth?: string
  maxHeight?: string
  resizable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  windowId?: string
  zIndex?: number
}

interface WindowState {
  isMaximized: boolean
  isMinimized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  isDragging: boolean
  isResizing: boolean
  resizeDirection?: string
  dragOffset?: { x: number; y: number }
  previousState?: { position: { x: number; y: number }; size: { width: number; height: number } }
  minimizedPosition?: { x: number; y: number }
}

// Global state for managing minimized windows
class MinimizedWindowManager {
  private static instance: MinimizedWindowManager
  private minimizedWindows: Map<string, { position: { x: number; y: number }, title: string, icon?: ReactNode }> = new Map()
  private listeners: Set<() => void> = new Set()

  static getInstance(): MinimizedWindowManager {
    if (!MinimizedWindowManager.instance) {
      MinimizedWindowManager.instance = new MinimizedWindowManager()
    }
    return MinimizedWindowManager.instance
  }

  addMinimizedWindow(id: string, title: string, icon?: ReactNode) {
    const position = this.getNextMinimizedPosition()
    this.minimizedWindows.set(id, { position, title, icon })
    this.notifyListeners()
  }

  removeMinimizedWindow(id: string) {
    this.minimizedWindows.delete(id)
    this.notifyListeners()
  }

  updateMinimizedPosition(id: string, position: { x: number; y: number }) {
    const window = this.minimizedWindows.get(id)
    if (window) {
      window.position = position
      this.notifyListeners()
    }
  }

  getMinimizedWindow(id: string) {
    return this.minimizedWindows.get(id)
  }

  getAllMinimizedWindows() {
    return Array.from(this.minimizedWindows.entries())
  }

  addListener(listener: () => void) {
    this.listeners.add(listener)
  }

  removeListener(listener: () => void) {
    this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  private getNextMinimizedPosition(): { x: number; y: number } {
    const existingPositions = Array.from(this.minimizedWindows.values()).map(w => w.position)
    const bubbleSize = 60
    const margin = 10
    const startX = 20
    const startY = window.innerHeight - bubbleSize - 20

    // Stack horizontally from left
    for (let i = 0; i < 20; i++) {
      const x = startX + i * (bubbleSize + margin)
      const y = startY

      // Check if position is available and within viewport
      if (x + bubbleSize < window.innerWidth - 20) {
        const isOccupied = existingPositions.some(pos => 
          Math.abs(pos.x - x) < bubbleSize && Math.abs(pos.y - y) < bubbleSize
        )
        if (!isOccupied) {
          return { x, y }
        }
      }
    }

    // If no horizontal space, stack vertically
    for (let row = 1; row < 5; row++) {
      for (let col = 0; col < 10; col++) {
        const x = startX + col * (bubbleSize + margin)
        const y = startY - row * (bubbleSize + margin)

        if (x + bubbleSize < window.innerWidth - 20 && y > 60) {
          const isOccupied = existingPositions.some(pos => 
            Math.abs(pos.x - x) < bubbleSize && Math.abs(pos.y - y) < bubbleSize
          )
          if (!isOccupied) {
            return { x, y }
          }
        }
      }
    }

    // Fallback position
    return { x: startX, y: startY }
  }
}

// Minimized Window Bubble Component
function MinimizedWindowBubble({ 
  windowId, 
  title, 
  icon, 
  position, 
  onRestore, 
  onClose,
  themeState 
}: {
  windowId: string
  title: string
  icon?: ReactNode
  position: { x: number; y: number }
  onRestore: () => void
  onClose: () => void
  themeState: any
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentPosition, setCurrentPosition] = useState(position)
  const bubbleRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    e.preventDefault()
    setIsDragging(true)
    const rect = bubbleRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Constrain to viewport
      const bubbleSize = 60
      const constrainedX = Math.max(10, Math.min(window.innerWidth - bubbleSize - 10, newX))
      const constrainedY = Math.max(10, Math.min(window.innerHeight - bubbleSize - 10, newY))
      
      setCurrentPosition({ x: constrainedX, y: constrainedY })
      MinimizedWindowManager.getInstance().updateMinimizedPosition(windowId, { x: constrainedX, y: constrainedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
    }
  }, [isDragging, dragOffset, windowId])

  return (
    <div
      ref={bubbleRef}
      className={`fixed w-15 h-15 rounded-xl shadow-lg cursor-move transition-all duration-300 transform hover:scale-110 ${
        isDragging ? 'z-[10001] scale-110 shadow-2xl' : 'z-[9000]'
      }`}
      style={{
        left: currentPosition.x,
        top: currentPosition.y,
        background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`,
        backdropFilter: 'blur(20px)',
        border: `2px solid ${themeState.theme.colors.border.primary}`,
        boxShadow: isDragging 
          ? `0 20px 40px rgba(0,0,0,0.3), 0 0 0 4px ${themeState.theme.colors.primary[500]}40`
          : `0 8px 20px rgba(0,0,0,0.15), 0 0 0 1px ${themeState.theme.colors.primary[500]}20`
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={onRestore}
      title={`${title} (Double-click to restore)`}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {icon ? (
          <div className="text-white text-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
            {icon}
          </div>
        ) : (
          <div 
            className="text-white text-sm font-bold text-center leading-tight"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          >
            {title.substring(0, 2).toUpperCase()}
          </div>
        )}
        
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 transform hover:scale-110 shadow-lg"
          title="Close window"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Pulsing indicator */}
        <div 
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: themeState.theme.colors.secondary[400] }}
        />
      </div>
    </div>
  )
}

export default function WindowFrame({
  isOpen,
  onClose,
  onMinimize,
  title,
  subtitle,
  icon,
  children,
  className = '',
  defaultWidth = '600px',
  defaultHeight = '450px',
  minWidth = 320,
  minHeight = 240,
  maxWidth = '85vw',
  maxHeight = '85vh',
  resizable = true,
  minimizable = true,
  maximizable = true,
  windowId = Math.random().toString(36).substr(2, 9),
  zIndex = 9000
}: WindowFrameProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const { state: themeState } = useTheme()
  const [isMobile, setIsMobile] = useState(false)
  const [minimizedWindows, setMinimizedWindows] = useState<Array<[string, any]>>([])
  
  const [windowState, setWindowState] = useState<WindowState>({
    isMaximized: false,
    isMinimized: false,
    position: { x: 0, y: 0 },
    size: { 
      width: parseInt(defaultWidth.replace('px', '')), 
      height: parseInt(defaultHeight.replace('px', ''))
    },
    isDragging: false,
    isResizing: false,
    resizeDirection: undefined,
    dragOffset: { x: 0, y: 0 },
    previousState: undefined
  })

  // Listen to minimized windows changes
  useEffect(() => {
    const manager = MinimizedWindowManager.getInstance()
    const updateMinimizedWindows = () => {
      setMinimizedWindows(manager.getAllMinimizedWindows())
    }
    
    manager.addListener(updateMinimizedWindows)
    updateMinimizedWindows()
    
    return () => {
      manager.removeListener(updateMinimizedWindows)
    }
  }, [])

  // Detect mobile/small screens with better responsiveness
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-adjust window size for mobile
      if (mobile && !windowState.isMinimized) {
        setWindowState(prev => ({
          ...prev,
          size: {
            width: Math.min(window.innerWidth - 20, prev.size.width),
            height: Math.min(window.innerHeight - 60, prev.size.height)
          }
        }))
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [windowState.isMinimized])

  // Enhanced centering with better positioning logic
  useEffect(() => {
    if (isOpen && !windowState.isMaximized && !windowState.previousState && !windowState.isMinimized) {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const windowWidth = windowState.size.width
      const windowHeight = windowState.size.height
      
      // Smart positioning - cascade windows that are too close
      const existingWindows = document.querySelectorAll('.window-frame')
      let offsetX = 0
      let offsetY = 0
      
      if (existingWindows.length > 1) {
        offsetX = (existingWindows.length - 1) * 30
        offsetY = (existingWindows.length - 1) * 30
      }
      
      const centerX = Math.max(20, Math.min(
        (viewportWidth - windowWidth) / 2 + offsetX,
        viewportWidth - windowWidth - 20
      ))
      const centerY = Math.max(40, Math.min(
        (viewportHeight - windowHeight) / 2 + offsetY,
        viewportHeight - windowHeight - 20
      ))
      
      setWindowState(prev => ({
        ...prev,
        position: { x: centerX, y: centerY }
      }))
    }
  }, [isOpen, windowState.isMaximized, windowState.previousState, windowState.isMinimized])

  // Enhanced drag functionality with improved constraints
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (windowState.isDragging && !windowState.isMaximized && !isMobile && windowState.dragOffset) {
        e.preventDefault()
        
        const newX = e.clientX - windowState.dragOffset.x
        const newY = e.clientY - windowState.dragOffset.y

        // Enhanced viewport constraints with smart snapping
        const snapThreshold = 20
        const windowWidth = windowState.size.width
        const windowHeight = windowState.size.height
        
        let constrainedX = Math.max(-windowWidth / 2, Math.min(window.innerWidth - windowWidth / 2, newX))
        let constrainedY = Math.max(0, Math.min(window.innerHeight - windowHeight, newY))
        
        // Snap to edges
        if (constrainedX < snapThreshold) constrainedX = 0
        if (constrainedX > window.innerWidth - windowWidth - snapThreshold) constrainedX = window.innerWidth - windowWidth
        if (constrainedY < snapThreshold) constrainedY = 0

        setWindowState(prev => ({
          ...prev,
          position: { x: constrainedX, y: constrainedY }
        }))
      }
      
      // Enhanced resizing with better constraints and live content scaling
      if (windowState.isResizing && windowState.resizeDirection && !windowState.isMaximized) {
        e.preventDefault()
        const rect = windowRef.current?.getBoundingClientRect()
        if (!rect) return

        let newWidth = windowState.size.width
        let newHeight = windowState.size.height
        let newX = windowState.position.x
        let newY = windowState.position.y

        const direction = windowState.resizeDirection
        const minW = Math.max(minWidth, 280)
        const minH = Math.max(minHeight, 200)
        const maxW = Math.min(window.innerWidth * 0.98, parseInt(maxWidth?.replace('vw', '') || '100') * window.innerWidth / 100)
        const maxH = Math.min(window.innerHeight * 0.98, parseInt(maxHeight?.replace('vh', '') || '100') * window.innerHeight / 100)
        
        if (direction.includes('right')) {
          newWidth = Math.max(minW, Math.min(maxW, e.clientX - rect.left))
        }
        if (direction.includes('bottom')) {
          newHeight = Math.max(minH, Math.min(maxH, e.clientY - rect.top))
        }
        if (direction.includes('left')) {
          const deltaX = rect.left - e.clientX
          newWidth = Math.max(minW, Math.min(maxW, rect.width + deltaX))
          newX = Math.max(0, rect.left - (newWidth - rect.width))
        }
        if (direction.includes('top')) {
          const deltaY = rect.top - e.clientY
          newHeight = Math.max(minH, Math.min(maxH, rect.height + deltaY))
          newY = Math.max(0, rect.top - (newHeight - rect.height))
        }

        // Ensure window stays within viewport during resize
        if (newX + newWidth > window.innerWidth) {
          newX = window.innerWidth - newWidth
        }
        if (newY + newHeight > window.innerHeight) {
          newY = window.innerHeight - newHeight
        }

        setWindowState(prev => ({
          ...prev,
          size: { width: newWidth, height: newHeight },
          position: { x: newX, y: newY }
        }))
      }
    }

    const handleMouseUp = () => {
      setWindowState(prev => ({ 
        ...prev, 
        isDragging: false, 
        isResizing: false,
        resizeDirection: undefined,
        dragOffset: { x: 0, y: 0 }
      }))
    }

    if (windowState.isDragging || windowState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = windowState.isResizing ? 
        `${windowState.resizeDirection?.replace('-', '')}-resize` : 'grabbing'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [windowState.isDragging, windowState.isResizing, windowState.isMaximized, windowState.dragOffset, windowState.resizeDirection, windowState.size, minWidth, minHeight, maxWidth, maxHeight, isMobile])

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (windowState.isMaximized || windowState.isMinimized) return
    
    e.preventDefault()
    const rect = headerRef.current?.getBoundingClientRect()
    if (!rect) return

    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    setWindowState(prev => ({
      ...prev,
      isDragging: true,
      dragOffset: {
        x: clientX - rect.left,
        y: clientY - rect.top
      }
    }))
  }

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    if (windowState.isMaximized || windowState.isMinimized) return
    
    e.preventDefault()
    e.stopPropagation()
    setWindowState(prev => ({ ...prev, isResizing: true, resizeDirection: direction }))
  }

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize()
    } else {
      const manager = MinimizedWindowManager.getInstance()
      manager.addMinimizedWindow(windowId, title, icon)
      setWindowState(prev => ({ ...prev, isMinimized: true }))
    }
  }

  const handleRestore = () => {
    const manager = MinimizedWindowManager.getInstance()
    manager.removeMinimizedWindow(windowId)
    setWindowState(prev => ({ ...prev, isMinimized: false }))
  }

  const handleMaximize = () => {
    setWindowState(prev => {
      if (prev.isMaximized) {
        return {
          ...prev,
          isMaximized: false,
          position: prev.previousState?.position || { x: 100, y: 100 },
          size: prev.previousState?.size || { 
            width: parseInt(defaultWidth.replace('px', '')), 
            height: parseInt(defaultHeight.replace('px', ''))
          },
          previousState: undefined
        }
      } else {
        return {
          ...prev,
          isMaximized: true,
          previousState: {
            position: prev.position,
            size: prev.size
          }
        }
      }
    })
  }

  const handleClose = () => {
    const manager = MinimizedWindowManager.getInstance()
    manager.removeMinimizedWindow(windowId)
    
    if (windowRef.current) {
      windowRef.current.style.transform = 'scale(0.9) translateY(-20px)'
      windowRef.current.style.opacity = '0'
      setTimeout(onClose, 200)
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  // Render minimized windows
  const minimizedBubbles = minimizedWindows
    .filter(([id]) => id !== windowId)
    .map(([id, data]) => (
      <MinimizedWindowBubble
        key={id}
        windowId={id}
        title={data.title}
        icon={data.icon}
        position={data.position}
        onRestore={() => {
          // This would need to be handled by the parent component
          console.log('Restore window:', id)
        }}
        onClose={() => {
          MinimizedWindowManager.getInstance().removeMinimizedWindow(id)
        }}
        themeState={themeState}
      />
    ))

  // Return minimized bubble if this window is minimized
  if (windowState.isMinimized) {
    const minimizedData = MinimizedWindowManager.getInstance().getMinimizedWindow(windowId)
    if (minimizedData) {
      return (
        <>
          {minimizedBubbles}
          <MinimizedWindowBubble
            windowId={windowId}
            title={title}
            icon={icon}
            position={minimizedData.position}
            onRestore={handleRestore}
            onClose={handleClose}
            themeState={themeState}
          />
        </>
      )
    }
  }

  // Mobile: Enhanced full screen with better responsiveness
  if (isMobile) {
    return (
      <>
        {minimizedBubbles}
        <div 
          className="fixed inset-0 z-[9999] flex flex-col safe-area"
          style={{ backgroundColor: themeState.theme.colors.background.primary }}
        >
          <div 
            className="flex items-center justify-between p-4 border-b safe-top"
            style={{ 
              backgroundColor: themeState.theme.colors.background.secondary,
              borderColor: themeState.theme.colors.border.primary 
            }}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {icon && <div style={{ color: themeState.theme.colors.text.primary }}>{icon}</div>}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-primary-theme truncate">{title}</h3>
                {subtitle && <p className="text-sm text-secondary-theme truncate">{subtitle}</p>}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {minimizable && (
                <button
                  onClick={handleMinimize}
                  className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="w-5 h-5 text-secondary-theme" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-secondary-theme" />
              </button>
            </div>
          </div>

          <div 
            className="flex-1 overflow-hidden safe-bottom"
            style={{ backgroundColor: themeState.theme.colors.background.primary }}
          >
            <div className="h-full overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Desktop: Enhanced windowed mode with better scaling
  const style = {
    left: windowState.isMaximized ? 0 : windowState.position.x,
    top: windowState.isMaximized ? 0 : windowState.position.y,
    width: windowState.isMaximized ? '100vw' : windowState.size.width,
    height: windowState.isMaximized ? '100vh' : windowState.size.height,
    zIndex: windowState.isDragging || windowState.isResizing ? 10000 : zIndex,
    transform: windowState.isDragging ? 'scale(1.02)' : 'scale(1)',
    transition: windowState.isDragging || windowState.isResizing ? 'none' : 'transform 0.2s ease-out'
  }

  return (
    <>
      {minimizedBubbles}
      <div
        ref={windowRef}
        className={`window-frame fixed rounded-xl shadow-2xl overflow-hidden border-2 ${
          windowState.isDragging ? 'dragging shadow-3xl' : ''
        } ${windowState.isResizing ? 'resizing' : ''} ${className}`}
        style={{
          ...style,
          backgroundColor: themeState.theme.colors.background.primary,
          borderColor: windowState.isDragging || windowState.isResizing 
            ? themeState.theme.colors.primary[500] 
            : themeState.theme.colors.border.primary,
          boxShadow: windowState.isDragging || windowState.isResizing
            ? `0 25px 50px rgba(0,0,0,0.25), 0 0 0 4px ${themeState.theme.colors.primary[500]}40`
            : `0 20px 40px rgba(0,0,0,0.15)`
        }}
      >
        {/* Enhanced Title Bar with better theming */}
        <div
          ref={headerRef}
          className={`flex items-center justify-between px-4 py-3 border-b glass-effect ${
            windowState.isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ 
            backgroundColor: themeState.theme.colors.background.secondary,
            borderColor: themeState.theme.colors.border.primary,
            backdropFilter: 'blur(20px)'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          {/* Traffic Lights with enhanced styling */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="w-3 h-3 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 hover:scale-110 shadow-sm"
              title="Close"
            />
            {minimizable && (
              <button
                onClick={handleMinimize}
                className="w-3 h-3 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-all duration-200 hover:scale-110 shadow-sm"
                title="Minimize"
              />
            )}
            {maximizable && (
              <button
                onClick={handleMaximize}
                className="w-3 h-3 bg-green-500 hover:bg-green-600 rounded-full transition-all duration-200 hover:scale-110 shadow-sm"
                title={windowState.isMaximized ? 'Restore' : 'Maximize'}
              />
            )}
          </div>

          {/* Enhanced Title with better typography */}
          <div className="flex items-center space-x-3 flex-1 justify-center">
            {icon && (
              <div 
                className="flex-shrink-0"
                style={{ color: themeState.theme.colors.text.primary }}
              >
                {icon}
              </div>
            )}
            <div className="text-center min-w-0">
              <h3 
                className="font-semibold text-sm truncate"
                style={{ color: themeState.theme.colors.text.primary }}
              >
                {title}
              </h3>
              {subtitle && (
                <p 
                  className="text-xs truncate"
                  style={{ color: themeState.theme.colors.text.secondary }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Window state indicator */}
          <div className="flex items-center space-x-1 text-xs" style={{ color: themeState.theme.colors.text.tertiary }}>
            {windowState.isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Enhanced Content with auto-scaling */}
        <div 
          className="flex-1 overflow-hidden relative"
          style={{ 
            backgroundColor: themeState.theme.colors.background.primary,
            height: `calc(100% - 54px)`
          }}
        >
          <div 
            className="w-full h-full overflow-y-auto scrollable"
            style={{
              fontSize: windowState.size.width < 400 ? '14px' : 
                       windowState.size.width < 500 ? '15px' : '16px',
              lineHeight: windowState.size.width < 400 ? '1.4' : '1.5'
            }}
          >
            {children}
          </div>
        </div>

        {/* Enhanced Resize Handles with better visibility */}
        {resizable && !windowState.isMaximized && !isMobile && (
          <>
            {/* Corner handles */}
            <div
              className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-primary-300 transition-colors duration-200 opacity-0 hover:opacity-50 rounded-br-lg"
              onMouseDown={handleResizeStart('top-left')}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-primary-300 transition-colors duration-200 opacity-0 hover:opacity-50 rounded-bl-lg"
              onMouseDown={handleResizeStart('top-right')}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-primary-300 transition-colors duration-200 opacity-0 hover:opacity-50 rounded-tr-lg"
              onMouseDown={handleResizeStart('bottom-left')}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-primary-300 transition-colors duration-200 opacity-0 hover:opacity-50 rounded-tl-lg"
              onMouseDown={handleResizeStart('bottom-right')}
            />
            
            {/* Edge handles with better hover feedback */}
            <div
              className="absolute top-0 left-3 right-3 h-1 cursor-n-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-30"
              onMouseDown={handleResizeStart('top')}
            />
            <div
              className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-30"
              onMouseDown={handleResizeStart('bottom')}
            />
            <div
              className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-30"
              onMouseDown={handleResizeStart('left')}
            />
            <div
              className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-30"
              onMouseDown={handleResizeStart('right')}
            />
          </>
        )}
      </div>
    </>
  )
} 