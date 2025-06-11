import { useState, useRef, useEffect, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { WindowManager, ResponsiveScaling } from '../utils/windowManager'
import { getThemeColors } from '../utils/themeColors'

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
  usePortal?: boolean
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
  private minimizedWindows: Map<string, { 
    position: { x: number; y: number }, 
    title: string, 
    icon?: ReactNode,
    restoreCallback?: () => void
  }> = new Map()
  private listeners: Set<() => void> = new Set()

  static getInstance(): MinimizedWindowManager {
    if (!MinimizedWindowManager.instance) {
      MinimizedWindowManager.instance = new MinimizedWindowManager()
    }
    return MinimizedWindowManager.instance
  }

  addMinimizedWindow(id: string, title: string, icon?: ReactNode, restoreCallback?: () => void) {
    const position = this.getNextMinimizedPosition()
    this.minimizedWindows.set(id, { position, title, icon, restoreCallback })
    this.notifyListeners()
  }

  restoreMinimizedWindow(id: string) {
    console.log('MinimizedWindowManager: Trying to restore window:', id)
    const window = this.minimizedWindows.get(id)
    if (window?.restoreCallback) {
      console.log('MinimizedWindowManager: Found restore callback for window:', id)
      window.restoreCallback()
      this.removeMinimizedWindow(id)
      return true
    }
    console.log('MinimizedWindowManager: No restore callback found for window:', id)
    return false
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
    const bubbleWidth = 200  // New wider bubble design
    const bubbleHeight = 60
    const margin = 12
    const startX = 20
    const startY = window.innerHeight - bubbleHeight - 20

    // Taskbar-style horizontal stacking from left to right
    for (let i = 0; i < 12; i++) {  // Max 12 windows in taskbar
      const x = startX + i * (bubbleWidth + margin)
      const y = startY

      // Check if position is available and within viewport
      if (x + bubbleWidth < window.innerWidth - 20) {
        const isOccupied = existingPositions.some(pos => 
          Math.abs(pos.x - x) < bubbleWidth && Math.abs(pos.y - y) < bubbleHeight
        )
        if (!isOccupied) {
          return { x, y }
        }
      }
    }

    // If no horizontal space in taskbar, create second row
    for (let row = 1; row < 3; row++) {  // Max 3 rows
      for (let col = 0; col < 12; col++) {
        const x = startX + col * (bubbleWidth + margin)
        const y = startY - row * (bubbleHeight + margin)

        if (x + bubbleWidth < window.innerWidth - 20 && y > 100) {
          const isOccupied = existingPositions.some(pos => 
            Math.abs(pos.x - x) < bubbleWidth && Math.abs(pos.y - y) < bubbleHeight
          )
          if (!isOccupied) {
            return { x, y }
          }
        }
      }
    }

    // Fallback: center of screen bottom
    return { 
      x: Math.max(20, (window.innerWidth - bubbleWidth) / 2), 
      y: startY 
    }
  }
}

// Minimized Window Bubble Component - Redesigned for better UX and theme integration
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
  const themeColors = getThemeColors(themeState.theme)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentPosition, setCurrentPosition] = useState(position)
  const [isRestoring, setIsRestoring] = useState(false)
  const [dragStartTime, setDragStartTime] = useState(0)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle click vs drag detection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    e.preventDefault()
    
    const startTime = Date.now()
    setDragStartTime(startTime)
    
    const rect = bubbleRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }

    // Set a timeout to enable dragging after 300ms
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(true)
    }, 300)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Clear drag timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
      dragTimeoutRef.current = null
    }

    const clickDuration = Date.now() - dragStartTime
    
    // If it was a quick click (less than 300ms) and we weren't dragging, restore the window
    // Increased threshold to make clicking more reliable
    if (clickDuration < 300 && !isDragging) {
      handleRestore()
    }
    
    setIsDragging(false)
  }

  const handleRestore = async () => {
    if (isRestoring) return
    
    console.log('MinimizedWindowBubble: Starting restore for window:', windowId, title)
    setIsRestoring(true)
    try {
      await onRestore()
      console.log('MinimizedWindowBubble: Restore completed for window:', windowId)
    } catch (error) {
      console.error('MinimizedWindowBubble: Error restoring window:', windowId, error)
    } finally {
      setTimeout(() => setIsRestoring(false), 500)
    }
  }

  // Enhanced drag functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Smarter viewport constraints
      const bubbleWidth = 200 // New wider design
      const bubbleHeight = 60
      const constrainedX = Math.max(10, Math.min(window.innerWidth - bubbleWidth - 10, newX))
      const constrainedY = Math.max(10, Math.min(window.innerHeight - bubbleHeight - 10, newY))
      
      setCurrentPosition({ x: constrainedX, y: constrainedY })
      MinimizedWindowManager.getInstance().updateMinimizedPosition(windowId, { x: constrainedX, y: constrainedY })
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
        dragTimeoutRef.current = null
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleGlobalMouseUp, { passive: true })
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
    }
  }, [isDragging, dragOffset, windowId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={bubbleRef}
      className={`fixed transition-all duration-300 ease-out transform-gpu group ${
        isRestoring
          ? 'z-[10001] scale-110'
          : isDragging 
          ? 'z-[10001] scale-105 rotate-1' 
          : 'z-[9000] hover:scale-105 hover:-translate-y-1'
      }`}
      style={{
        left: currentPosition.x,
        top: currentPosition.y,
        width: '200px',
        height: '60px',
        cursor: isDragging ? 'grabbing' : 'pointer',
        willChange: isDragging ? 'transform, left, top' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isRestoring ? `Restoring ${title}...` : `Click to restore ${title}`}
    >
      {/* Main card container with theme integration */}
      <div 
        className="w-full h-full rounded-xl border backdrop-blur-md transition-all duration-300 overflow-hidden"
        style={{
          backgroundColor: isDragging 
            ? themeState.theme.colors.background.secondary 
            : themeState.theme.colors.background.primary,
          borderColor: isDragging || isHovered
            ? themeState.theme.colors.primary[500]
            : themeState.theme.colors.border.primary,
          boxShadow: isDragging 
            ? `0 12px 24px rgba(0,0,0,0.15), 0 0 0 2px ${themeState.theme.colors.primary[500]}40`
            : isHovered
            ? `0 8px 16px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)`
            : `0 4px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`,
          filter: isDragging ? 'brightness(1.05)' : 'brightness(1)'
        }}
      >
        {/* Content container */}
        <div className="flex items-center h-full px-3 py-2 relative">
          {/* Window icon */}
          <div 
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-200"
            style={{
              backgroundColor: `${themeState.theme.colors.primary[500]}15`,
              border: `1px solid ${themeState.theme.colors.primary[300]}30`
            }}
          >
            {icon ? (
              <div 
                className="text-lg transition-transform duration-200 group-hover:scale-110"
                style={{ color: themeState.theme.colors.primary[600] }}
              >
                {icon}
              </div>
            ) : (
              <div 
                className="text-xs font-bold transition-transform duration-200 group-hover:scale-110"
                style={{ color: themeState.theme.colors.primary[600] }}
              >
                {title.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Window title and info */}
          <div className="flex-1 min-w-0 pr-2">
            <h4 
              className="text-sm font-semibold truncate transition-colors duration-200"
              style={{ color: themeState.theme.colors.text.primary }}
            >
              {title}
            </h4>
            <p 
              className="text-xs truncate mt-0.5 transition-colors duration-200"
              style={{ color: themeState.theme.colors.text.secondary }}
            >
              {isRestoring ? 'Restoring...' : 'Click to restore'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex-shrink-0 flex items-center space-x-1">
            {/* Restore button (primary action) */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRestore()
              }}
              disabled={isRestoring}
              className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50"
              style={{
                backgroundColor: isHovered ? `${themeState.theme.colors.primary[500]}20` : 'transparent',
                color: themeState.theme.colors.primary[600]
              }}
              title="Restore window"
            >
              {isRestoring ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
              style={{
                backgroundColor: isHovered ? themeColors.status.error.light : 'transparent',
                color: themeColors.status.error.background
              }}
              title="Close window"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Status indicator */}
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300"
            style={{
              backgroundColor: themeState.theme.colors.primary[500],
              boxShadow: `0 0 6px ${themeState.theme.colors.primary[500]}60`,
              animation: isRestoring ? 'pulse 1s ease-in-out infinite' : 'none'
            }}
          />

          {/* Hover gradient overlay */}
          <div 
            className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
            style={{
              background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}08, ${themeState.theme.colors.primary[600]}12)`,
              opacity: isHovered ? 1 : 0
            }}
          />
        </div>
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
  defaultWidth = '520px',
  defaultHeight = '380px',
  minWidth = 300,
  minHeight = 220,
  maxWidth = '95vw',
  maxHeight = '95vh',
  resizable = true,
  minimizable = true,
  maximizable = true,
  windowId = Math.random().toString(36).substr(2, 9),
  zIndex = 9000,
  usePortal = true
}: WindowFrameProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const { state: themeState } = useTheme()
  const themeColors = getThemeColors(themeState.theme)
  const [isMobile, setIsMobile] = useState(false)
  const [minimizedWindows, setMinimizedWindows] = useState<Array<[string, any]>>([])
  const [currentZIndex, setCurrentZIndex] = useState(zIndex)
  
  const [windowState, setWindowState] = useState<WindowState>(() => {
    const requestedWidth = parseInt(defaultWidth.replace(/[^0-9]/g, ''))
    const requestedHeight = parseInt(defaultHeight.replace(/[^0-9]/g, ''))
    const optimalSize = ResponsiveScaling.getOptimalWindowSize(requestedWidth, requestedHeight)
    
    return {
      isMaximized: false,
      isMinimized: false,
      position: { x: 0, y: 0 },
      size: optimalSize,
      isDragging: false,
      isResizing: false,
      resizeDirection: undefined,
      dragOffset: { x: 0, y: 0 },
      previousState: undefined
    }
  })

  // Define handleRestore function with useCallback to prevent stale closures
  const handleRestore = useCallback(() => {
    console.log('WindowFrame: Starting restore for window:', windowId, title)
    const manager = MinimizedWindowManager.getInstance()
    manager.removeMinimizedWindow(windowId)
    setWindowState(prev => ({ 
      ...prev, 
      isMinimized: false,
      // Ensure window is visible and properly positioned
      position: prev.position.x === 0 && prev.position.y === 0 
        ? { x: 100, y: 100 } 
        : prev.position
    }))
    
    // Bring window to front when restored
    setTimeout(() => {
      const windowManager = WindowManager.getInstance()
      const newZIndex = windowManager.bringToFront(windowId)
      setCurrentZIndex(newZIndex)
      console.log('WindowFrame: Restore completed for window:', windowId, 'new zIndex:', newZIndex)
    }, 100)
  }, [windowId, title])

  // Register window with window manager
  useEffect(() => {
    const windowManager = WindowManager.getInstance()
    const registeredZIndex = windowManager.registerWindow(windowId, zIndex, title, handleRestore)
    setCurrentZIndex(registeredZIndex)

    // Update window state when open/closed
    windowManager.setWindowState(windowId, isOpen)

    return () => {
      windowManager.unregisterWindow(windowId)
    }
  }, [windowId, zIndex, title, isOpen, handleRestore])

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

  // Detect mobile/small screens with better responsiveness and window scaling
  useEffect(() => {
    const checkMobileAndScale = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-adjust window size for mobile - make it fullscreen on mobile
      if (mobile && !windowState.isMinimized) {
        setWindowState(prev => ({
          ...prev,
          size: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          position: { x: 0, y: 0 },
          isMaximized: true // Force maximized on mobile
        }))
      } else if (!mobile && !windowState.isMinimized && !windowState.isMaximized) {
        // On desktop, ensure window size is within optimal bounds
        const currentWidth = windowState.size.width
        const currentHeight = windowState.size.height
        const optimalSize = ResponsiveScaling.getOptimalWindowSize(currentWidth, currentHeight)
        
        if (currentWidth !== optimalSize.width || currentHeight !== optimalSize.height) {
          setWindowState(prev => ({
            ...prev,
            size: optimalSize,
            // Re-center if window was resized
            position: {
              x: Math.max(0, (window.innerWidth - optimalSize.width) / 2),
              y: Math.max(0, (window.innerHeight - optimalSize.height) / 2)
            }
          }))
        }
      }
    }
    
    checkMobileAndScale()
    window.addEventListener('resize', checkMobileAndScale)
    return () => window.removeEventListener('resize', checkMobileAndScale)
  }, [windowState.isMinimized, windowState.isMaximized])

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

  // Enhanced drag functionality with improved constraints and performance
  useEffect(() => {
    let animationFrameId: number | null = null
    
    const handleMouseMove = (e: MouseEvent) => {
      if (windowState.isDragging && !windowState.isMaximized && !isMobile && windowState.dragOffset) {
        e.preventDefault()
        
        // Use requestAnimationFrame for smooth animations
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
        
        animationFrameId = requestAnimationFrame(() => {
          const newX = e.clientX - windowState.dragOffset!.x
          const newY = e.clientY - windowState.dragOffset!.y

          // Enhanced viewport constraints with smart snapping
          const snapThreshold = 15
          const windowWidth = windowState.size.width
          const windowHeight = windowState.size.height
          
          let constrainedX = Math.max(-windowWidth / 3, Math.min(window.innerWidth - windowWidth / 3, newX))
          let constrainedY = Math.max(0, Math.min(window.innerHeight - windowHeight, newY))
          
          // Snap to edges with smooth transition
          if (constrainedX < snapThreshold) constrainedX = 0
          if (constrainedX > window.innerWidth - windowWidth - snapThreshold) constrainedX = window.innerWidth - windowWidth
          if (constrainedY < snapThreshold) constrainedY = 0

          setWindowState(prev => ({
            ...prev,
            position: { x: constrainedX, y: constrainedY }
          }))
        })
      }
      
      // Enhanced resizing with better constraints and smooth performance
      if (windowState.isResizing && windowState.resizeDirection && !windowState.isMaximized) {
        e.preventDefault()
        const rect = windowRef.current?.getBoundingClientRect()
        if (!rect) return

        // Use requestAnimationFrame for resize operations too
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
        
        animationFrameId = requestAnimationFrame(() => {
          let newWidth = windowState.size.width
          let newHeight = windowState.size.height
          let newX = windowState.position.x
          let newY = windowState.position.y

          const direction = windowState.resizeDirection!
          const minW = Math.max(minWidth, 300)
          const minH = Math.max(minHeight, 220)
          const maxW = Math.min(window.innerWidth * 0.95, parseInt(maxWidth?.replace('vw', '') || '100') * window.innerWidth / 100)
          const maxH = Math.min(window.innerHeight * 0.95, parseInt(maxHeight?.replace('vh', '') || '100') * window.innerHeight / 100)
          
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
            newX = Math.max(0, window.innerWidth - newWidth)
          }
          if (newY + newHeight > window.innerHeight) {
            newY = Math.max(0, window.innerHeight - newHeight)
          }

          setWindowState(prev => ({
            ...prev,
            size: { width: newWidth, height: newHeight },
            position: { x: newX, y: newY }
          }))
        })
      }
    }

    const handleMouseUp = () => {
      // Cancel any pending animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      
      setWindowState(prev => ({ 
        ...prev, 
        isDragging: false, 
        isResizing: false,
        resizeDirection: undefined,
        dragOffset: { x: 0, y: 0 }
      }))
    }

    if (windowState.isDragging || windowState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp, { passive: true })
      document.body.style.userSelect = 'none'
      document.body.style.cursor = windowState.isResizing ? 
        `${windowState.resizeDirection?.replace('-', '')}-resize` : 'grabbing'
    }

    return () => {
      // Cleanup animation frame on unmount
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      
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
      // Register this window's restore callback
      manager.addMinimizedWindow(windowId, title, icon, handleRestore)
      setWindowState(prev => ({ ...prev, isMinimized: true }))
    }
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
      // Smooth close animation
      windowRef.current.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out'
      windowRef.current.style.transform = 'scale(0.95) translateY(-10px)'
      windowRef.current.style.opacity = '0'
      setTimeout(() => {
        onClose()
      }, 200)
    } else {
      onClose()
    }
  }

  const handleWindowClick = () => {
    const windowManager = WindowManager.getInstance()
    const newZIndex = windowManager.bringToFront(windowId)
    setCurrentZIndex(newZIndex)
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
          // Try MinimizedWindowManager first
          const minimizedManager = MinimizedWindowManager.getInstance()
          const restoredFromMinimized = minimizedManager.restoreMinimizedWindow(id)
          
          // If that fails, try global WindowManager
          if (!restoredFromMinimized) {
            const windowManager = WindowManager.getInstance()
            const restoredFromGlobal = windowManager.restoreWindow(id)
            
            if (!restoredFromGlobal) {
              console.warn('Could not restore window:', id, 'No restore callback registered in either manager')
            }
          }
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
      const minimizedContent = (
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

      if (usePortal) {
        return createPortal(minimizedContent, document.body)
      }

      return minimizedContent
    }
  }

  // Mobile: Enhanced full screen with better responsiveness
  if (isMobile) {
    const mobileContent = (
      <>
        {minimizedBubbles}
        <div 
          className="fixed inset-0 z-[9999] flex flex-col safe-area-mobile bg-primary"
          style={{ backgroundColor: themeState.theme.colors.background.primary }}
        >
          <div 
            className="flex items-center justify-between p-3 sm:p-4 border-b safe-top-mobile bg-secondary"
            style={{ 
              backgroundColor: themeState.theme.colors.background.secondary,
              borderColor: themeState.theme.colors.border.primary 
            }}
          >
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              {icon && <div className="flex-shrink-0" style={{ color: themeState.theme.colors.text.primary }}>{icon}</div>}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base text-primary-theme truncate">{title}</h3>
                {subtitle && <p className="text-xs sm:text-sm text-secondary-theme truncate">{subtitle}</p>}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {minimizable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    handleMinimize()
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                  }}
                  className="p-2 hover:bg-tertiary rounded-lg transition-colors touch-manipulation"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-theme" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleClose()
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                }}
                className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors touch-manipulation"
                title="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-theme" />
              </button>
            </div>
          </div>

          <div 
            className="flex-1 overflow-hidden safe-bottom-mobile bg-primary"
            style={{ backgroundColor: themeState.theme.colors.background.primary }}
          >
            <div 
              className="h-full overflow-y-auto"
              style={{
                fontSize: ResponsiveScaling.getFontSize(window.innerWidth),
                lineHeight: ResponsiveScaling.getLineHeight(window.innerWidth),
                padding: ResponsiveScaling.getPadding(window.innerWidth)
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </>
    )

    if (usePortal) {
      return createPortal(mobileContent, document.body)
    }

    return mobileContent
  }

  // Desktop: Enhanced windowed mode with better scaling and stability
  const style = {
    left: windowState.isMaximized ? 0 : Math.max(0, Math.min(window.innerWidth - 320, windowState.position.x)),
    top: windowState.isMaximized ? 0 : Math.max(0, Math.min(window.innerHeight - 240, windowState.position.y)),
    width: windowState.isMaximized ? '100vw' : Math.min(window.innerWidth * 0.95, windowState.size.width),
    height: windowState.isMaximized ? '100vh' : Math.min(window.innerHeight * 0.95, windowState.size.height),
    zIndex: windowState.isDragging || windowState.isResizing ? 10000 : currentZIndex,
    transform: windowState.isDragging ? 'scale(1.01) translateZ(0)' : 'scale(1) translateZ(0)',
    transition: windowState.isDragging || windowState.isResizing ? 'none' : 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
    willChange: windowState.isDragging || windowState.isResizing ? 'transform, left, top, width, height' : 'auto',
    backfaceVisibility: 'hidden' as const
  }

  const windowContent = (
    <>
      {minimizedBubbles}
      <div
        ref={windowRef}
        className={`window-frame fixed rounded-xl shadow-2xl overflow-hidden border-2 transform-gpu ${
          windowState.isDragging ? 'dragging' : ''
        } ${windowState.isResizing ? 'resizing' : ''} ${className}`}
        style={{
          ...style,
          backgroundColor: themeState.theme.colors.background.primary,
          borderColor: windowState.isDragging || windowState.isResizing 
            ? themeState.theme.colors.primary[500] 
            : themeState.theme.colors.border.primary,
          boxShadow: windowState.isDragging || windowState.isResizing
            ? `${themeColors.shadows.xl}, 0 0 0 3px ${themeState.theme.colors.primary[500]}30`
            : themeColors.shadows.lg
        }}
        onClick={handleWindowClick}
      >
        {/* Enhanced Title Bar with better theming */}
        <div
          ref={headerRef}
          className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b glass-effect"
          style={{ 
            backgroundColor: themeState.theme.colors.background.secondary,
            borderColor: themeState.theme.colors.border.primary,
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Traffic Lights with enhanced styling */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleClose()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="rounded-full transition-all duration-200 hover:scale-110 shadow-sm"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: themeColors.window.controls.close.background
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.window.controls.close.hover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.window.controls.close.background
              }}
              title="Close"
            />
            {minimizable && (
                              <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    handleMinimize()
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="rounded-full transition-all duration-200 hover:scale-110 shadow-sm"
                  style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: themeColors.window.controls.minimize.background
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.window.controls.minimize.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.window.controls.minimize.background
                  }}
                  title="Minimize"
                />
            )}
            {maximizable && (
                              <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    handleMaximize()
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="rounded-full transition-all duration-200 hover:scale-110 shadow-sm"
                  style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: themeColors.window.controls.maximize.background
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.window.controls.maximize.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.window.controls.maximize.background
                  }}
                  title={windowState.isMaximized ? 'Restore' : 'Maximize'}
                />
            )}
          </div>

          {/* Enhanced Title with better typography - Draggable Area */}
          <div 
            className={`flex items-center space-x-2 sm:space-x-3 flex-1 justify-center min-w-0 ${
              windowState.isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            {icon && (
              <div 
                className="flex-shrink-0"
                style={{ 
                  color: themeState.theme.colors.text.primary,
                  fontSize: `${ResponsiveScaling.getIconSize(windowState.size.width)}px`
                }}
              >
                {icon}
              </div>
            )}
            <div className="text-center min-w-0">
              <h3 
                className="font-semibold text-xs sm:text-sm truncate"
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
          <div 
            className="flex items-center space-x-1 text-xs flex-shrink-0 pointer-events-none" 
            style={{ color: themeState.theme.colors.text.tertiary }}
          >
            {windowState.isMaximized ? (
              <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </div>
        </div>

        {/* Enhanced Content with auto-scaling */}
        <div 
          className="flex-1 overflow-hidden relative w-full"
          style={{ 
            backgroundColor: themeState.theme.colors.background.primary,
            height: `calc(100% - ${windowState.size.height < 400 ? '44px' : '54px'})`
          }}
        >
          <div 
            className="w-full h-full overflow-y-auto scrollable"
            style={{
              fontSize: ResponsiveScaling.getFontSize(windowState.size.width),
              lineHeight: ResponsiveScaling.getLineHeight(windowState.size.width)
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
              className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize transition-colors duration-200 opacity-0 hover:opacity-50 rounded-br-lg"
              style={{
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[300]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
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

  // Use portal to render at root level to prevent stacking context issues
  if (usePortal) {
    return createPortal(windowContent, document.body)
  }

  return windowContent
} 