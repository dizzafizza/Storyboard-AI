import { useState, useEffect } from 'react'
import { X, Key, Download, Upload, Zap, Eye, Monitor, Save, AlertCircle, CheckCircle, Settings as SettingsIcon, Palette, Globe, Cpu } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { aiService } from '../services/ai'
import { storage } from '../utils/storage'
import WindowFrame from './WindowFrame'

interface SettingsMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenThemeSettings?: () => void
}

interface Settings {
  openaiApiKey: string
  autoSave: boolean
  notifications: boolean
  videoQuality: 'standard' | 'high' | 'ultra'
  exportFormat: 'json' | 'pdf' | 'video'
  aiModel: 'gpt-4' | 'gpt-4o' | 'gpt-4o-mini'
  imageModel: 'dall-e-2' | 'dall-e-3'
  maxTokens: number
  temperature: number
  language: 'en' | 'es' | 'fr' | 'de' | 'ja'
}

export default function SettingsMenu({ isOpen, onClose, onOpenThemeSettings }: SettingsMenuProps) {
  const { state: themeState } = useTheme()
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'themes' | 'advanced'>('general')
  const [settings, setSettings] = useState<Settings>({
    openaiApiKey: '',
    autoSave: true,
    notifications: true,
    videoQuality: 'high',
    exportFormat: 'json',
    aiModel: 'gpt-4o-mini',
    imageModel: 'dall-e-3',
    maxTokens: 4096,
    temperature: 0.7,
    language: 'en'
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [apiKeyVisible, setApiKeyVisible] = useState(false)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await storage.getSettings()
      const currentApiKey = aiService.getApiKey()
      
      setSettings(prev => ({
        ...prev,
        openaiApiKey: currentApiKey || '',
        ...savedSettings,
        autoSave: savedSettings.autoSave ?? true
      }))
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    setSaveStatus('saving')
    try {
      // Save API key to AI service
      if (settings.openaiApiKey.trim()) {
        aiService.setApiKey(settings.openaiApiKey.trim())
      }

      // Save settings (theme is handled by separate ThemeSettings component)
      await storage.saveSettings({
        autoSave: settings.autoSave,
        notifications: settings.notifications,
        videoQuality: settings.videoQuality,
        exportFormat: settings.exportFormat,
        aiModel: settings.aiModel,
        imageModel: settings.imageModel,
        maxTokens: settings.maxTokens,
        temperature: settings.temperature,
        language: settings.language,
        lastUsed: new Date()
      })

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleExportSettings = () => {
    const exportData = {
      settings: {
        ...settings,
        openaiApiKey: '' // Don't export API key for security
      },
      exportedAt: new Date(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'storyboard-settings-export.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        if (importData.settings) {
          setSettings(prev => ({
            ...prev,
            ...importData.settings,
            openaiApiKey: prev.openaiApiKey // Keep existing API key
          }))
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
      } catch (error) {
        console.error('Error importing settings:', error)
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    }
    reader.readAsText(file)
  }

  const resetToDefaults = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      setSettings({
        openaiApiKey: settings.openaiApiKey, // Keep API key
        autoSave: true,
        notifications: true,
        videoQuality: 'high',
        exportFormat: 'json',
        aiModel: 'gpt-4o-mini',
        imageModel: 'dall-e-3',
        maxTokens: 4096,
        temperature: 0.7,
        language: 'en'
      })
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'general', label: 'General', icon: Monitor, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'ai', label: 'AI Settings', icon: Zap, gradient: 'from-purple-500 to-pink-500' },
    { id: 'themes', label: 'Themes', icon: Palette, gradient: 'from-pink-500 to-rose-500' },
    { id: 'advanced', label: 'Advanced', icon: Key, gradient: 'from-orange-500 to-red-500' }
  ]

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      subtitle="Customize application settings"
      icon={<SettingsIcon className="w-5 h-5" />}
      defaultWidth="min(95vw, 900px)"
      defaultHeight="min(90vh, 700px)"
      maxWidth="98vw"
      maxHeight="98vh"
      resizable={true}
      minimizable={true}
      maximizable={true}
      windowId="settings-menu"
      zIndex={9100}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto scrollable" style={{ backgroundColor: themeState.theme.colors.background.secondary }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* API Settings */}
            <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div>
                <h4 className="font-medium text-primary mb-2 sm:mb-3">AI API Settings</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WindowFrame>
  )
} 