import { useState, useEffect } from 'react'
import { X, Key, Download, Upload, Zap, Eye, Monitor, Save, AlertCircle, CheckCircle, Settings as SettingsIcon, Palette, Globe, Cpu, Moon, Sun, Smartphone, Lock, BellRing, RefreshCw, HelpCircle, Database } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { aiService } from '../services/ai'
import { storage, resetStoryboardDatabase } from '../utils/storage'
import { useSemanticColors } from '../utils/themeColors'
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
  aiModel: 'gpt-4' | 'gpt-4o' | 'gpt-o4-mini'
  imageModel: 'dall-e-2' | 'dall-e-3'
  maxTokens: number
  temperature: number
  language: 'en' | 'es' | 'fr' | 'de' | 'ja'
  performance: {
    prefetchResources: boolean
    reduceAnimations: boolean
  }
}

export default function SettingsMenu({ isOpen, onClose, onOpenThemeSettings }: SettingsMenuProps) {
  const { state: themeState } = useTheme()
  const semanticColors = useSemanticColors(themeState.theme)
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'themes' | 'advanced'>('general')
  const [settings, setSettings] = useState<Settings>({
    openaiApiKey: '',
    autoSave: true,
    notifications: true,
    videoQuality: 'high',
    exportFormat: 'json',
    aiModel: 'gpt-o4-mini',
    imageModel: 'dall-e-3',
    maxTokens: 4096,
    temperature: 0.7,
    language: 'en',
    performance: {
      prefetchResources: true,
      reduceAnimations: false
    }
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
        // We'll need to update the storage type to include these
        // privacy: settings.privacy,
        // accessibility: settings.accessibility,
        // performance: settings.performance,
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
        aiModel: 'gpt-o4-mini',
        imageModel: 'dall-e-3',
        maxTokens: 4096,
        temperature: 0.7,
        language: 'en',
        performance: {
          prefetchResources: true,
          reduceAnimations: false
        }
      })
    }
  }

  const handleResetDatabase = async () => {
    if (confirm('WARNING: This will reset your database and clear all saved projects.\n\nThis action is recommended if you have issues with video uploads or storage quota errors.\n\nDo you want to proceed?')) {
      try {
        await resetStoryboardDatabase();
        alert('Database has been reset successfully. The page will now reload.');
        window.location.reload();
      } catch (error) {
        console.error('Error resetting database:', error);
        alert('Failed to reset database. Please try closing all tabs and trying again.');
      }
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
      title="Settings & Preferences"
      subtitle="Configure your workspace • AI models • Export settings"
      icon={<SettingsIcon className="w-5 h-5" />}
                defaultWidth="min(95vw, 800px)"
      defaultHeight="min(85vh, 600px)"
      minWidth={280}
      minHeight={320}
      maxWidth="98vw"
      maxHeight="92vh"
      resizable={true}
      minimizable={true}
      maximizable={true}
      windowId="settings-menu"
      zIndex={9100}
    >
      {/* Save Status Bar */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{
            borderColor: `${themeState.theme.colors.border.primary}80`,
            backgroundColor: `${themeState.theme.colors.background.secondary}80`
          }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${themeState.theme.colors.primary[600]}, ${themeState.theme.colors.primary[700]})`
              }}
            >
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <div 
              className="text-sm"
              style={{ color: themeState.theme.colors.text.secondary }}
            >
              Customize your Storyboard AI experience
            </div>
          </div>

          {/* Save Status Indicator */}
          <div 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300"
            style={{
              backgroundColor: saveStatus === 'saving' ? semanticColors.status.info.light :
                              saveStatus === 'saved' ? semanticColors.status.success.light :
                              saveStatus === 'error' ? semanticColors.status.error.light :
                              `${themeState.theme.colors.background.tertiary}50`,
              color: saveStatus === 'saving' ? semanticColors.status.info.background :
                    saveStatus === 'saved' ? semanticColors.status.success.background :
                    saveStatus === 'error' ? semanticColors.status.error.background :
                    themeState.theme.colors.text.secondary
            }}
          >
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
        </div>

      <div className="flex flex-col sm:flex-row h-full max-h-[calc(100%-100px)]">
        {/* Enhanced Sidebar Navigation */}
        <div 
          className="w-full sm:w-40 md:w-48 border-b sm:border-b-0 sm:border-r p-2 sm:p-3 md:p-4 shrink-0 overflow-hidden"
          style={{
            borderColor: `${themeState.theme.colors.border.primary}60`,
            backgroundColor: `${themeState.theme.colors.background.secondary}90`
          }}
        >
          <nav className="flex sm:flex-col space-x-1 sm:space-x-0 sm:space-y-1.5 overflow-x-auto sm:overflow-x-visible w-full flex-nowrap" 
               style={{ 
                 scrollbarWidth: 'none', 
                 msOverflowStyle: 'none',
                 WebkitOverflowScrolling: 'touch'
                }}>
            {/* Hide scrollbar in webkit browsers */}
            {tabs.map(({ id, label, icon: Icon, gradient }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'general' | 'ai' | 'themes' | 'advanced')}
                className="flex-shrink-0 flex items-center justify-center sm:justify-start space-x-1.5 sm:space-x-2 p-2 sm:p-2 md:p-2.5 rounded-md transition-all duration-200 min-w-[70px] sm:min-w-0 sm:w-full text-xs sm:text-sm md:text-base"
                style={{
                  backgroundColor: activeTab === id ? themeState.theme.colors.primary[500] : 'transparent',
                  color: activeTab === id ? '#ffffff' : themeState.theme.colors.text.secondary,
                  boxShadow: activeTab === id ? semanticColors.shadows.md : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== id) {
                    e.currentTarget.style.backgroundColor = `${themeState.theme.colors.background.tertiary}80`
                    e.currentTarget.style.color = themeState.theme.colors.text.primary
                    e.currentTarget.style.boxShadow = semanticColors.shadows.sm
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = themeState.theme.colors.text.secondary
                  }
                }}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-medium whitespace-nowrap">{label}</span>
              </button>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="mt-4 sm:mt-6 space-y-2">
            <h3 
              className="text-xs sm:text-sm font-semibold uppercase tracking-wider"
              style={{ color: themeState.theme.colors.text.secondary }}
            >
              Quick Actions
            </h3>
            
            <button
              onClick={handleExportSettings}
              className="w-full flex items-center space-x-2 p-2 sm:p-2.5 rounded-md transition-all duration-200 group"
              style={{
                backgroundColor: `${themeState.theme.colors.background.tertiary}60`,
                color: themeState.theme.colors.text.secondary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${themeState.theme.colors.background.tertiary}80`
                e.currentTarget.style.color = themeState.theme.colors.text.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${themeState.theme.colors.background.tertiary}60`
                e.currentTarget.style.color = themeState.theme.colors.text.secondary
              }}
            >
              <Download className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm">Export Settings</span>
            </button>
            
            <label 
              className="w-full flex items-center space-x-2 p-2 sm:p-2.5 rounded-md transition-all duration-200 cursor-pointer group"
              style={{
                backgroundColor: `${themeState.theme.colors.background.tertiary}60`,
                color: themeState.theme.colors.text.secondary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${themeState.theme.colors.background.tertiary}80`
                e.currentTarget.style.color = themeState.theme.colors.text.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${themeState.theme.colors.background.tertiary}60`
                e.currentTarget.style.color = themeState.theme.colors.text.secondary
              }}
            >
              <Upload className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm">Import Settings</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                className="hidden"
              />
            </label>
            
            <button
              onClick={resetToDefaults}
              className="w-full flex items-center space-x-2 p-2 sm:p-2.5 rounded-md bg-red-500/20 hover:bg-red-500/30 transition-all duration-200 text-red-400 hover:text-red-300 group"
            >
              <AlertCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm">Reset to Defaults</span>
            </button>
          </div>

          <div className="flex sm:hidden justify-center w-full py-2 mt-1 px-1">
            <div className="flex items-center space-x-1.5">
              <div className="h-1 w-16 rounded-full bg-primary-500/30"></div>
              <span className="text-xs text-secondary/50">scroll for more tabs</span>
            </div>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div 
          className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 scrollable backdrop-blur-sm"
          style={{
            backgroundColor: `${themeState.theme.colors.background.tertiary}30`,
            color: themeState.theme.colors.text.primary
          }}
        >
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center space-x-1.5 sm:space-x-2"
                  style={{ color: themeState.theme.colors.text.primary }}
                >
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>General Preferences</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  {/* Auto Save Setting */}
                  <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 
                          className="font-medium"
                          style={{ color: themeState.theme.colors.text.primary }}
                        >
                          Auto Save
                        </h4>
                        <p 
                          className="text-sm mt-1"
                          style={{ color: themeState.theme.colors.text.secondary }}
                        >
                          Automatically save changes as you work
                        </p>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, autoSave: !prev.autoSave }))}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                          settings.autoSave ? 'bg-green-500' : 'bg-secondary-400'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                          settings.autoSave ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Notifications Setting */}
                  <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">Notifications</h4>
                        <p className="text-sm text-secondary/80 mt-1">Show system notifications and alerts</p>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                          settings.notifications ? 'bg-blue-500' : 'bg-secondary-400'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                          settings.notifications ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Language Setting */}
                  <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 hover:border-primary/40 transition-all duration-300">
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
                  <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <div>
                      <h4 className="font-medium text-primary mb-3">Default Export Format</h4>
                      <div className="grid grid-cols-3 gap-1 sm:gap-2">
                        {['json', 'pdf', 'video'].map((format) => (
                          <button
                            key={format}
                            onClick={() => setSettings(prev => ({ ...prev, exportFormat: format as any }))}
                            className="p-2 rounded-lg text-sm font-medium transition-all duration-200"
                            style={{
                              backgroundColor: settings.exportFormat === format 
                                ? themeState.theme.colors.primary[500] 
                                : `${themeState.theme.colors.background.tertiary}80`,
                              color: settings.exportFormat === format 
                                ? '#ffffff' 
                                : themeState.theme.colors.text.secondary,
                              boxShadow: settings.exportFormat === format ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (settings.exportFormat !== format) {
                                e.currentTarget.style.backgroundColor = `${themeState.theme.colors.background.tertiary}90`
                                e.currentTarget.style.color = themeState.theme.colors.text.primary
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (settings.exportFormat !== format) {
                                e.currentTarget.style.backgroundColor = `${themeState.theme.colors.background.tertiary}80`
                                e.currentTarget.style.color = themeState.theme.colors.text.secondary
                              }
                            }}
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
                  <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 hover:border-primary/40 transition-all duration-300">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                      <h4 className="font-medium text-primary mb-3">Text Generation Model</h4>
                      <select
                        value={settings.aiModel}
                        onChange={(e) => setSettings(prev => ({ ...prev, aiModel: e.target.value as any }))}
                        className="select-modern w-full bg-tertiary/50 border border-primary/30 focus:border-primary/60"
                      >
                        <optgroup label="Standard Models">
                          <option value="gpt-o4-mini">GPT-o4 Mini (Fast & Economic)</option>
                          <option value="gpt-4o">GPT-4o (Balanced)</option>
                          <option value="gpt-4">GPT-4 (Most Capable)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 hover:border-primary/40 transition-all duration-300">
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

          {activeTab === 'themes' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Theme & Appearance</span>
                </h3>
                
                <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-primary">Theme Settings</h4>
                      <p className="text-sm text-secondary/80 mt-1">Customize your workspace appearance</p>
                    </div>
                    <button
                      onClick={onOpenThemeSettings}
                      className="btn-primary px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Open Theme Selector
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-tertiary/30">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white/30"
                        style={{ backgroundColor: themeState.theme.colors.primary[500] }}
                      />
                      <span className="text-sm font-medium text-primary">Current: {themeState.theme.name}</span>
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  {/* Import/Export Settings */}
                  <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <h4 className="font-medium text-primary mb-3">Import/Export</h4>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 space-x-0 sm:space-x-2">
                      <button 
                        onClick={handleExportSettings}
                        className="btn-secondary px-4 py-2 text-sm flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportSettings}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button className="btn-secondary w-full px-4 py-2 text-sm flex items-center justify-center space-x-2">
                          <Upload className="w-4 h-4" />
                          <span>Import</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reset Settings */}
                  <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <h4 className="font-medium text-primary mb-3">Reset</h4>
                    <button 
                      onClick={resetToDefaults}
                      className="btn-danger px-4 py-2 text-sm w-full flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reset to Defaults</span>
                    </button>
                  </div>

                  {/* Reset Database */}
                  <div className="bg-secondary/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <h4 className="font-medium text-primary mb-3">Reset Database</h4>
                    <button 
                      onClick={handleResetDatabase}
                      className="btn-danger px-4 py-2 text-sm w-full flex items-center justify-center space-x-2"
                    >
                      <Database className="w-4 h-4" />
                      <span>Reset Database</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div 
        className="flex items-center justify-between p-4 border-t" 
        style={{
          borderColor: `${themeState.theme.colors.border.primary}80`,
          backgroundColor: `${themeState.theme.colors.background.secondary}80`
        }}
      >
        {/* Save Status */}
        <div className="text-sm" style={{ color: themeState.theme.colors.text.secondary }}>
          {saveStatus === 'idle' && 'Settings ready'}
          {saveStatus === 'saving' && 'Saving changes...'}
          {saveStatus === 'saved' && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Settings saved!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Error saving settings</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg text-sm"
            style={{ color: themeState.theme.colors.text.secondary }}
          >
            Cancel
          </button>
          <button 
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
            className="px-5 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              backgroundColor: themeState.theme.colors.primary[500],
              color: '#ffffff'
            }}
            onMouseEnter={(e) => {
              if (saveStatus !== 'saving') {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[600]
              }
            }}
            onMouseLeave={(e) => {
              if (saveStatus !== 'saving') {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[500]
              }
            }}
          >
            {saveStatus === 'saving' ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </WindowFrame>
  )
} 