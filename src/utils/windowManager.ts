// Window Manager Utility for handling z-index and positioning
export class WindowManager {
  private static instance: WindowManager
  private activeWindows: Map<string, { 
    zIndex: number; 
    isActive: boolean;
    title: string;
    isOpen: boolean;
    restoreCallback?: () => void;
  }> = new Map()
  // private baseZIndex = 9000 // Reserved for future use
  private maxZIndex = 9000

  static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager()
    }
    return WindowManager.instance
  }

  // Register a new window
  registerWindow(windowId: string, baseZIndex: number = 9000, title: string = '', restoreCallback?: () => void): number {
    const zIndex = Math.max(baseZIndex, this.maxZIndex + 1)
    this.activeWindows.set(windowId, { 
      zIndex, 
      isActive: false, 
      title, 
      isOpen: true, 
      restoreCallback 
    })
    this.maxZIndex = Math.max(this.maxZIndex, zIndex)
    return zIndex
  }

  // Bring window to front
  bringToFront(windowId: string): number {
    const window = this.activeWindows.get(windowId)
    if (!window) return 9000

    // Set all other windows as inactive
    this.activeWindows.forEach((w, id) => {
      if (id !== windowId) {
        w.isActive = false
      }
    })

    // Bring this window to front
    const newZIndex = this.maxZIndex + 1
    window.zIndex = newZIndex
    window.isActive = true
    this.maxZIndex = newZIndex

    return newZIndex
  }

  // Remove window from management
  unregisterWindow(windowId: string): void {
    this.activeWindows.delete(windowId)
  }

  // Get current z-index for a window
  getZIndex(windowId: string): number {
    const window = this.activeWindows.get(windowId)
    return window?.zIndex || 9000
  }

  // Check if window is active (on top)
  isActive(windowId: string): boolean {
    const window = this.activeWindows.get(windowId)
    return window?.isActive || false
  }

  // Get next available z-index for sub-windows
  getSubWindowZIndex(parentWindowId: string): number {
    const parentWindow = this.activeWindows.get(parentWindowId)
    const baseZIndex = parentWindow?.zIndex || 9000
    return baseZIndex + 100 // Sub-windows get +100 z-index from parent
  }

  // Set window open/closed state
  setWindowState(windowId: string, isOpen: boolean): void {
    const window = this.activeWindows.get(windowId)
    if (window) {
      window.isOpen = isOpen
    }
  }

  // Get all windows (for debugging/management)
  getAllWindows(): Array<[string, { zIndex: number; isActive: boolean; title: string; isOpen: boolean }]> {
    return Array.from(this.activeWindows.entries())
  }

  // Restore a window by ID (global restore)
  restoreWindow(windowId: string): boolean {
    const window = this.activeWindows.get(windowId)
    if (window?.restoreCallback) {
      try {
        window.restoreCallback()
        window.isOpen = true
        return true
      } catch (error) {
        console.error('Error restoring window:', windowId, error)
        return false
      }
    }
    return false
  }

  // Update window title
  updateWindowTitle(windowId: string, title: string): void {
    const window = this.activeWindows.get(windowId)
    if (window) {
      window.title = title
    }
  }

  // Reset all z-indexes (useful for cleanup)
  reset(): void {
    this.activeWindows.clear()
    this.maxZIndex = 9000
  }
}

// Window positioning utilities
export const WindowPositioning = {
  // Calculate cascade position for new windows
  getCascadePosition(windowCount: number, baseX: number = 100, baseY: number = 100): { x: number; y: number } {
    const offset = windowCount * 30
    return {
      x: baseX + offset,
      y: baseY + offset
    }
  },

  // Center window in viewport
  getCenterPosition(windowWidth: number, windowHeight: number): { x: number; y: number } {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    return {
      x: Math.max(20, (viewportWidth - windowWidth) / 2),
      y: Math.max(40, (viewportHeight - windowHeight) / 2)
    }
  },

  // Ensure window is within viewport bounds
  constrainToViewport(x: number, y: number, width: number, height: number): { x: number; y: number } {
    const maxX = window.innerWidth - width - 20
    const maxY = window.innerHeight - height - 20
    
    return {
      x: Math.max(20, Math.min(maxX, x)),
      y: Math.max(40, Math.min(maxY, y))
    }
  },

  // Get optimal size for window based on viewport
  getOptimalSize(
    defaultWidth: number, 
    defaultHeight: number, 
    maxWidthPercent: number = 0.9, 
    maxHeightPercent: number = 0.9
  ): { width: number; height: number } {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    const maxWidth = viewportWidth * maxWidthPercent
    const maxHeight = viewportHeight * maxHeightPercent
    
    return {
      width: Math.min(defaultWidth, maxWidth),
      height: Math.min(defaultHeight, maxHeight)
    }
  }
}

// Responsive scaling utilities
export const ResponsiveScaling = {
  // Get font size based on window width with more granular breakpoints
  getFontSize(windowWidth: number): string {
    if (windowWidth < 300) return '10px'
    if (windowWidth < 350) return '11px'
    if (windowWidth < 400) return '12px'
    if (windowWidth < 480) return '13px'
    if (windowWidth < 600) return '14px'
    if (windowWidth < 768) return '15px'
    if (windowWidth < 1024) return '16px'
    return '17px'
  },

  // Get line height based on window width with better readability
  getLineHeight(windowWidth: number): string {
    if (windowWidth < 300) return '1.1'
    if (windowWidth < 400) return '1.2'
    if (windowWidth < 500) return '1.3'
    if (windowWidth < 650) return '1.4'
    if (windowWidth < 800) return '1.45'
    return '1.5'
  },

  // Get padding based on window size with more responsive scaling
  getPadding(windowWidth: number): string {
    if (windowWidth < 300) return '0.25rem'
    if (windowWidth < 400) return '0.375rem'
    if (windowWidth < 500) return '0.5rem'
    if (windowWidth < 650) return '0.625rem'
    if (windowWidth < 800) return '0.75rem'
    return '1rem'
  },

  // Get responsive grid columns based on window width with better breakpoints
  getGridColumns(windowWidth: number): number {
    if (windowWidth < 350) return 1
    if (windowWidth < 500) return 2
    if (windowWidth < 650) return 2
    if (windowWidth < 800) return 3
    if (windowWidth < 1000) return 3
    if (windowWidth < 1200) return 4
    return 5
  },

  // Get optimal content width for text readability
  getContentMaxWidth(windowWidth: number): string {
    if (windowWidth < 400) return '100%'
    if (windowWidth < 600) return '95%'
    if (windowWidth < 800) return '90%'
    if (windowWidth < 1000) return '85%'
    return '80%'
  },

  // Get spacing scale based on window size
  getSpacing(windowWidth: number): {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  } {
    const scale = windowWidth < 400 ? 0.5 : 
                  windowWidth < 600 ? 0.75 : 
                  windowWidth < 800 ? 0.85 : 
                  windowWidth < 1000 ? 1 : 1.15

    return {
      xs: `${0.25 * scale}rem`,
      sm: `${0.5 * scale}rem`,
      md: `${1 * scale}rem`,
      lg: `${1.5 * scale}rem`,
      xl: `${2 * scale}rem`
    }
  },

  // Get icon size based on window width
  getIconSize(windowWidth: number): number {
    if (windowWidth < 350) return 14
    if (windowWidth < 500) return 16
    if (windowWidth < 650) return 18
    if (windowWidth < 800) return 20
    if (windowWidth < 1000) return 22
    return 24
  },

  // Get button size scale based on window width
  getButtonScale(windowWidth: number): string {
    if (windowWidth < 350) return '0.75'
    if (windowWidth < 500) return '0.85'
    if (windowWidth < 650) return '0.95'
    return '1'
  },

  // Get optimal window size for current viewport (enhanced algorithm)
  getOptimalWindowSize(requestedWidth: number, requestedHeight: number): { width: number; height: number } {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const pixelRatio = window.devicePixelRatio || 1

    // Adjust for high-DPI displays
    const dpiScale = pixelRatio > 1.5 ? 1.1 : 1

    // Mobile devices detection
    const isMobile = viewportWidth < 768
    const isSmallMobile = viewportWidth < 480

    // Responsive scaling thresholds
    let maxWidthPercent: number
    let maxHeightPercent: number

    if (isSmallMobile) {
      // Small mobile devices - near fullscreen
      maxWidthPercent = 0.98
      maxHeightPercent = 0.98
    } else if (isMobile) {
      // Standard mobile - near fullscreen but with minimal margins
      maxWidthPercent = 0.96
      maxHeightPercent = 0.96
    } else if (viewportWidth <= 1024) {
      // Small laptops
      maxWidthPercent = 0.95
      maxHeightPercent = 0.90
    } else if (viewportWidth <= 1366) {
      // Standard laptops
      maxWidthPercent = 0.90
      maxHeightPercent = 0.85
    } else if (viewportWidth <= 1920) {
      // Desktop/large laptops
      maxWidthPercent = 0.85
      maxHeightPercent = 0.80
    } else {
      // Large displays
      maxWidthPercent = 0.75
      maxHeightPercent = 0.75
    }

    const maxWidth = Math.floor(viewportWidth * maxWidthPercent * dpiScale)
    const maxHeight = Math.floor(viewportHeight * maxHeightPercent * dpiScale)

    // Ensure minimum usable size with better mobile support
    const minWidth = Math.min(isSmallMobile ? viewportWidth * 0.95 : 320, viewportWidth * 0.9)
    const minHeight = Math.min(isSmallMobile ? viewportHeight * 0.95 : 240, viewportHeight * 0.85)

    // On very small mobile devices, prioritize maximizing the available space
    if (isSmallMobile) {
      return {
        width: maxWidth,
        height: maxHeight
      }
    }

    return {
      width: Math.max(minWidth, Math.min(requestedWidth, maxWidth)),
      height: Math.max(minHeight, Math.min(requestedHeight, maxHeight))
    }
  },

  // Get scale factor for different screen densities
  getDisplayScale(): number {
    const pixelRatio = window.devicePixelRatio || 1
    if (pixelRatio >= 3) return 1.2  // Retina displays
    if (pixelRatio >= 2) return 1.1  // High-DPI
    return 1  // Standard displays
  },

  // Get optimal column layout for grid views
  getOptimalLayout(windowWidth: number, itemCount: number): {
    columns: number;
    itemWidth: string;
    gap: string;
  } {
    const baseColumns = this.getGridColumns(windowWidth)
    const optimalColumns = Math.min(baseColumns, Math.ceil(Math.sqrt(itemCount)))
    
    const spacing = this.getSpacing(windowWidth)
    
    return {
      columns: optimalColumns,
      itemWidth: `calc((100% - ${spacing.md} * ${optimalColumns - 1}) / ${optimalColumns})`,
      gap: spacing.md
    }
  }
}

export default WindowManager 