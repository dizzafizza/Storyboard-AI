import { useState, useEffect } from 'react'
import { X, Key, Download, Upload, Zap, Eye, Monitor, Save, AlertCircle, CheckCircle, Settings as SettingsIcon, Palette, Globe, Cpu } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { aiService } from '../services/ai'
import { storage } from '../utils/storage'

interface SettingsMenuProps {
  isOpen: boolean
  onClose: () => void
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

export default function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { state: themeState } = useTheme()
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'advanced'>('general')
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
    { id: 'advanced', label: 'Advanced', icon: Key, gradient: 'from-orange-500 to-red-500' }
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-primary/95 backdrop-blur-xl rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border border-primary/20 animate-scale-in"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(var(--primary), 0.95), rgba(var(--secondary), 0.9))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 100px rgba(var(--primary), 0.1)',
          transform: 'translateZ(0)'
        }}
      >
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/20 bg-secondary/30 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center shadow-lg animate-float">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
                Settings & Preferences
              </h2>
              <p className="text-sm text-secondary/80 mt-1">
                Configure your workspace • AI models • Export settings
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Save Status Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
              saveStatus === 'saving' && 'bg-blue-500/20 text-blue-400' ||
              saveStatus === 'saved' && 'bg-green-500/20 text-green-400' ||
              saveStatus === 'error' && 'bg-red-500/20 text-red-400' ||
              'bg-tertiary/50 text-secondary'
            }`}>
              {saveStatus === 'saving' && <Cpu className="w-4 h-4 animate-spin" />}
              {saveStatus === 'saved' && <CheckCircle className="w-4 h-4" />}
              {saveStatus === 'error' && <AlertCircle className="w-4 h-4" />}
              {saveStatus === 'idle' && <Save className="w-4 h-4" />}
              <span className="text-xs font-medium">
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && 'Saved'}
                {saveStatus === 'error' && 'Error'}
                {saveStatus === 'idle' && 'Ready'}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-3 hover:bg-tertiary/50 rounded-xl transition-all duration-300 border border-transparent hover:border-primary/30 hover:shadow-lg group"
            >
              <X className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

        <div className="flex h-full max-h-[80vh]">
          {/* Enhanced Sidebar Navigation */}
          <div className="w-72 border-r border-primary/20 p-6 bg-secondary/20 backdrop-blur-sm">
            <nav className="space-y-3">
              {tabs.map(({ id, label, icon: Icon, gradient }, index) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as 'general' | 'ai' | 'advanced')}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 group ${
                    activeTab === id
                      ? 'bg-gradient-to-r ' + gradient + ' text-white shadow-lg transform scale-105'
                      : 'text-secondary hover:text-primary hover:bg-tertiary/30'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    transform: activeTab === id ? 'scale(1.05) translateZ(0)' : 'translateZ(0)'
                  }}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-medium">{label}</span>
                  {activeTab === id && (
                    <div className="w-2 h-2 bg-white rounded-full ml-auto animate-pulse" />
                  )}
                </button>
              ))}
            </nav>

            {/* Quick Actions */}
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-semibold text-secondary/80 uppercase tracking-wider">Quick Actions</h3>
              
              <button
                onClick={handleExportSettings}
                className="w-full flex items-center space-x-3 p-3 rounded-lg bg-tertiary/30 hover:bg-tertiary/50 transition-all duration-200 text-secondary hover:text-primary group"
              >
                <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Export Settings</span>
              </button>
              
              <label className="w-full flex items-center space-x-3 p-3 rounded-lg bg-tertiary/30 hover:bg-tertiary/50 transition-all duration-200 text-secondary hover:text-primary cursor-pointer group">
                <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Import Settings</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={resetToDefaults}
                className="w-full flex items-center space-x-3 p-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all duration-200 text-red-400 hover:text-red-300 group"
              >
                <AlertCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Reset to Defaults</span>
              </button>
            </div>
          </div>

          {/* Enhanced Content Area */}
          <div className="flex-1 overflow-y-auto p-6 scrollable bg-primary/30 backdrop-blur-sm">
            {activeTab === 'general' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center space-x-2">
                    <Monitor className="w-5 h-5" />
                    <span>General Preferences</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Auto Save Setting */}
                    <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-primary">Auto Save</h4>
                          <p className="text-sm text-secondary/80 mt-1">Automatically save changes as you work</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, autoSave: !prev.autoSave }))}
                          className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                            settings.autoSave ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                            settings.autoSave ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Notifications Setting */}
                    <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-primary">Notifications</h4>
                          <p className="text-sm text-secondary/80 mt-1">Show system notifications and alerts</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                          className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                            settings.notifications ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                            settings.notifications ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Language Setting */}
                    <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <div>
                        <h4 className="font-medium text-primary mb-3 flex items-center space-x-2">
                          <Globe className="w-4 h-4" />
                          <span>Language</span>
                        </h4>
                        <select
                          value={settings.language}
                          onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value as any }))}
                          className="select-modern w-full bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                          <option value="ja">日本語</option>
                        </select>
                      </div>
                    </div>

                    {/* Export Format Setting */}
                    <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <div>
                        <h4 className="font-medium text-primary mb-3">Default Export Format</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {['json', 'pdf', 'video'].map((format) => (
                            <button
                              key={format}
                              onClick={() => setSettings(prev => ({ ...prev, exportFormat: format as any }))}
                              className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                settings.exportFormat === format
                                  ? 'bg-primary text-white shadow-lg'
                                  : 'bg-tertiary/50 text-secondary hover:bg-tertiary hover:text-primary'
                              }`}
                            >
                              {format.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>AI Configuration</span>
                  </h3>
                  
                  <div className="space-y-6">
                    {/* API Key Section */}
                    <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-primary flex items-center space-x-2">
                          <Key className="w-4 h-4" />
                          <span>OpenAI API Key</span>
                        </h4>
                        <button
                          onClick={() => setApiKeyVisible(!apiKeyVisible)}
                          className="flex items-center space-x-1 text-secondary hover:text-primary transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">{apiKeyVisible ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={apiKeyVisible ? 'text' : 'password'}
                        value={settings.openaiApiKey}
                        onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                        placeholder="sk-..."
                        className="input-modern w-full bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                      />
                      <p className="text-xs text-secondary/80 mt-2">
                        Your API key is stored locally and never shared. Get one from{' '}
                        <a 
                          href="https://platform.openai.com/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:text-secondary underline"
                        >
                          OpenAI Platform
                        </a>
                      </p>
                    </div>

                    {/* AI Models */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                        <h4 className="font-medium text-primary mb-3">Text Generation Model</h4>
                        <select
                          value={settings.aiModel}
                          onChange={(e) => setSettings(prev => ({ ...prev, aiModel: e.target.value as any }))}
                          className="select-modern w-full bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                        >
                          <option value="gpt-4o-mini">GPT-4o Mini (Fast & Economic)</option>
                          <option value="gpt-4o">GPT-4o (Balanced)</option>
                          <option value="gpt-4">GPT-4 (Most Capable)</option>
                        </select>
                      </div>

                      <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                        <h4 className="font-medium text-primary mb-3">Image Generation Model</h4>
                        <select
                          value={settings.imageModel}
                          onChange={(e) => setSettings(prev => ({ ...prev, imageModel: e.target.value as any }))}
                          className="select-modern w-full bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                        >
                          <option value="dall-e-3">DALL-E 3 (Best Quality)</option>
                          <option value="dall-e-2">DALL-E 2 (Faster)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center space-x-2">
                    <Key className="w-5 h-5" />
                    <span>Advanced Settings</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Max Tokens */}
                    <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <h4 className="font-medium text-primary mb-3">Max Tokens</h4>
                      <input
                        type="range"
                        min="1000"
                        max="8000"
                        step="500"
                        value={settings.maxTokens}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-sm text-secondary mt-2">
                        <span>1000</span>
                        <span className="font-medium">{settings.maxTokens}</span>
                        <span>8000</span>
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <h4 className="font-medium text-primary mb-3">Creativity (Temperature)</h4>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-sm text-secondary mt-2">
                        <span>0 (Focused)</span>
                        <span className="font-medium">{settings.temperature}</span>
                        <span>1 (Creative)</span>
                      </div>
                    </div>

                    {/* Video Quality */}
                    <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <h4 className="font-medium text-primary mb-3">Video Export Quality</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {['standard', 'high', 'ultra'].map((quality) => (
                          <button
                            key={quality}
                            onClick={() => setSettings(prev => ({ ...prev, videoQuality: quality as any }))}
                            className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              settings.videoQuality === quality
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-tertiary/50 text-secondary hover:bg-tertiary hover:text-primary'
                            }`}
                          >
                            {quality.charAt(0).toUpperCase() + quality.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="flex justify-between items-center p-6 border-t border-primary/20 bg-secondary/30 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-sm text-secondary">
            <Palette className="w-4 h-4" />
            <span>Settings are saved automatically</span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
              className="btn-primary px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary px-6 py-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 