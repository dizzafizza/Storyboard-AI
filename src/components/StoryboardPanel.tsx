import { useState, useRef, useEffect } from 'react'
import { Edit3, Trash2, Camera, Loader, Download, Upload, RotateCcw, Heart, ArrowUp, ArrowDown, Zap, Sparkles, Star, Award, Timer, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react'
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
  const [showMobilePopup, setShowMobilePopup] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const isActive = isSelected || isHovered

  useEffect(() => {
    if (panel.imageUrl) {
      setImageLoaded(false)
      const img = new Image()
      img.onload = () => setImageLoaded(true)
      img.src = panel.imageUrl
    }
  }, [panel.imageUrl])
  
  // Check if description is overflowing
  useEffect(() => {
    if (descriptionRef.current) {
      const isOverflowing = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight
      setIsContentOverflowing(isOverflowing)
    }
  }, [panel.description, isDescriptionExpanded])

  // Hide mobile popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMobilePopup && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobilePopup(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMobilePopup])

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isGeneratingImage) return
    setIsGeneratingImage(true)
    
    try {
      const result = await aiService.generateImage(panel.description)
      
      if (result) {
        dispatch({
          type: 'UPDATE_PANEL',
          payload: {
            id: panel.id,
            updates: {
              imageUrl: result,
              updatedAt: new Date()
            }
          }
        })
      } else {
        console.error('Failed to generate image')
        alert('Failed to generate image. Please try again.')
      }
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Error generating image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditedTitle(panel.title)
    setEditedDescription(panel.description)
    setIsEditing(true)
    if (isMobile) {
      setShowMobilePopup(false)
    }
    onEdit?.()
  }

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_PANEL',
      payload: {
        id: panel.id,
        updates: {
          title: editedTitle,
          description: editedDescription,
          updatedAt: new Date()
        }
      }
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleDelete = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (isMobile) {
      setShowMobilePopup(false)
    }
    onDelete?.()
  }

  const handleContainerClick = () => {
    // Prevent selection when in editing mode
    if (!isEditing) {
      onSelect()
    }
  }

  const handleToggleMobileMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setShowMobilePopup(prev => !prev)
  }

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (isMobile) {
      setShowMobilePopup(false)
    }
    onMoveUp?.()
  }

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (isMobile) {
      setShowMobilePopup(false)
    }
    onMoveDown?.()
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

      {/* Mobile Options Button */}
      {isMobile && (
        <div className="absolute top-3 right-3 z-50">
          <button
            onClick={handleToggleMobileMenu}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation mobile-action-button"
            style={{
              backgroundColor: themeColors.interactive.primary.background,
              color: themeColors.interactive.primary.text
            }}
            title="Panel Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {/* Mobile Popup Menu */}
          {showMobilePopup && (
            <div 
              ref={mobileMenuRef}
              className="absolute top-10 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 overflow-hidden mobile-popup-menu"
              style={{
                backgroundColor: themeState.theme.colors.background.primary,
                borderColor: themeState.theme.colors.border.primary,
                border: `1px solid ${themeState.theme.colors.border.primary}`
              }}
            >
              <div className="p-1 w-40">
                {/* Edit Action */}
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm"
                  style={{
                    color: themeColors.status.success.text
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Panel</span>
                </button>
                
                {/* Move Up Action */}
                {canMoveUp && (
                  <button
                    onClick={handleMoveUp}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm"
                    style={{
                      color: themeColors.interactive.primary.text
                    }}
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>Move Up</span>
                  </button>
                )}
                
                {/* Move Down Action */}
                {canMoveDown && (
                  <button
                    onClick={handleMoveDown}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm"
                    style={{
                      color: themeColors.interactive.primary.text
                    }}
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>Move Down</span>
                  </button>
                )}
                
                {/* Generate Image Action */}
                <button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm ${
                    isGeneratingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{
                    color: themeColors.project.purple.text
                  }}
                >
                  {isGeneratingImage ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>Generate Image</span>
                </button>
                
                {/* Delete Action */}
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm"
                  style={{
                    color: themeColors.status.error.text
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Panel</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Action Buttons - Only show on desktop */}
      {!isMobile && (
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
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation"
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
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Secondary Action Row - Simplified */}
          <div className="flex flex-wrap gap-1 justify-end">
            {/* Generate Image Button */}
            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation ${
                isGeneratingImage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: themeColors.project.purple.background,
                color: themeColors.project.purple.text
              }}
              onMouseEnter={(e) => {
                if (!isGeneratingImage) {
                  e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[600];
                }
              }}
              onMouseLeave={(e) => {
                if (!isGeneratingImage) {
                  e.currentTarget.style.backgroundColor = themeColors.project.purple.background;
                }
              }}
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
      )}

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
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b"
          style={{
            backgroundColor: themeState.theme.colors.background.secondary,
            borderColor: themeState.theme.colors.border.primary
          }}
        >
          <div className="mb-3">
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: themeState.theme.colors.text.secondary }}
              htmlFor={`panel-title-${panel.id}`}
            >
              Panel Title
            </label>
            <input
              id={`panel-title-${panel.id}`}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-4 py-2 border-2 rounded-xl focus:ring-4 transition-all duration-300"
              style={{
                backgroundColor: themeState.theme.colors.background.primary,
                borderColor: themeState.theme.colors.border.primary,
                color: themeState.theme.colors.text.primary
              }}
              placeholder="Panel title..."
            />
          </div>
        </div>
      )}

      {/* Main Content - Image Area / Upload Placeholder */}
      <div className="relative" style={{ minHeight: '160px' }}>
        {!isEditing ? (
          <div className="relative">
            {/* Description area - Appears below image */}
            <div 
              className="p-4"
              style={{
                backgroundColor: themeState.theme.colors.background.primary,
                color: themeState.theme.colors.text.primary
              }}
            >
              <div className="relative">
                <p 
                  ref={descriptionRef}
                  className={`text-sm leading-relaxed ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}
                  style={{ color: themeState.theme.colors.text.secondary }}
                >
                  {panel.description}
                </p>
                
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
            </div>

            {/* Image area */}
            <div className="relative w-full overflow-hidden" style={{ minHeight: '180px', maxHeight: '220px' }}>
              {panel.imageUrl ? (
                <>
                  <img 
                    src={panel.imageUrl} 
                    alt={panel.title}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    style={{ minHeight: '180px' }}
                  />
                  
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                      <Loader className="w-8 h-8 animate-spin" style={{ color: themeState.theme.colors.primary[500] }} />
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
                  <p 
                    className="text-sm max-w-xs text-center"
                    style={{ color: themeState.theme.colors.text.tertiary }}
                  >
                    Add a detailed description and use the image generation tool to visualize your scene.
                  </p>
                </div>
              )}
            </div>
            
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
      </div>
    </div>
  )
}