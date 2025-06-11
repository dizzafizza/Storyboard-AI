import { useState, useEffect } from 'react'
import { Download, FileText, Image, Film, Globe, Settings, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'
import { mediaExport, type ExportOptions, type ExportProgress } from '../utils/mediaExport'
import { storage } from '../utils/storage'
import WindowFrame from './WindowFrame'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const { state } = useStoryboard()
  const { state: themeState } = useTheme()
  const theme = themeState.theme
  
  const [exportFormat, setExportFormat] = useState<ExportOptions['format']>('json')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [lastExportResult, setLastExportResult] = useState<{ success: boolean; message: string; filename?: string } | null>(null)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const [options, setOptions] = useState<Omit<ExportOptions, 'format'>>({
    quality: 'high',
    includeImages: true,
    includePrompts: true,
    includeNotes: true,
    compression: true,
    pageSize: 'A4',
    orientation: 'portrait'
  })

  useEffect(() => {
    // Reset error state when dialog opens
    if (isOpen) {
      setHasError(false)
      setErrorMessage(null)
      console.log('🚀 ExportDialog opened')
    }
  }, [isOpen])

  useEffect(() => {
    try {
      // Load user's preferred export settings
      const settings = storage.getSettings()
      setOptions(prev => ({
        ...prev,
        format: exportFormat,
        quality: settings.videoQuality || 'high'
      }))
    } catch (error) {
      console.error('❌ Error loading export settings:', error)
      setErrorMessage('Failed to load export settings')
    }
  }, [exportFormat])

  useEffect(() => {
    try {
      // Set up progress callback
      mediaExport.setProgressCallback(setExportProgress)
      
      return () => {
        mediaExport.setProgressCallback(() => {})
      }
    } catch (error) {
      console.error('❌ Error setting up progress callback:', error)
      setErrorMessage('Failed to initialize export system')
    }
  }, [])

  const handleExport = async () => {
    if (!state.currentProject) {
      alert('No project to export')
      return
    }

    setIsExporting(true)
    setExportProgress(null)
    setLastExportResult(null)
    setHasError(false)
    setErrorMessage(null)

    try {
      console.log('🎬 Starting export process...', { format: exportFormat, project: state.currentProject.title })
      
      const exportOptions = { ...options, format: exportFormat }
      await mediaExport.downloadExport(state.currentProject, exportOptions)
      
      const filename = `${state.currentProject.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${exportFormat}`
      setLastExportResult({
        success: true,
        message: `Successfully exported ${state.currentProject.title}`,
        filename
      })
      
      // Update export format preference
              await storage.saveSettings({ exportFormat: exportFormat as any })
      
      console.log('✅ Export completed successfully')
      
    } catch (error) {
      console.error('❌ Export failed:', error)
      setHasError(true)
      const errorMsg = error instanceof Error ? error.message : 'Export failed'
      setErrorMessage(errorMsg)
      setLastExportResult({
        success: false,
        message: errorMsg
      })
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  const formatOptions = [
    {
      value: 'json' as const,
      label: 'JSON Project',
      description: 'Complete project data for import/backup',
      icon: FileText,
      color: 'blue'
    },
    {
      value: 'pdf' as const,
      label: 'PDF Storyboard',
      description: 'Professional presentation format',
      icon: FileText,
      color: 'red'
    },
    {
      value: 'images' as const,
      label: 'Image Bundle',
      description: 'ZIP file with all panel images',
      icon: Image,
      color: 'green'
    },
    {
      value: 'video-sequence' as const,
      label: 'Video Sequence',
      description: 'Timeline data for video editing',
      icon: Film,
      color: 'purple'
    },
    {
      value: 'html' as const,
      label: 'HTML Storyboard',
      description: 'Shareable web page format',
      icon: Globe,
      color: 'orange'
    }
  ]

  const getProgressPercentage = () => {
    if (!exportProgress) return 0
    return Math.round((exportProgress.progress / exportProgress.total) * 100)
  }

  if (!isOpen) return null

  // Error boundary - show error message instead of crashing
  if (hasError && errorMessage) {
    return (
      <WindowFrame
        isOpen={isOpen}
        onClose={onClose}
        title="Export Error"
        subtitle="Something went wrong"
        icon={<Download className="w-5 h-5" />}
        defaultWidth="400px"
        defaultHeight="300px"
        windowId="export-error"
        zIndex={9200}
      >
        <div className="p-6 text-center">
          <div className="mb-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Export Failed</h3>
          <p className="text-sm text-gray-600 mb-4">
            {errorMessage}
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => {
                setHasError(false)
                setErrorMessage(null)
              }}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: theme.colors.background.tertiary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.primary}`
              }}
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: theme.colors.primary[500],
                color: '#ffffff'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </WindowFrame>
    )
  }

  return (
    <WindowFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Export Project"
      subtitle={`Export "${state.currentProject?.title || 'Untitled'}" in various formats`}
      icon={<Download className="w-5 h-5" />}
      defaultWidth="min(95vw, 800px)"
      defaultHeight="min(90vh, 700px)"
      maxWidth="98vw"
      maxHeight="98vh"
      resizable={true}
      minimizable={true}
      maximizable={true}
      windowId="export-dialog"
      zIndex={9200}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div 
          className="p-4 sm:p-6 border-b"
          style={{ 
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border.primary
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                Choose Export Format
              </h3>
              <p className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
                Select how you want to export your storyboard
              </p>
            </div>
            
            {state.currentProject && (
              <div className="text-right">
                <div className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                  {state.currentProject.title}
                </div>
                <div className="text-xs" style={{ color: theme.colors.text.tertiary }}>
                  {state.panels.length} panels • Updated {state.currentProject.updatedAt.toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ backgroundColor: theme.colors.background.tertiary }}>
          {/* Format Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {formatOptions.map((format) => (
              <button
                key={format.value}
                onClick={() => setExportFormat(format.value)}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  exportFormat === format.value 
                    ? 'shadow-lg scale-105 transform-gpu'
                    : 'hover:shadow-md hover:scale-102 transform-gpu'
                }`}
                style={{
                  backgroundColor: exportFormat === format.value 
                    ? `${theme.colors.primary[100]}` 
                    : theme.colors.background.secondary,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: exportFormat === format.value 
                    ? theme.colors.primary[300]
                    : theme.colors.border.primary
                }}
              >
                <div className="flex flex-col sm:flex-row items-center text-left">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-0 sm:mr-4"
                    style={{
                      backgroundColor: theme.colors.primary[600],
                      color: 'white'
                    }}
                  >
                    <format.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 
                      className="font-semibold text-center sm:text-left mb-1"
                      style={{
                        color: exportFormat === format.value 
                          ? theme.colors.primary[700]
                          : theme.colors.text.primary
                      }}
                    >
                      {format.label}
                    </h4>
                    <p 
                      className="text-sm text-center sm:text-left"
                      style={{
                        color: theme.colors.text.secondary
                      }}
                    >
                      {format.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Export Options */}
          <div className="space-y-6">
            <h4 className="font-medium" style={{ color: theme.colors.text.primary }}>
              Export Options
            </h4>

            {/* Quality Setting */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Quality
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['standard', 'high', 'ultra'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setOptions(prev => ({ ...prev, quality }))}
                    className="p-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: options.quality === quality 
                        ? theme.colors.primary[500]
                        : theme.colors.background.tertiary,
                      color: options.quality === quality 
                        ? '#ffffff'
                        : theme.colors.text.primary,
                      border: `1px solid ${options.quality === quality 
                        ? theme.colors.primary[500]
                        : theme.colors.border.primary}`
                    }}
                  >
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Include Options */}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeImages}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
                  className="rounded border-2"
                  style={{ 
                    borderColor: theme.colors.border.primary,
                    backgroundColor: theme.colors.background.primary
                  }}
                />
                <span className="text-sm" style={{ color: theme.colors.text.primary }}>
                  Include Images
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includePrompts}
                  onChange={(e) => setOptions(prev => ({ ...prev, includePrompts: e.target.checked }))}
                  className="rounded border-2"
                  style={{ 
                    borderColor: theme.colors.border.primary,
                    backgroundColor: theme.colors.background.primary
                  }}
                />
                <span className="text-sm" style={{ color: theme.colors.text.primary }}>
                  Include Video Prompts
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeNotes}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeNotes: e.target.checked }))}
                  className="rounded border-2"
                  style={{ 
                    borderColor: theme.colors.border.primary,
                    backgroundColor: theme.colors.background.primary
                  }}
                />
                <span className="text-sm" style={{ color: theme.colors.text.primary }}>
                  Include Notes
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.compression}
                  onChange={(e) => setOptions(prev => ({ ...prev, compression: e.target.checked }))}
                  className="rounded border-2"
                  style={{ 
                    borderColor: theme.colors.border.primary,
                    backgroundColor: theme.colors.background.primary
                  }}
                />
                <span className="text-sm" style={{ color: theme.colors.text.primary }}>
                  Use Compression
                </span>
              </label>
            </div>

            {/* PDF-specific options */}
            {exportFormat === 'pdf' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                    Page Size
                  </label>
                  <select
                    value={options.pageSize}
                    onChange={(e) => setOptions(prev => ({ ...prev, pageSize: e.target.value as any }))}
                    className="w-full p-2 rounded-lg border"
                    style={{
                      backgroundColor: theme.colors.background.tertiary,
                      borderColor: theme.colors.border.primary,
                      color: theme.colors.text.primary
                    }}
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                    <option value="A3">A3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                    Orientation
                  </label>
                  <select
                    value={options.orientation}
                    onChange={(e) => setOptions(prev => ({ ...prev, orientation: e.target.value as any }))}
                    className="w-full p-2 rounded-lg border"
                    style={{
                      backgroundColor: theme.colors.background.tertiary,
                      borderColor: theme.colors.border.primary,
                      color: theme.colors.text.primary
                    }}
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          {isExporting && exportProgress && (
            <div 
              className="mt-8 p-4 rounded-xl border"
              style={{
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.border.primary
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                  {exportProgress.stage}
                </span>
                <span className="text-sm" style={{ color: theme.colors.text.secondary }}>
                  {getProgressPercentage()}%
                </span>
              </div>
              
              <div 
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: theme.colors.background.tertiary }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    width: `${getProgressPercentage()}%`
                  }}
                />
              </div>
              
              {exportProgress.currentItem && (
                <div className="text-xs mt-2" style={{ color: theme.colors.text.tertiary }}>
                  {exportProgress.currentItem}
                </div>
              )}
              
              {exportProgress.errors && exportProgress.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {exportProgress.errors.map((error, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span style={{ color: theme.colors.text.tertiary }}>{error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {lastExportResult && !isExporting && (
            <div 
              className="mt-8 p-4 rounded-xl border"
              style={{
                backgroundColor: lastExportResult.success 
                  ? '#10b98120'
                  : '#ef444420',
                borderColor: lastExportResult.success 
                  ? '#10b981'
                  : '#ef4444'
              }}
            >
              <div className="flex items-center space-x-2">
                {lastExportResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium" style={{ 
                  color: lastExportResult.success ? '#10b981' : '#ef4444'
                }}>
                  {lastExportResult.message}
                </span>
              </div>
              {lastExportResult.filename && (
                <div className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
                  Saved as: {lastExportResult.filename}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="p-6 border-t flex justify-between items-center"
          style={{ 
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border.primary
          }}
        >
          <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
            {state.panels.length} panels ready for export
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: theme.colors.background.tertiary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.primary}`
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleExport}
              disabled={isExporting || !state.currentProject || state.panels.length === 0}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              style={{
                backgroundColor: theme.colors.primary[500],
                color: '#ffffff'
              }}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export {exportFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  )
}