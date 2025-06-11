import { useState, useEffect } from 'react'
import { Save, RotateCcw, Settings } from 'lucide-react'
import WindowFrame from './WindowFrame'

interface AIImageSettingsProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: AIImageSettings) => void
  currentSettings: AIImageSettings
}

export interface AIImageSettings {
  style: string
  quality: string
  aspectRatio: string
  size: string
  model: string
  creativity: number
  artStyle: string
  lighting: string
  mood: string
  colorScheme: string
}

const defaultSettings: AIImageSettings = {
  style: 'photorealistic',
  quality: 'standard',
  aspectRatio: '16:9',
  size: '1024x1024',
  model: 'dall-e-3',
  creativity: 7,
  artStyle: 'cinematic',
  lighting: 'natural',
  mood: 'neutral',
  colorScheme: 'full-color'
}

export default function AIImageSettings({ isOpen, onClose, onSave, currentSettings }: AIImageSettingsProps) {
  const [settings, setSettings] = useState<AIImageSettings>(currentSettings || defaultSettings)

  useEffect(() => {
    setSettings(currentSettings || defaultSettings)
  }, [currentSettings, isOpen])

  const handleSave = () => {
    onSave(settings)
    onClose()
  }

  const handleReset = () => {
    setSettings(defaultSettings)
  }

  const updateSetting = (key: keyof AIImageSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={onClose}
      title="AI Image Generation Settings"
      subtitle="Customize AI image creation parameters"
      icon={<Settings className="w-5 h-5" />}
      defaultWidth="600px"
      defaultHeight="700px"
      minWidth={500}
      minHeight={600}
      maxWidth="800px"
      maxHeight="900px"
      resizable={true}
      minimizable={true}
      maximizable={true}
      windowId="ai-image-settings"
      zIndex={9500}
    >

        {/* Settings Content */}
        <div className="p-6 space-y-6">
          {/* Model Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary">AI Model</label>
            <select
              value={settings.model}
              onChange={(e) => updateSetting('model', e.target.value)}
              className="select-modern w-full"
            >
              <option value="dall-e-3">DALL-E 3</option>
            </select>
            <p className="text-xs text-secondary">DALL-E 3 provides the highest quality images and best prompt adherence (DALL-E 2 has been discontinued)</p>
          </div>

          {/* Image Style */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary">Image Style</label>
            <select
              value={settings.style}
              onChange={(e) => updateSetting('style', e.target.value)}
              className="select-modern w-full"
            >
              <option value="photorealistic">Photorealistic</option>
              <option value="illustration">Illustration</option>
              <option value="cartoon">Cartoon</option>
              <option value="sketch">Sketch</option>
              <option value="artistic">Artistic</option>
              <option value="comic">Comic Book</option>
            </select>
          </div>

          {/* Art Style */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary">Art Style</label>
            <select
              value={settings.artStyle}
              onChange={(e) => updateSetting('artStyle', e.target.value)}
              className="select-modern w-full"
            >
              <option value="cinematic">Cinematic</option>
              <option value="dramatic">Dramatic</option>
              <option value="minimalist">Minimalist</option>
              <option value="vintage">Vintage</option>
              <option value="modern">Modern</option>
              <option value="fantasy">Fantasy</option>
              <option value="noir">Film Noir</option>
            </select>
          </div>

          {/* Quality & Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">Quality</label>
              <select
                value={settings.quality}
                onChange={(e) => updateSetting('quality', e.target.value)}
                className="select-modern w-full"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD (Higher Quality)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">Size</label>
              <select
                value={settings.size}
                onChange={(e) => updateSetting('size', e.target.value)}
                className="select-modern w-full"
              >
                <option value="1024x1024">Square (1024x1024)</option>
                <option value="1792x1024">Landscape (1792x1024)</option>
                <option value="1024x1792">Portrait (1024x1792)</option>
              </select>
            </div>
          </div>

          {/* Lighting & Mood */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">Lighting</label>
              <select
                value={settings.lighting}
                onChange={(e) => updateSetting('lighting', e.target.value)}
                className="select-modern w-full"
              >
                <option value="natural">Natural</option>
                <option value="dramatic">Dramatic</option>
                <option value="soft">Soft</option>
                <option value="golden-hour">Golden Hour</option>
                <option value="moody">Moody</option>
                <option value="bright">Bright</option>
                <option value="low-light">Low Light</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">Mood</label>
              <select
                value={settings.mood}
                onChange={(e) => updateSetting('mood', e.target.value)}
                className="select-modern w-full"
              >
                <option value="neutral">Neutral</option>
                <option value="happy">Happy</option>
                <option value="dramatic">Dramatic</option>
                <option value="mysterious">Mysterious</option>
                <option value="peaceful">Peaceful</option>
                <option value="energetic">Energetic</option>
                <option value="melancholic">Melancholic</option>
              </select>
            </div>
          </div>

          {/* Color Scheme */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary">Color Scheme</label>
            <select
              value={settings.colorScheme}
              onChange={(e) => updateSetting('colorScheme', e.target.value)}
              className="select-modern w-full"
            >
              <option value="full-color">Full Color</option>
              <option value="monochrome">Monochrome</option>
              <option value="warm-tones">Warm Tones</option>
              <option value="cool-tones">Cool Tones</option>
              <option value="sepia">Sepia</option>
              <option value="high-contrast">High Contrast</option>
            </select>
          </div>

          {/* Creativity Slider */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-primary">
              Creativity Level: {settings.creativity}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.creativity}
              onChange={(e) => updateSetting('creativity', parseInt(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-secondary">
              <span>Conservative</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
            <p className="text-xs text-secondary">
              Higher creativity may produce more artistic but less predictable results
            </p>
          </div>

          {/* Preview Text */}
          <div className="bg-secondary p-4 rounded-lg">
            <h4 className="font-medium text-primary mb-2">Style Preview</h4>
            <p className="text-sm text-secondary">
              Your images will be generated as {settings.style} {settings.artStyle} style with {settings.lighting} lighting, 
              {settings.mood} mood, and {settings.colorScheme} colors using {settings.model.toUpperCase()}.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-primary">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
          
          <div className="flex space-x-3">
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
              <span>Save Settings</span>
            </button>
          </div>
        </div>
    </WindowFrame>
  )
} 