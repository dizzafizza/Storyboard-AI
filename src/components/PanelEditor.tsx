import { useState, useEffect } from 'react'
import { X, Upload, Clock, Camera, Film, Save, Video, Copy, Check } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import type { StoryboardPanel, ShotType, CameraAngle } from '../types'
import ContextualTips from './ContextualTips'
import WindowFrame from './WindowFrame'

interface PanelEditorProps {
  panel: StoryboardPanel | null
  isOpen: boolean
  onClose: () => void
}

const shotTypes: Array<{ value: ShotType; label: string; description: string }> = [
  { value: 'extreme-close-up', label: 'Extreme Close-up', description: 'Very tight framing on subject details' },
  { value: 'close-up', label: 'Close-up', description: 'Tight framing focusing on subject' },
  { value: 'medium-shot', label: 'Medium Shot', description: 'Subject from waist up' },
  { value: 'wide-shot', label: 'Wide Shot', description: 'Subject and surroundings visible' },
  { value: 'over-the-shoulder', label: 'Over-the-shoulder', description: 'Conversation perspective' },
  { value: 'two-shot', label: 'Two Shot', description: 'Two subjects in frame' },
  { value: 'establishing-shot', label: 'Establishing Shot', description: 'Sets scene location and context' }
]

const cameraAngles: Array<{ value: CameraAngle; label: string; description: string }> = [
  { value: 'eye-level', label: 'Eye Level', description: 'Camera at subject eye height' },
  { value: 'high-angle', label: 'High Angle', description: 'Camera above subject looking down' },
  { value: 'low-angle', label: 'Low Angle', description: 'Camera below subject looking up' },
  { value: 'birds-eye-view', label: 'Bird\'s Eye', description: 'Directly overhead view' },
  { value: 'worms-eye-view', label: 'Worm\'s Eye', description: 'Directly below looking up' },
  { value: 'dutch-angle', label: 'Dutch Angle', description: 'Tilted camera for dramatic effect' }
]

export default function PanelEditor({ panel, isOpen, onClose }: PanelEditorProps) {
  const { dispatch } = useStoryboard()
  const { state: themeState } = useTheme()
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shotType: 'medium-shot' as ShotType,
    cameraAngle: 'eye-level' as CameraAngle,
    notes: '',
    duration: 3,
  })

  useEffect(() => {
    if (panel && isOpen) {
      setIsLoading(true)
      setTimeout(() => {
        setFormData({
          title: panel.title || '',
          description: panel.description || '',
          shotType: panel.shotType || 'medium-shot',
          cameraAngle: panel.cameraAngle || 'eye-level',
          notes: panel.notes || '',
          duration: panel.duration || 3,
        })
        setIsLoading(false)
      }, 100)
    } else if (isOpen && !panel) {
      setIsLoading(true)
    }
  }, [panel, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        shotType: 'medium-shot' as ShotType,
        cameraAngle: 'eye-level' as CameraAngle,
        notes: '',
        duration: 3,
      })
      setCopiedPrompt(false)
      setIsLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    console.log('PanelEditor - Panel data:', panel)
    console.log('PanelEditor - Is open:', isOpen)
    console.log('PanelEditor - Form data:', formData)
  }, [panel, isOpen, formData])

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('Please enter a panel title')
      return
    }

    if (!panel) {
      // Create new panel
      const newPanel = {
        id: `panel-${Date.now()}`,
        ...formData,
        order: 0, // Will be set correctly by the context
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      dispatch({
        type: 'ADD_PANEL',
        payload: newPanel,
      })
    } else {
      // Update existing panel
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
    }
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
      // Check file size - show warning for large files
      if (file.size > 50 * 1024 * 1024) { // 50MB
        if (!confirm(`This video is large (${(file.size / (1024 * 1024)).toFixed(1)}MB) and may cause performance issues. Continue?`)) {
          return;
        }
      }
      
      const reader = new FileReader()
      
      // Add loading state
      setIsLoading(true)
      
      reader.onload = (e) => {
        try {
          const videoUrl = e.target?.result as string
          console.log(`📹 Video loaded, size: ${(videoUrl.length / (1024 * 1024)).toFixed(2)}MB`)
          
          dispatch({
            type: 'UPDATE_PANEL',
            payload: {
              id: panel.id,
              updates: { videoUrl },
            },
          })
          
          setIsLoading(false)
        } catch (error) {
          console.error('Failed to process video:', error)
          alert('Failed to process the video. It may be too large or in an unsupported format.')
          setIsLoading(false)
        }
      }
      
      reader.onerror = () => {
        console.error('File reading error:', reader.error)
        alert('Error reading the video file. Please try a different file or format.')
        setIsLoading(false)
      }
      
      reader.readAsDataURL(file)
    }
  }

  const copyPromptToClipboard = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen) return null

  if (isOpen && !panel) {
    return (
      <WindowFrame
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Panel"
        subtitle="Loading..."
        icon={<Film className="w-5 h-5" />}
        defaultWidth="min(90vw, 1000px)"
        defaultHeight="min(90vh, 800px)"
        maxWidth="98vw"
        maxHeight="98vh"
        resizable={true}
        minimizable={true}
        maximizable={true}
        windowId="panel-editor-loading"
      >
        <div className="h-full flex items-center justify-center bg-primary">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-primary font-medium">Loading panel data...</p>
          </div>
        </div>
      </WindowFrame>
    )
  }

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={onClose}
      title={panel ? `Edit Panel ${panel.order + 1}` : 'Create New Panel'}
      subtitle={panel?.title || 'New Panel'}
      icon={<Film className="w-5 h-5" />}
                      defaultWidth="min(90vw, 1000px)"
        defaultHeight="min(90vh, 800px)"
        maxWidth="98vw"
        maxHeight="98vh"
      resizable={true}
      minimizable={true}
      maximizable={true}
      windowId={`panel-editor-${panel?.id || 'new'}`}
    >
      <div className="h-full flex flex-col bg-primary">
        {isLoading && (
          <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-primary font-medium">Loading panel content...</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="panel-editor-grid">
            {/* Left Column - Image and Sketch */}
            <div className="space-y-4 panel-editor-content">
              <h3 className="font-medium text-primary flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>Visual Content</span>
              </h3>
              
              <div className="aspect-video bg-secondary rounded-lg border-2 border-dashed border-secondary flex items-center justify-center relative overflow-hidden">
                {panel?.imageUrl ? (
                  <img
                    src={panel.imageUrl}
                    alt={panel.title || 'Panel image'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-12 h-12 text-secondary mx-auto mb-2" />
                    <p className="text-sm text-secondary mb-2">Add image or sketch</p>
                    <label className="btn-primary cursor-pointer inline-flex items-center">
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
                
                {panel?.imageUrl && (
                  <label className="absolute top-2 right-2 bg-primary p-2 rounded-lg shadow-md cursor-pointer hover:bg-secondary transition-colors">
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
                
                {panel?.videoUrl ? (
                  <div className="space-y-2">
                    <video
                      src={panel.videoUrl}
                      controls
                      className="w-full rounded-lg"
                      style={{ maxHeight: '200px' }}
                      onError={(e) => {
                        console.error('Video loading error:', e);
                        alert('There was an error loading the video. The file might be corrupt or too large.');
                      }}
                    />
                    <label className="btn-secondary text-xs cursor-pointer inline-flex items-center">
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
                  <div className="space-y-2">
                    <label className="btn-secondary text-xs cursor-pointer inline-flex items-center w-full justify-center">
                      <Upload className="w-3 h-3 mr-1" />
                      Upload Video
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-secondary mt-2">
                      Recommended formats: MP4, WebM (smaller files work best)
                    </p>
                  </div>
                )}
              </div>



              {/* AI Generated Video Prompt */}
              {panel?.aiGeneratedPrompt && (
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
            <div className="space-y-4 panel-editor-content">
              <div className="flex items-center justify-between">
                <h3 
                  className="font-medium flex items-center space-x-2 text-primary"
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
                  className="input-modern w-full"
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
                  className="textarea-modern w-full"
                  placeholder="Describe what happens in this panel..."
                />
              </div>

              {/* Shot Type */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Shot Type</label>
                <select
                  value={formData.shotType}
                  onChange={(e) => setFormData(prev => ({ ...prev, shotType: e.target.value as ShotType }))}
                  className="select-modern w-full"
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
                  className="select-modern w-full"
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
                  className="input-modern w-full"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Director's Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="textarea-modern w-full"
                  placeholder="Additional notes, lighting, mood, etc..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex justify-end space-x-3 p-6 border-t border-primary"
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
            <span>{panel ? 'Save Changes' : 'Create Panel'}</span>
          </button>
        </div>
      </div>
    </WindowFrame>
  )
} 