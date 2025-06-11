import { useState, useRef, useEffect } from 'react'
import { Edit3, Trash2, Camera, Loader, Download, Upload, RotateCcw, Heart, ArrowUp, ArrowDown, Zap, Sparkles, Star, Award, Timer, ChevronDown, ChevronUp } from 'lucide-react'
import type { StoryboardPanel as StoryboardPanelType } from '../types'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import { getThemeColors } from '../utils/themeColors'
import { aiService } from '../services/ai'

interface StoryboardPanelProps {
  panel: StoryboardPanelType
  isSelected: boolean
  onSelect: () => void
  onEdit?: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean

  onDragStart?: (e: React.DragEvent, panelId: string) => void
  onDragEnd?: () => void
  onTouchStart?: (e: React.TouchEvent, panelId: string) => void
  onTouchMove?: (e: React.TouchEvent) => void
  onTouchEnd?: () => void
  isMobile?: boolean
  showActions?: boolean
}

export default function StoryboardPanel({ 
  panel, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  canMoveUp, 
  canMoveDown,

  onDragStart,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  isMobile = false,
  showActions = false
}: StoryboardPanelProps) {
  

  const { dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  const themeColors = getThemeColors(themeState.theme)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(panel.title)
  const [editedDescription, setEditedDescription] = useState(panel.description)
  const [isHovered, setIsHovered] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isContentOverflowing, setIsContentOverflowing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)

  const isActive = isSelected || isHovered

  useEffect(() => {
    if (panel.imageUrl) {
      setImageLoaded(false)
      const img = new Image()
      img.onload = () => setImageLoaded(true)
      img.src = panel.imageUrl
    }
  }, [panel.imageUrl])

  // Check if description content overflows
  useEffect(() => {
    const checkOverflow = () => {
      if (descriptionRef.current) {
        const element = descriptionRef.current
        const lineHeight = parseInt(window.getComputedStyle(element).lineHeight)
        const maxLines = isMobile ? 3 : 4
        const maxHeight = lineHeight * maxLines
        setIsContentOverflowing(element.scrollHeight > maxHeight)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [panel.description, isMobile])

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onEdit) {
      onEdit()
    } else {
      setIsEditing(true)
    }
  }

  const handleDelete = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onDelete) {
      onDelete()
    }
  }

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_PANEL',
      payload: {
        id: panel.id,
        updates: {
          title: editedTitle,
          description: editedDescription
        }
      }
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedTitle(panel.title)
    setEditedDescription(panel.description)
    setIsEditing(false)
  }

  const handleGenerateImage = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    if (isGeneratingImage) return
    
    setIsGeneratingImage(true)
    try {
      const imageUrl = await aiService.generateImage(panel.description)
      dispatch({
        type: 'UPDATE_PANEL',
        payload: {
          id: panel.id,
          updates: { imageUrl: imageUrl || undefined }
        }
      })
    } catch (error) {
      console.error('Error generating image:', error)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleRegenerateImage = async () => {
    handleGenerateImage()
  }

  const handleDownloadImage = async () => {
    if (!panel.imageUrl) return
    
    try {
      const response = await fetch(panel.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${panel.title || 'panel'}-${panel.id}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setDownloadStatus('✓ Image downloaded successfully!')
      setTimeout(() => setDownloadStatus(null), 3000)
    } catch (error) {
      setDownloadStatus('✗ Download failed')
      setTimeout(() => setDownloadStatus(null), 3000)
    }
  }

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        dispatch({
          type: 'UPDATE_PANEL',
          payload: {
            id: panel.id,
            updates: { imageUrl }
          }
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePanelClick = (e: React.MouseEvent) => {
    onSelect()
  }

  const handleContainerClick = (e: React.MouseEvent) => {
    // For normal clicks, only handle if not coming from interactive elements
    const target = e.target as HTMLElement
    if (!target.closest('button') && !target.closest('input') && !target.closest('textarea')) {
      onSelect()
    }
  }

  return (
    <div
      className={`storyboard-panel group relative rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? 'selected ring-2 shadow-lg'
          : isHovered
          ? 'hovered ring-1 shadow-md'
          : 'shadow-sm hover:shadow-md border'
      }`}
      style={{
        backgroundColor: themeState.theme.colors.background.primary,
        borderColor: themeState.theme.colors.border.primary,
        ...(isSelected && { 
          ringColor: themeState.theme.colors.primary[500],
          borderColor: themeState.theme.colors.primary[300]
        }),
        ...(isHovered && !isSelected && { 
          ringColor: themeState.theme.colors.primary[200],
          borderColor: themeState.theme.colors.primary[200]
        })
      }}
      onClick={handleContainerClick}
      onMouseEnter={() => {
        if (!isMobile) {
          setIsHovered(true)
        }
      }}
      onMouseLeave={() => {
        if (!isMobile) {
          setIsHovered(false)
        }
      }}
      draggable={!isMobile}
      onDragStart={(e) => onDragStart?.(e, panel.id)}
      onDragEnd={onDragEnd}
      onTouchStart={(e) => onTouchStart?.(e, panel.id)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Selection Checkbox - Only shown in selection mode */}
      {/* This would need to be passed as a prop from StoryboardGrid */}
      


      {/* Selection Indicator - Shows when panel is selected */}
      {isSelected && (
        <div className="absolute top-1 right-1 z-40">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-lg"
            style={{ 
              backgroundColor: themeState.theme.colors.primary[500],
              color: '#ffffff'
            }}
          >
            ✓
          </div>
        </div>
      )}

      {/* Panel Number - Positioned in top-left corner */}
      <div className="absolute top-3 left-3 z-30">
        <div 
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
            isSelected 
              ? 'shadow-lg ring-2' 
              : 'shadow-md border-2'
          }`}
          style={{
            backgroundColor: isSelected ? themeState.theme.colors.primary[500] : themeState.theme.colors.background.primary,
            color: isSelected ? 'white' : themeState.theme.colors.text.primary,
            borderColor: isSelected ? 'transparent' : themeState.theme.colors.border.primary
          }}
        >
          {panel.order + 1}
        </div>
      </div>

      {/* Modern Action Buttons - Fixed positioning to avoid being hidden */}
      <div className={`absolute top-2 right-2 z-50 transition-all duration-200 ${
        showActions || isSelected ? 'opacity-100 transform translate-x-0 scale-100' : 'opacity-0 transform translate-x-6 scale-75'
      }`}>
        
        {/* Primary Action Row */}
        <div className="flex flex-wrap gap-1 mb-2 justify-end">
          {/* Move Up Button */}
          {canMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onMoveUp?.()
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation"
              style={{
                backgroundColor: themeColors.interactive.primary.background,
                color: themeColors.interactive.primary.text
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.interactive.primary.hover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.interactive.primary.background
              }}
              title="Move Up"
            >
              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Move Down Button */}
          {canMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onMoveDown?.()
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation"
              style={{
                backgroundColor: themeColors.interactive.primary.background,
                color: themeColors.interactive.primary.text
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.interactive.primary.hover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.interactive.primary.background
              }}
              title="Move Down"
            >
              <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Edit Button */}
          <button
            onClick={handleEdit}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation"
            style={{
              backgroundColor: themeColors.status.success.background,
              color: themeColors.status.success.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.status.success.hover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.status.success.background
            }}
            title="Edit Panel"
          >
            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            onTouchEnd={handleDelete}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation"
            style={{
              backgroundColor: themeColors.status.error.background,
              color: themeColors.status.error.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.status.error.hover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.status.error.background
            }}
            title="Delete Panel"
          >
            <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Secondary Action Row - Simplified */}
        <div className="flex flex-wrap gap-1 justify-end">
          {/* Generate Image Button */}
          <button
            onClick={handleGenerateImage}
            disabled={isGeneratingImage}
            className={`w-7 h-7 sm:w-8 sm:h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation ${
              isGeneratingImage ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Generate Image"
          >
            {isGeneratingImage ? (
              <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Header - Fixed text alignment and visibility */}
      {!isEditing ? (
        <div className="p-4 border-b relative z-10"
          style={{
            backgroundColor: isSelected 
              ? `${themeState.theme.colors.primary[50]}90`
              : themeState.theme.colors.background.secondary,
            borderColor: themeState.theme.colors.border.primary
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pl-12 pr-3">
              <h3 className="text-lg font-semibold leading-tight truncate mb-2"
                style={{ 
                  color: themeState.theme.colors.text.primary,
                  textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {panel.title}
              </h3>
              <div className="flex items-center flex-wrap gap-2">
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: themeColors.status.info.light,
                    color: themeColors.status.info.background,
                    borderColor: themeColors.status.info.border
                  }}
                >
                  📽️ {panel.shotType.replace('-', ' ')}
                </span>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: themeColors.status.success.light,
                    color: themeColors.status.success.background,
                    borderColor: themeColors.status.success.border
                  }}
                >
                  📐 {panel.cameraAngle.replace('-', ' ')}
                </span>
                <div 
                  className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: themeColors.project.purple.light,
                    color: themeColors.project.purple.background,
                    borderColor: themeColors.project.purple.background + '40'
                  }}
                >
                  <Timer className="w-3 h-3" />
                  <span>{panel.duration}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="p-5 border-b"
          style={{
            background: `linear-gradient(135deg, ${themeState.theme.colors.primary[50]}, ${themeState.theme.colors.secondary[50]})`,
            borderColor: themeState.theme.colors.primary[200]
          }}
        >
          <div className="pl-12 pr-3">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl font-bold text-lg focus:ring-4 transition-all duration-300 shadow-sm"
              style={{
                backgroundColor: themeState.theme.colors.background.primary,
                borderColor: themeState.theme.colors.primary[300],
                color: themeState.theme.colors.text.primary
              }}
              placeholder="Panel title..."
            />
          </div>
        </div>
      )}

      {/* Enhanced Image Container with Modern Design */}
      <div 
        className="relative aspect-video overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${themeState.theme.colors.background.secondary}, ${themeState.theme.colors.background.tertiary})`
        }}
      >
        {panel.imageUrl ? (
          <>
            <img
              src={panel.imageUrl}
              alt={panel.title}
              className={`w-full h-full object-cover transition-all duration-500 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
            
            {/* Modern Image Loading State */}
            {!imageLoaded && (
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${themeState.theme.colors.primary[100]}, ${themeState.theme.colors.secondary[50]}, ${themeState.theme.colors.primary[100]})`
                }}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div 
                      className="w-16 h-16 rounded-full animate-bounce"
                      style={{
                        background: `linear-gradient(135deg, ${themeState.theme.colors.primary[400]}, ${themeState.theme.colors.secondary[400]})`
                      }}
                    ></div>
                    <div 
                      className="absolute inset-0 w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: themeState.theme.colors.primary[300] }}
                    ></div>
                  </div>
                  <p 
                    className="text-sm font-bold"
                    style={{ color: themeState.theme.colors.primary[600] }}
                  >
                    Loading amazing image...
                  </p>
                </div>
              </div>
            )}

            {/* Image Status Indicator - Simplified */}
            <div className={`absolute bottom-3 left-3 right-3 glass-effect rounded-xl p-2 transition-all duration-500 ${
              isActive ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
            }`}>
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-xs">Ready</span>
                </div>
                <div className="text-xs opacity-75">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Simplified Image Overlay Actions */}
            <div className={`absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/30 transition-all duration-500 flex items-center justify-center ${
              showActions ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="flex space-x-4 animate-bounce-in">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRegenerateImage()
                  }}
                  disabled={isGeneratingImage}
                  className="w-14 h-14 bg-gradient-to-r from-purple-500/90 to-pink-500/90 hover:from-purple-600/90 hover:to-pink-600/90 text-white rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 disabled:opacity-50 shadow-xl hover:shadow-2xl animate-fade-in animate-delay-200"
                  title="Regenerate Image"
                >
                  {isGeneratingImage ? (
                    <Loader className="w-6 h-6 animate-spin" />
                  ) : (
                    <RotateCcw className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Modern Generation Progress */}
            {isGeneratingImage && (
              <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
                <div 
                  className="rounded-2xl p-8 flex flex-col items-center space-y-6 animate-fade-in shadow-2xl"
                  style={{
                    backgroundColor: themeState.theme.colors.background.primary
                  }}
                >
                  <div className="relative">
                    <Sparkles 
                      className="w-16 h-16 animate-bounce" 
                      style={{ color: themeState.theme.colors.primary[500] }}
                    />
                    <div 
                      className="absolute inset-0 w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: themeState.theme.colors.primary[200] }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <p 
                      className="font-bold text-lg"
                      style={{ color: themeState.theme.colors.text.primary }}
                    >✨ Creating Magic</p>
                    <p 
                      className="text-sm"
                      style={{ color: themeState.theme.colors.text.secondary }}
                    >AI is painting your vision...</p>
                    <div 
                      className="mt-3 w-32 h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: themeState.theme.colors.background.tertiary }}
                    >
                      <div 
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.secondary[500]})`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              color: themeState.theme.colors.text.tertiary,
              background: `linear-gradient(135deg, ${themeState.theme.colors.background.secondary}, ${themeState.theme.colors.background.primary})`
            }}
          >
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 animate-float shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${themeState.theme.colors.primary[200]}, ${themeState.theme.colors.secondary[200]}, ${themeState.theme.colors.primary[200]})`
              }}
            >
              <Camera 
                className="w-12 h-12"
                style={{ color: themeState.theme.colors.primary[500] }}
              />
            </div>
            <p 
              className="text-xl font-bold mb-3"
              style={{ color: themeState.theme.colors.text.primary }}
            >No Image Yet</p>
            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              className={`font-bold py-3 px-6 rounded-xl flex items-center space-x-3 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                isGeneratingImage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`,
                color: '#ffffff'
              }}
              onMouseEnter={(e) => {
                if (!isGeneratingImage) {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${themeState.theme.colors.primary[600]}, ${themeState.theme.colors.primary[700]})`
                }
              }}
              onMouseLeave={(e) => {
                if (!isGeneratingImage) {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`
                }
              }}
            >
              {isGeneratingImage ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>🎨 Generate Image</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Description Section with Better Contrast and Overflow Handling */}
      <div 
        className="p-3 sm:p-4 lg:p-5"
        style={{
          backgroundColor: themeState.theme.colors.background.primary
        }}
      >
        {!isEditing ? (
          <div className="space-y-3">
            <div className="relative">
              <p 
                ref={descriptionRef}
                className={`leading-relaxed text-sm sm:text-base transition-all duration-300 ${
                  isActive ? 'text-high-contrast' : 'text-secondary-theme'
                } ${
                  !isDescriptionExpanded && isContentOverflowing 
                    ? 'line-clamp-3 sm:line-clamp-4 overflow-hidden' 
                    : ''
                }`}
                style={{
                  color: themeState.theme.colors.text.primary,
                  lineHeight: isMobile ? '1.4' : '1.5'
                }}
              >
                {panel.description}
              </p>
              
              {/* Expand/Collapse Button */}
              {isContentOverflowing && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className={`mt-2 flex items-center gap-1 text-xs font-medium transition-all duration-200 hover:scale-105 touch-manipulation ${
                    isMobile ? 'px-3 py-2' : 'px-2 py-1'
                  } rounded-full`}
                  style={{
                    backgroundColor: `${themeState.theme.colors.primary[500]}20`,
                    color: themeState.theme.colors.primary[600],
                    border: `1px solid ${themeState.theme.colors.primary[200]}`
                  }}
                >
                  {isDescriptionExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show More
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Panel Metadata - Improved Responsive Layout */}
            {panel.notes && (
              <div 
                className={`mt-3 p-2 sm:p-3 rounded-lg border ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}
                style={{
                  backgroundColor: `${themeState.theme.colors.secondary[50]}50`,
                  borderColor: themeState.theme.colors.border.secondary,
                  color: themeState.theme.colors.text.secondary
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs opacity-75">📝</span>
                  <span className="flex-1 leading-relaxed">{panel.notes}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl resize-none focus:ring-4 transition-all duration-300"
              style={{
                backgroundColor: themeState.theme.colors.background.secondary,
                borderColor: themeState.theme.colors.border.primary,
                color: themeState.theme.colors.text.primary
              }}
              rows={4}
              placeholder="Describe your panel in vivid detail..."
            />
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                className="flex-1 font-bold py-3 px-4 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`,
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${themeState.theme.colors.primary[600]}, ${themeState.theme.colors.primary[700]})`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.primary[600]})`
                }}
              >
                ✅ Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 font-bold py-3 px-4 rounded-xl transform hover:scale-105 transition-all duration-300"
                style={{
                  backgroundColor: themeState.theme.colors.background.tertiary,
                  color: themeState.theme.colors.text.primary
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Notes Section */}
        {panel.notes && (
          <div 
            className="mt-4 p-4 rounded-xl border-l-4 shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${themeState.theme.colors.secondary[50]}, ${themeState.theme.colors.primary[50]})`,
              borderColor: themeState.theme.colors.primary[400]
            }}
          >
            <div className="flex items-start space-x-3">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: themeState.theme.colors.primary[400] }}
              >
                <span className="text-white text-xs font-bold">💡</span>
              </div>
              <p 
                className="text-sm font-medium"
                style={{ color: themeState.theme.colors.primary[800] }}
              >{panel.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modern Status Notifications */}
      {downloadStatus && (
        <div className={`absolute bottom-4 left-4 right-4 px-4 py-3 rounded-xl text-white text-sm font-bold animate-fade-in shadow-lg ${
          downloadStatus.includes('success') 
            ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
            : 'bg-gradient-to-r from-red-500 to-pink-500'
        }`}>
          <div className="flex items-center space-x-2">
            {downloadStatus.includes('success') ? (
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
            ) : (
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <span className="text-red-500 text-xs">✗</span>
              </div>
            )}
            <span>{downloadStatus}</span>
          </div>
        </div>
      )}

      {/* Modern Glow Effects - FIXED: No more blinking */}
      {isSelected && (
        <div 
          className="absolute -inset-1 rounded-3xl opacity-20 pointer-events-none blur-sm"
          style={{
            background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.secondary[500]}, ${themeState.theme.colors.primary[500]})`
          }}
        ></div>
      )}
      
      {isHovered && !isSelected && (
        <div 
          className="absolute -inset-0.5 rounded-3xl opacity-10 pointer-events-none blur-sm"
          style={{
            background: `linear-gradient(135deg, ${themeState.theme.colors.primary[400]}, ${themeState.theme.colors.secondary[400]}, ${themeState.theme.colors.primary[400]})`
          }}
        ></div>
      )}
    </div>
  )
} 