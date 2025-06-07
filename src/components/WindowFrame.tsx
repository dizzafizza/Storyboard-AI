import { useState, useRef, useEffect, ReactNode } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
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
  maximizable = true
}: WindowFrameProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const { state: themeState } = useTheme()
  const [isMobile, setIsMobile] = useState(false)
  
  const [windowState, setWindowState] = useState<WindowState>({
    isMaximized: false,
    isMinimized: false,
    position: { x: 0, y: 0 },
    size: { width: parseInt(defaultWidth), height: parseInt(defaultHeight) },
    isDragging: false,
    isResizing: false,
    resizeDirection: undefined,
    dragOffset: { x: 0, y: 0 },
    previousState: undefined
  })

  // Detect mobile/small screens
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Center window on open with better positioning
  useEffect(() => {
    if (isOpen && !windowState.isMaximized && !windowState.previousState) {
      const centerX = Math.max(0, (window.innerWidth - windowState.size.width) / 2)
      const centerY = Math.max(20, (window.innerHeight - windowState.size.height) / 2)
      
      setWindowState(prev => ({
        ...prev,
        position: { x: centerX, y: centerY }
      }))
    }
  }, [isOpen, windowState.size, windowState.isMaximized, windowState.previousState])

  // Enhanced drag functionality with constraints
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (windowState.isDragging && !windowState.isMaximized && !isMobile && windowState.dragOffset) {
        e.preventDefault()
        
        const newX = e.clientX - windowState.dragOffset.x
        const newY = e.clientY - windowState.dragOffset.y

        // Enhanced viewport constraints
        const maxX = Math.max(0, window.innerWidth - windowState.size.width)
        const maxY = Math.max(0, window.innerHeight - windowState.size.height)
        const minY = 0 // Prevent dragging above viewport

        setWindowState(prev => ({
          ...prev,
          position: {
            x: Math.max(0, Math.min(maxX, newX)),
            y: Math.max(minY, Math.min(maxY, newY))
          }
        }))
      }
      
      // Enhanced resizing with better constraints
      if (windowState.isResizing && windowState.resizeDirection && !windowState.isMaximized) {
        e.preventDefault()
        const rect = windowRef.current?.getBoundingClientRect()
        if (!rect) return

        let newWidth = windowState.size.width
        let newHeight = windowState.size.height
        let newX = windowState.position.x
        let newY = windowState.position.y

        const direction = windowState.resizeDirection
        
        if (direction.includes('right')) {
          newWidth = Math.max(minWidth, Math.min(window.innerWidth - rect.left, e.clientX - rect.left))
        }
        if (direction.includes('bottom')) {
          newHeight = Math.max(minHeight, Math.min(window.innerHeight - rect.top, e.clientY - rect.top))
        }
        if (direction.includes('left')) {
          const deltaX = e.clientX - rect.left
          const proposedWidth = Math.max(minWidth, rect.width - deltaX)
          const maxLeftMove = rect.left
          const actualDelta = Math.min(deltaX, maxLeftMove)
          newWidth = rect.width - actualDelta
          newX = rect.left + actualDelta
        }
        if (direction.includes('top')) {
          const deltaY = e.clientY - rect.top
          const proposedHeight = Math.max(minHeight, rect.height - deltaY)
          const maxTopMove = rect.top
          const actualDelta = Math.min(deltaY, maxTopMove)
          newHeight = rect.height - actualDelta
          newY = rect.top + actualDelta
        }

        // Ensure window doesn't exceed viewport
        const maxW = window.innerWidth * 0.95
        const maxH = window.innerHeight * 0.95
        newWidth = Math.min(newWidth, maxW)
        newHeight = Math.min(newHeight, maxH)

        // Ensure position stays within bounds
        newX = Math.max(0, Math.min(newX, window.innerWidth - newWidth))
        newY = Math.max(0, Math.min(newY, window.innerHeight - newHeight))

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
      document.body.style.userSelect = 'none' // Prevent text selection while dragging/resizing
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
    }
  }, [windowState.isDragging, windowState.isResizing, windowState.isMaximized, windowState.dragOffset, windowState.resizeDirection, windowState.size, minWidth, minHeight, isMobile])

  // Enhanced touch support for mobile
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!windowState.isDragging || windowState.isMaximized || !windowState.dragOffset) return
      
      e.preventDefault()
      const touch = e.touches[0]
      
      const newX = touch.clientX - windowState.dragOffset.x
      const newY = touch.clientY - windowState.dragOffset.y

      const maxX = window.innerWidth - windowState.size.width
      const maxY = window.innerHeight - windowState.size.height

      setWindowState(prev => ({
        ...prev,
        position: {
          x: Math.max(0, Math.min(maxX, newX)),
          y: Math.max(0, Math.min(maxY, newY))
        }
      }))
    }

    const handleTouchEnd = () => {
      setWindowState(prev => ({ 
        ...prev, 
        isDragging: false,
        dragOffset: { x: 0, y: 0 }
      }))
    }

    if (windowState.isDragging && !windowState.isMaximized) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [windowState.isDragging, windowState.isMaximized, windowState.dragOffset, windowState.size])

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (windowState.isMaximized) return
    
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
    if (windowState.isMaximized) return
    
    e.preventDefault()
    e.stopPropagation()
    setWindowState(prev => ({ ...prev, isResizing: true, resizeDirection: direction }))
  }

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize()
    } else {
      setWindowState(prev => ({ ...prev, isMinimized: !prev.isMinimized }))
    }
  }

  const handleMaximize = () => {
    setWindowState(prev => {
      if (prev.isMaximized) {
        // Restore to previous state
        return {
          ...prev,
          isMaximized: false,
          position: prev.previousState?.position || { x: 100, y: 100 },
          size: prev.previousState?.size || { width: parseInt(defaultWidth), height: parseInt(defaultHeight) },
          previousState: undefined
        }
      } else {
        // Maximize - save current state
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
    // Smooth close animation
    if (windowRef.current) {
      windowRef.current.style.transform = 'scale(0.95) translateY(-10px)'
      windowRef.current.style.opacity = '0'
      setTimeout(() => {
        onClose()
      }, 150)
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  // Mobile: Full screen overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col"
        style={{ backgroundColor: themeState.theme.colors.background.primary }}
      >
        {/* Mobile Header with Enhanced Traffic Lights */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ 
            backgroundColor: themeState.theme.colors.background.secondary,
            borderColor: themeState.theme.colors.border.primary 
          }}
        >
          <div className="flex items-center space-x-3">
            {icon && <div style={{ color: themeState.theme.colors.text.primary }}>{icon}</div>}
            <div>
              <h3 className="font-semibold text-primary-theme">{title}</h3>
              {subtitle && <p className="text-sm text-secondary-theme">{subtitle}</p>}
            </div>
          </div>
          
          <div className="traffic-lights">
            <button
              onClick={handleClose}
              className="traffic-light close"
              title="Close"
              aria-label="Close window"
            />
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden" style={{ backgroundColor: themeState.theme.colors.background.primary }}>
          {children}
        </div>
      </div>
    )
  }

  // Desktop: Windowed mode with enhanced positioning
  const style = {
    transform: windowState.isMinimized 
      ? 'scale(0.1) translateY(100vh)' 
      : 'scale(1) translateY(0)',
    left: windowState.isMaximized ? 0 : windowState.position.x,
    top: windowState.isMaximized ? 0 : windowState.position.y,
    width: windowState.isMaximized ? '100vw' : windowState.size.width,
    height: windowState.isMaximized ? '100vh' : windowState.size.height,
    zIndex: windowState.isDragging || windowState.isResizing ? 10000 : 9000,
  }

  return (
    <>
      {/* Window */}
      <div
        ref={windowRef}
        className={`window-frame ${
          windowState.isDragging ? 'dragging' : ''
        } ${windowState.isResizing ? 'resizing' : ''} ${className}`}
        style={{
          ...style,
          backgroundColor: themeState.theme.colors.background.primary,
          border: `1px solid ${themeState.theme.colors.border.primary}`,
        }}
      >
        {/* Enhanced Title Bar */}
        <div
          ref={headerRef}
          className={`flex items-center justify-between px-4 py-3 border-b glass-effect ${
            windowState.isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ 
            backgroundColor: themeState.theme.colors.background.secondary,
            borderColor: themeState.theme.colors.border.primary 
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          role="banner"
          aria-label={`Window: ${title}`}
        >
          {/* Enhanced Traffic Lights */}
          <div className="traffic-lights">
            <button
              onClick={handleClose}
              className="traffic-light close"
              title="Close"
              aria-label="Close window"
            />
            {minimizable && (
              <button
                onClick={handleMinimize}
                className="traffic-light minimize"
                title="Minimize"
                aria-label="Minimize window"
              />
            )}
            {maximizable && (
              <button
                onClick={handleMaximize}
                className="traffic-light maximize"
                title={windowState.isMaximized ? 'Restore' : 'Maximize'}
                aria-label={windowState.isMaximized ? 'Restore window' : 'Maximize window'}
              />
            )}
          </div>

          {/* Title with Better Typography */}
          <div className="flex items-center space-x-3 flex-1 justify-center">
            {icon && <div style={{ color: themeState.theme.colors.text.primary }}>{icon}</div>}
            <div className="text-center">
              <h3 className="font-semibold text-primary-theme">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-secondary-theme">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Window Controls Indicator */}
          <div className="flex items-center space-x-1 min-w-0">
            {windowState.isMaximized ? (
              <Minimize2 className="w-4 h-4 text-secondary-theme" />
            ) : (
              <Maximize2 className="w-4 h-4 text-secondary-theme" />
            )}
          </div>
        </div>

        {/* Content with Enhanced Layout */}
        <div 
          className="flex-1 overflow-hidden relative flex flex-col"
          style={{ 
            backgroundColor: themeState.theme.colors.background.primary,
            height: `calc(${windowState.size.height}px - 60px)` 
          }}
        >
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>

        {/* Enhanced Resize Handles */}
        {resizable && !windowState.isMaximized && (
          <>
            {/* Corners */}
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-30"
              onMouseDown={handleResizeStart('top-left')}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-30"
              onMouseDown={handleResizeStart('top-right')}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-30"
              onMouseDown={handleResizeStart('bottom-left')}
            />
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-30"
              onMouseDown={handleResizeStart('bottom-right')}
            />
            
            {/* Edges */}
            <div
              className="absolute top-0 left-4 right-4 h-2 cursor-n-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-20"
              onMouseDown={handleResizeStart('top')}
            />
            <div
              className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-20"
              onMouseDown={handleResizeStart('bottom')}
            />
            <div
              className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-20"
              onMouseDown={handleResizeStart('left')}
            />
            <div
              className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize hover:bg-primary-200 transition-colors duration-200 opacity-0 hover:opacity-20"
              onMouseDown={handleResizeStart('right')}
            />
          </>
        )}
      </div>
    </>
  )
} 