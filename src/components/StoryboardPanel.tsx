import { useState, useRef, useEffect } from 'react'
import { Edit3, Trash2, Camera, Loader, Download, Upload, RotateCcw, Heart, ArrowUp, ArrowDown, Zap, Sparkles, Star, Award, Timer, ChevronDown, ChevronUp, MoreVertical, Play, Video, Pause } from 'lucide-react'
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
  const [isHovered, setIsHovered] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isContentOverflowing, setIsContentOverflowing] = useState(false)
  const [showMobilePopup, setShowMobilePopup] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const isActive = isSelected || isHovered

  useEffect(() => {
    if (panel.imageUrl) {
      setImageLoaded(false)
      const img = new Image()
      img.onload = () => setImageLoaded(true)
      img.src = panel.imageUrl
    }
  }, [panel.imageUrl])

  useEffect(() => {
    if (panel.videoUrl) {
      setVideoLoaded(false)
    }
  }, [panel.videoUrl])
  
  // Check if description is overflowing
  useEffect(() => {
    if (descriptionRef.current) {
      const isOverflowing = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight
      setIsContentOverflowing(isOverflowing)
    }
  }, [panel.description, isDescriptionExpanded])

  // Clean up video playing state when unmounting
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [])

  useEffect(() => {
    // Close mobile popup when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobilePopup(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!aiService.isReady()) {
      alert('Please set up your OpenAI API key first in the AI Assistant settings.')
      return
    }
    
    setIsGeneratingImage(true)
    
    try {
      const imageUrl = await aiService.generateImage(panel.description, { 
        style: 'cinematic',
        quality: 'standard' 
      })
      
      if (imageUrl) {
        dispatch({
          type: 'UPDATE_PANEL',
          payload: {
            id: panel.id,
            updates: {
              imageUrl,
              updatedAt: new Date(),
            },
          },
        })
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
    if (isMobile) {
      setShowMobilePopup(false)
    }
    onEdit?.()
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
    onSelect()
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

  const toggleVideoPlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!videoRef.current) return;
    
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
      });
    }
    
    setIsVideoPlaying(!isVideoPlaying);
  }

  const handleVideoError = () => {
    console.error('Error loading video for panel:', panel.id);
    setVideoLoaded(false);
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

      {/* Video Indicator Badge - Show when panel has video */}
      {panel.videoUrl && (
        <div className="absolute top-3 right-12 z-30">
          <div 
            className="px-2 py-1 rounded-full flex items-center gap-1 text-xs shadow-md"
            style={{
              backgroundColor: themeColors.status.info.background,
              color: themeColors.status.info.text
            }}
          >
            <Video className="w-3 h-3" />
            <span>Video</span>
          </div>
        </div>
      )}

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
      {!isMobile && (isSelected || isHovered || showActions) && (
        <div 
          className="absolute top-0 right-0 px-2 py-2 flex flex-col gap-2 z-20"
          style={{ 
            background: 'linear-gradient(45deg, transparent, rgba(0,0,0,0.05))'
          }}
        >
          <div className="flex space-x-1">
            {/* Edit Button */}
            <button
              onClick={handleEdit}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation"
              style={{
                backgroundColor: themeColors.status.success.background,
                color: themeColors.status.success.text
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.status.success.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.status.success.background;
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
                e.currentTarget.style.backgroundColor = themeColors.status.error.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.status.error.background;
              }}
              title="Delete Panel"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
          
          {/* Second row of buttons */}
          {(isSelected || showActions) && (
            <div className="flex space-x-1">
              {canMoveUp && (
                <button
                  onClick={handleMoveUp}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation"
                  style={{
                    backgroundColor: themeColors.interactive.primary.background,
                    color: themeColors.interactive.primary.text
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeState.theme.colors.secondary[200];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.primary.background;
                  }}
                  title="Move Up"
                >
                  <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
              
              {canMoveDown && (
                <button
                  onClick={handleMoveDown}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 shadow-sm hover:shadow-md touch-manipulation"
                  style={{
                    backgroundColor: themeColors.interactive.primary.background,
                    color: themeColors.interactive.primary.text
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeState.theme.colors.secondary[200];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.interactive.primary.background;
                  }}
                  title="Move Down"
                >
                  <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Bottom row buttons */}
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

      {/* Main Content - Image/Video Area / Upload Placeholder */}
      <div className="relative" style={{ minHeight: '160px' }}>
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

          {/* Image/Video area */}
          <div className="relative w-full overflow-hidden" style={{ 
            minHeight: '180px', 
            maxHeight: '280px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {panel.videoUrl ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={panel.videoUrl}
                  className="w-full h-full max-h-[280px] object-contain"
                  onLoadedData={() => setVideoLoaded(true)}
                  onError={handleVideoError}
                  onClick={(e) => e.stopPropagation()}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  muted={!isActive}
                  loop
                  playsInline
                />
                
                {/* Video controls overlay */}
                <div className="absolute inset-0 flex items-center justify-center" onClick={toggleVideoPlayback}>
                  <button 
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-200"
                    onClick={toggleVideoPlayback}
                  >
                    {isVideoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                  </button>
                  
                  {/* Video indicator */}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    <span>Video</span>
                  </div>
                </div>
                
                {!videoLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                    <Loader className="w-8 h-8 animate-spin" style={{ color: themeState.theme.colors.primary[500] }} />
                  </div>
                )}
              </div>
            ) : panel.imageUrl ? (
              <>
                <img 
                  src={panel.imageUrl} 
                  alt={panel.title}
                  className={`w-full transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  style={{ 
                    maxHeight: '280px',
                    objectFit: 'contain',
                    maxWidth: '100%'
                  }}
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
                >No Media Yet</p>
                <p 
                  className="text-sm max-w-xs text-center"
                  style={{ color: themeState.theme.colors.text.tertiary }}
                >
                  Add a detailed description and use the image generation tool or upload media.
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
      </div>
    </div>
  )
}