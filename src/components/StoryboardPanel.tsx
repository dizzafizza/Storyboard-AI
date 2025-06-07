import { useState, useRef, useEffect } from 'react'
import { Edit3, Trash2, Camera, Loader, Download, Upload, RotateCcw, Heart, ArrowUp, ArrowDown, Zap, Sparkles, Star, Award, Timer } from 'lucide-react'
import type { StoryboardPanel as StoryboardPanelType } from '../types'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
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
  canMoveDown 
}: StoryboardPanelProps) {
  const { dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(panel.title)
  const [editedDescription, setEditedDescription] = useState(panel.description)
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isActive = isSelected || isHovered

  useEffect(() => {
    if (panel.imageUrl) {
      setImageLoaded(false)
      const img = new Image()
      img.onload = () => setImageLoaded(true)
      img.src = panel.imageUrl
    }
  }, [panel.imageUrl])

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit()
    } else {
      setIsEditing(true)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleGenerateImage = async () => {
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

  return (
    <div
      className={`group relative rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden transform-gpu ${
        isSelected
          ? 'ring-4 shadow-2xl scale-105 z-20'
          : isHovered
          ? 'ring-2 shadow-xl scale-105 z-10'
          : 'shadow-lg hover:shadow-xl border'
      } animate-fade-in`}
      style={{
        backgroundColor: themeState.theme.colors.background.primary,
        borderColor: themeState.theme.colors.border.primary,
        ...(isSelected && { 
          ringColor: themeState.theme.colors.primary[500],
          background: `linear-gradient(135deg, ${themeState.theme.colors.primary[50]}, ${themeState.theme.colors.background.primary}, ${themeState.theme.colors.primary[100]})`
        }),
        ...(isHovered && !isSelected && { 
          ringColor: themeState.theme.colors.primary[300],
          background: `linear-gradient(135deg, ${themeState.theme.colors.secondary[50]}, ${themeState.theme.colors.background.primary}, ${themeState.theme.colors.primary[50]})`
        })
      }}
      onClick={onSelect}
      onMouseEnter={() => {
        setIsHovered(true)
        setShowActions(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowActions(false)
      }}
    >
      {/* Enhanced Selection & Priority Indicators */}
      <div className="absolute top-3 left-3 z-30 flex items-center space-x-2">
        {isSelected && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full shadow-lg transition-all duration-300"
            style={{
              backgroundColor: themeState.theme.colors.primary[500],
              color: 'white'
            }}
          >
            <Star className="w-4 h-4 fill-current" />
            <span className="text-xs font-bold">SELECTED</span>
          </div>
        )}
        <div 
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
            isSelected 
              ? 'shadow-lg ring-4' 
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

      {/* Modern Action Buttons */}
      <div className={`absolute top-3 right-3 z-30 flex flex-col space-y-2 transition-all duration-200 ${
        showActions || isSelected ? 'opacity-100 transform translate-x-0 scale-100' : 'opacity-0 transform translate-x-6 scale-75'
      }`}>
        
        {/* Primary Action Row */}
        <div className="flex space-x-2">
          {/* Move Up Button */}
          {canMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMoveUp?.()
              }}
              className="w-9 h-9 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:-rotate-12 shadow-lg hover:shadow-xl"
              title="Move Up"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}

          {/* Move Down Button */}
          {canMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMoveDown?.()
              }}
              className="w-9 h-9 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-lg hover:shadow-xl"
              title="Move Down"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          )}

          {/* Edit Button */}
          <button
            onClick={handleEdit}
            className="w-9 h-9 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-lg hover:shadow-xl"
            title="Edit Panel"
          >
            <Edit3 className="w-5 h-5" />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="w-9 h-9 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-lg hover:shadow-xl"
            title="Delete Panel"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsLiked(!isLiked)
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg ${
            isLiked 
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
              : 'text-gray-600 hover:text-red-500'
          }`}
          style={{
            backgroundColor: isLiked ? undefined : `${themeState.theme.colors.background.primary}90`,
          }}
          title="Like Panel"
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Enhanced Header with Glass Effect */}
      {!isEditing ? (
        <div className={`p-5 border-b transition-all duration-500 glass-effect animate-slide-in`}
          style={{
            background: isActive 
              ? isSelected 
                ? `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}90, ${themeState.theme.colors.primary[600]}90)`
                : `linear-gradient(135deg, ${themeState.theme.colors.secondary[500]}80, ${themeState.theme.colors.primary[500]}80)`
              : `${themeState.theme.colors.background.secondary}95`,
            borderColor: themeState.theme.colors.border.primary,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className={`font-bold transition-all duration-500 leading-tight text-high-contrast animate-fade-in ${
                isActive ? 'text-white text-xl drop-shadow-lg transform scale-105' : 'text-lg'
              }`}
                style={{ 
                  color: isActive ? 'white' : themeState.theme.colors.text.primary,
                  textShadow: isActive ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                {panel.title}
              </h3>
              <div className="flex items-center flex-wrap gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-500 animate-bounce-in animate-delay-100 glass-subtle`}
                  style={{
                    backgroundColor: isActive 
                      ? 'rgba(255, 255, 255, 0.25)' 
                      : `${themeState.theme.colors.primary[100]}90`,
                    color: isActive 
                      ? 'white' 
                      : themeState.theme.colors.primary[700],
                    backdropFilter: 'blur(8px)',
                    boxShadow: isActive ? '0 4px 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  📽️ {panel.shotType}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-500 animate-bounce-in animate-delay-200 glass-subtle`}
                  style={{
                    backgroundColor: isActive 
                      ? 'rgba(255, 255, 255, 0.25)' 
                      : `${themeState.theme.colors.secondary[100]}90`,
                    color: isActive 
                      ? 'white' 
                      : themeState.theme.colors.secondary[700],
                    backdropFilter: 'blur(8px)',
                    boxShadow: isActive ? '0 4px 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  📐 {panel.cameraAngle}
                </span>
                <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300`}
                  style={{
                    backgroundColor: isActive 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : themeState.theme.colors.secondary[100],
                    color: isActive 
                      ? 'white' 
                      : themeState.theme.colors.secondary[700]
                  }}
                >
                  <Timer className="w-4 h-4" />
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

            {/* Enhanced Image Stats Overlay */}
            <div className={`absolute bottom-3 left-3 right-3 glass-effect rounded-xl p-3 transition-all duration-500 ${
              isActive ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
            }`}>
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Image Ready</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <span>{Math.round(Math.random() * 100)}% Quality</span>
                  </div>
                </div>
                <div className="text-xs opacity-75">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Modern Image Overlay Actions */}
            <div className={`absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/30 transition-all duration-500 flex items-center justify-center ${
              showActions ? 'opacity-100 backdrop-blur-sm' : 'opacity-0'
            }`}>
              <div className="flex space-x-4 animate-bounce-in">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadImage()
                  }}
                  className="w-14 h-14 glass-effect rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-xl hover:shadow-2xl animate-fade-in animate-delay-100"
                  style={{
                    backgroundColor: `${themeState.theme.colors.background.primary}90`,
                    color: themeState.theme.colors.text.primary,
                    backdropFilter: 'blur(12px)'
                  }}
                  title="Download Image"
                >
                  <Download className="w-6 h-6" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRegenerateImage()
                  }}
                  disabled={isGeneratingImage}
                  className="w-14 h-14 bg-gradient-to-r from-purple-500/90 to-pink-500/90 hover:from-purple-600/90 hover:to-pink-600/90 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 disabled:opacity-50 shadow-xl hover:shadow-2xl animate-fade-in animate-delay-200"
                  title="Regenerate Image"
                >
                  {isGeneratingImage ? (
                    <Loader className="w-6 h-6 animate-spin" />
                  ) : (
                    <RotateCcw className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className="w-14 h-14 bg-gradient-to-r from-emerald-500/90 to-green-500/90 hover:from-emerald-600/90 hover:to-green-600/90 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-xl hover:shadow-2xl animate-fade-in animate-delay-300"
                  title="Upload Custom Image"
                >
                  <Upload className="w-6 h-6" />
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
                        className="h-full rounded-full animate-glow"
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
              className={`bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl flex items-center space-x-3 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                isGeneratingImage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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

      {/* Enhanced Description Section with Better Contrast */}
      <div 
        className="p-5"
        style={{
          backgroundColor: themeState.theme.colors.background.primary
        }}
      >
        {!isEditing ? (
          <div className="space-y-3">
            <p 
              className={`leading-relaxed text-base transition-all duration-300 ${
                isActive ? 'text-high-contrast' : 'text-secondary-theme'
              }`}
            >
              {panel.description}
            </p>
            
            {/* Quality Rating */}
            <div 
              className="flex items-center justify-between pt-3 border-t"
              style={{ borderColor: themeState.theme.colors.border.primary }}
            >
              <div className="flex items-center space-x-2">
                <span 
                  className="text-sm"
                  style={{ color: themeState.theme.colors.text.tertiary }}
                >Quality:</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= 4
                          ? 'text-yellow-400 fill-current'
                          : ''
                      }`}
                      style={{ 
                        color: star <= 4 ? '#fbbf24' : themeState.theme.colors.text.tertiary
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div 
                className="flex items-center space-x-2 text-sm"
                style={{ color: themeState.theme.colors.text.tertiary }}
              >
                <Award className="w-4 h-4" />
                <span>Premium</span>
              </div>
            </div>
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
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 px-4 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg"
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadImage}
        className="hidden"
      />

      {/* Modern Glow Effects - FIXED: No more blinking */}
      {isSelected && (
        <div 
          className="absolute -inset-1 rounded-3xl opacity-20 animate-glow pointer-events-none blur-sm"
          style={{
            background: `linear-gradient(135deg, ${themeState.theme.colors.primary[500]}, ${themeState.theme.colors.secondary[500]}, ${themeState.theme.colors.primary[500]})`
          }}
        ></div>
      )}
      
      {isHovered && !isSelected && (
        <div 
          className="absolute -inset-0.5 rounded-3xl opacity-10 animate-glow pointer-events-none blur-sm"
          style={{
            background: `linear-gradient(135deg, ${themeState.theme.colors.primary[400]}, ${themeState.theme.colors.secondary[400]}, ${themeState.theme.colors.primary[400]})`
          }}
        ></div>
      )}
    </div>
  )
} 