import { useState, useEffect } from 'react'
import { X, Upload, Clock, Camera, Film, Save, Video, Copy, Check } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import type { StoryboardPanel, ShotType, CameraAngle } from '../types'
import ContextualTips from './ContextualTips'

interface PanelEditorProps {
  panel: StoryboardPanel | null
  isOpen: boolean
  onClose: () => void
}

const shotTypes: { value: ShotType; label: string; description: string }[] = [
  { value: 'wide-shot', label: 'Wide Shot', description: 'Shows full scene and environment' },
  { value: 'medium-shot', label: 'Medium Shot', description: 'Shows character from waist up' },
  { value: 'close-up', label: 'Close-up', description: 'Focuses on face or important details' },
  { value: 'extreme-close-up', label: 'Extreme Close-up', description: 'Very tight focus on specific detail' },
  { value: 'over-the-shoulder', label: 'Over Shoulder', description: 'Shot over one person\'s shoulder' },
  { value: 'two-shot', label: 'Two Shot', description: 'Shows two characters in frame' },
  { value: 'establishing-shot', label: 'Establishing Shot', description: 'Sets location and context' },
]

const cameraAngles: { value: CameraAngle; label: string; description: string }[] = [
  { value: 'eye-level', label: 'Eye Level', description: 'Natural perspective at character\'s eye height' },
  { value: 'high-angle', label: 'High Angle', description: 'Camera positioned above subject' },
  { value: 'low-angle', label: 'Low Angle', description: 'Camera positioned below subject' },
  { value: 'birds-eye-view', label: 'Bird\'s Eye', description: 'Directly overhead view' },
  { value: 'worms-eye-view', label: 'Worm\'s Eye', description: 'Directly below looking up' },
  { value: 'dutch-angle', label: 'Dutch Angle', description: 'Tilted camera for dramatic effect' },
]

export default function PanelEditor({ panel, isOpen, onClose }: PanelEditorProps) {
  const { dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shotType: 'medium-shot' as ShotType,
    cameraAngle: 'eye-level' as CameraAngle,
    notes: '',
    duration: 3,
  })
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  useEffect(() => {
    if (panel) {
      setFormData({
        title: panel.title,
        description: panel.description,
        shotType: panel.shotType,
        cameraAngle: panel.cameraAngle,
        notes: panel.notes,
        duration: panel.duration || 3,
      })
    }
  }, [panel])

  const handleSave = () => {
    if (!panel) return

    dispatch({
      type: 'UPDATE_PANEL',
      payload: {
        id: panel.id,
        updates: {
          ...formData,
          updatedAt: new Date(),
        },
      },
    })
    onClose()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && panel) {
      // In a real app, you'd upload to a server
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        dispatch({
          type: 'UPDATE_PANEL',
          payload: {
            id: panel.id,
            updates: { imageUrl },
          },
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && panel) {
      // Check if it's a video file
      if (file.type.startsWith('video/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const videoUrl = e.target?.result as string
          dispatch({
            type: 'UPDATE_PANEL',
            payload: {
              id: panel.id,
              updates: { videoUrl },
            },
          })
        }
        reader.readAsDataURL(file)
      } else {
        alert('Please select a valid video file.')
      }
    }
  }

  const copyPromptToClipboard = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (!isOpen || !panel) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-primary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollable">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary">
          <h2 className="text-xl font-semibold text-primary">Edit Panel {panel.order + 1}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Image and Sketch */}
          <div className="space-y-4">
            <h3 className="font-medium text-primary flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Visual Content</span>
            </h3>
            
            <div className="aspect-video bg-secondary rounded-lg border-2 border-dashed border-secondary flex items-center justify-center relative overflow-hidden">
              {panel.imageUrl ? (
                <img
                  src={panel.imageUrl}
                  alt={panel.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Camera className="w-12 h-12 text-secondary mx-auto mb-2" />
                  <p className="text-sm text-secondary mb-2">Add image or sketch</p>
                  <label className="btn-primary cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
              
              {panel.imageUrl && (
                <label className="absolute top-2 right-2 bg-primary p-2 rounded-lg shadow-md cursor-pointer hover:bg-secondary">
                  <Upload className="w-4 h-4 text-secondary" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Video Upload Section */}
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Video className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-primary">Video Content</span>
              </div>
              
              {panel.videoUrl ? (
                <div className="space-y-2">
                  <video
                    src={panel.videoUrl}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '200px' }}
                  />
                  <label className="btn-secondary text-xs cursor-pointer">
                    <Upload className="w-3 h-3 mr-1" />
                    Replace Video
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label 
                  className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
                  style={{
                    borderColor: themeState.theme.colors.border.secondary,
                    color: themeState.theme.colors.text.secondary
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = themeState.theme.colors.background.tertiary
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Video 
                      className="w-6 h-6 mb-1"
                      style={{ color: themeState.theme.colors.text.secondary }}
                    />
                    <span 
                      className="text-xs"
                      style={{ color: themeState.theme.colors.text.secondary }}
                    >
                      Upload video preview
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* AI Generated Video Prompt */}
            {panel.aiGeneratedPrompt && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Film className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">AI Video Prompt</span>
                  </div>
                  <button
                    onClick={() => copyPromptToClipboard(panel.aiGeneratedPrompt!)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-green-700 leading-relaxed">
                  {panel.aiGeneratedPrompt}
                </p>
                <p className="text-xs text-green-600 mt-2 opacity-75">
                  Use this prompt with Runway ML, Pika Labs, or other AI video generation tools
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Panel Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                          <h3 
              className="font-medium flex items-center space-x-2"
              style={{ color: themeState.theme.colors.text.primary }}
            >
              <Film className="w-4 h-4" />
              <span>Panel Details</span>
            </h3>
            </div>
            
            {/* Contextual Tips */}
            <ContextualTips context="panel-editing" className="text-xs" />

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-modern"
                placeholder="Panel title..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="textarea-modern"
                placeholder="Describe what happens in this panel..."
              />
            </div>

            {/* Shot Type */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Shot Type</label>
              <select
                value={formData.shotType}
                onChange={(e) => setFormData(prev => ({ ...prev, shotType: e.target.value as ShotType }))}
                className="select-modern"
              >
                {shotTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera Angle */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Camera Angle</label>
              <select
                value={formData.cameraAngle}
                onChange={(e) => setFormData(prev => ({ ...prev, cameraAngle: e.target.value as CameraAngle }))}
                className="select-modern"
              >
                {cameraAngles.map(angle => (
                  <option key={angle.value} value={angle.value}>
                    {angle.label} - {angle.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration (seconds)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                min="1"
                max="60"
                className="input-modern"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Director's Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="textarea-modern"
                placeholder="Additional notes, lighting, mood, etc..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex justify-end space-x-3 p-6 border-t"
          style={{ borderColor: themeState.theme.colors.border.primary }}
        >
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  )
} 