import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Clock, Eye, Volume2, Maximize, Download } from 'lucide-react'
import { useStoryboard } from '../context/StoryboardContext'
import { useTheme } from '../context/ThemeContext'

export default function TimelineView() {
  const { state } = useStoryboard()
  const { state: themeState } = useTheme()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPanel, setCurrentPanel] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const totalDuration = state.panels.reduce((acc, panel) => acc + (panel.duration || 0), 0)
  
  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + (0.1 * playbackSpeed)
          const currentPanelDuration = state.panels[currentPanel]?.duration || 3
          
          if (newTime >= currentPanelDuration) {
            if (currentPanel < state.panels.length - 1) {
              setCurrentPanel(prev => prev + 1)
              return 0
            } else {
              setIsPlaying(false)
              setCurrentPanel(0)
              return 0
            }
          }
          return newTime
        })
      }, 100)
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [isPlaying, currentPanel, playbackSpeed, state.panels])

  useEffect(() => {
    setCurrentTime(0)
  }, [currentPanel])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    
    // Handle video playback if current panel has video
    if (videoRef.current) {
      if (!isPlaying) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  const handlePrevious = () => {
    setCurrentPanel(Math.max(0, currentPanel - 1))
    setIsPlaying(false)
  }

  const handleNext = () => {
    setCurrentPanel(Math.min(state.panels.length - 1, currentPanel + 1))
    setIsPlaying(false)
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const handleFullscreen = () => {
    if (!isFullscreen && timelineRef.current) {
      timelineRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  const exportTimeline = () => {
    const timelineData = {
      project: state.currentProject?.title || 'Untitled',
      totalDuration,
      panels: state.panels.map((panel, index) => ({
        order: index + 1,
        title: panel.title,
        description: panel.description,
        duration: panel.duration,
        shotType: panel.shotType,
        cameraAngle: panel.cameraAngle,
        notes: panel.notes,
        hasVideo: !!panel.videoUrl,
        hasImage: !!panel.imageUrl,
        videoPrompt: panel.videoPrompt
      }))
    }
    
    const blob = new Blob([JSON.stringify(timelineData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.currentProject?.title || 'storyboard'}-timeline.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (state.panels.length === 0) {
    return (
      <div className="p-6 text-center text-secondary">
        <Clock className="w-8 h-8 mx-auto mb-2" />
        <p>No panels to display in timeline</p>
      </div>
    )
  }

  return (
    <div ref={timelineRef} className="h-full flex flex-col bg-primary text-primary">
      {/* Timeline Header */}
      <div className="p-3 md:p-4 border-b border-primary">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
          <h3 className="font-semibold text-primary">Timeline Preview</h3>
                      <div className="flex flex-wrap items-center gap-2 md:space-x-4">
              <div className="flex items-center space-x-2 text-sm text-secondary">
              <Clock className="w-4 h-4" />
              <span>{totalDuration}s total</span>
            </div>
            
            {/* Timeline Controls */}
            <div className="flex items-center space-x-2">
              {/* Speed Control */}
              <select
                value={playbackSpeed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="select-modern text-xs px-2 py-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
              
              {/* Volume Control */}
              <div className="flex items-center space-x-1">
                <Volume2 className="w-4 h-4 text-secondary" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-16 h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Export Button */}
              <button
                onClick={exportTimeline}
                className="p-1 hover:bg-secondary rounded text-secondary hover:text-primary"
                title="Export timeline"
              >
                <Download className="w-4 h-4" />
              </button>
              
              {/* Fullscreen Button */}
              <button
                onClick={handleFullscreen}
                className="p-1 hover:bg-secondary rounded text-secondary hover:text-primary"
                title="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Panel Preview */}
      <div className="flex-1 flex items-center justify-center bg-black relative min-h-0">
        {state.panels[currentPanel] && (
          <>
            {state.panels[currentPanel].videoUrl ? (
              <video
                ref={videoRef}
                src={state.panels[currentPanel].videoUrl}
                className="max-w-[60%] max-h-[60%] object-contain"
                controls={false}
                muted={volume === 0}
                loop={false}
                onEnded={() => {
                  if (currentPanel < state.panels.length - 1) {
                    setCurrentPanel(prev => prev + 1)
                    setCurrentTime(0)
                  } else {
                    setIsPlaying(false)
                    setCurrentPanel(0)
                    setCurrentTime(0)
                  }
                }}
              />
            ) : state.panels[currentPanel].imageUrl ? (
              <img
                src={state.panels[currentPanel].imageUrl}
                alt={state.panels[currentPanel].title}
                className="max-w-[60%] max-h-[60%] object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div className="text-center max-w-md mx-auto">
                <Eye 
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: themeState.theme.colors.text.secondary }}
                />
                <h4 
                  className="text-xl font-medium mb-2"
                  style={{ color: themeState.theme.colors.text.primary }}
                >
                  {state.panels[currentPanel].title}
                </h4>
                <p style={{ color: themeState.theme.colors.text.secondary }}>
                  {state.panels[currentPanel].description}
                </p>
                <div className="mt-4 flex justify-center space-x-4 text-sm">
                  <span 
                    className="px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: themeState.theme.colors.background.tertiary,
                      color: themeState.theme.colors.text.primary
                    }}
                  >
                    {state.panels[currentPanel].shotType.replace('-', ' ')}
                  </span>
                  <span 
                    className="px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: themeState.theme.colors.background.tertiary,
                      color: themeState.theme.colors.text.primary
                    }}
                  >
                    {state.panels[currentPanel].cameraAngle.replace('-', ' ')}
                  </span>
                </div>
              </div>
            )}
            
            {/* Panel Info Overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg p-3">
              <div className="text-sm">
                <div className="font-medium text-white">Panel {currentPanel + 1} of {state.panels.length}</div>
                <div className="text-white opacity-80">
                  {currentTime.toFixed(1)}s / {state.panels[currentPanel].duration}s
                </div>
                {state.panels[currentPanel].videoUrl && (
                  <div className="text-xs text-green-400 mt-1">📹 Video</div>
                )}
                {state.panels[currentPanel].imageUrl && !state.panels[currentPanel].videoUrl && (
                  <div className="text-xs text-blue-400 mt-1">🖼️ Image</div>
                )}
              </div>
            </div>

            {/* Progress Bar for Current Panel */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black bg-opacity-50 rounded-lg p-2">
                <div className="flex items-center justify-between text-xs mb-1 text-white opacity-90">
                  <span>{state.panels[currentPanel].title}</span>
                  <span>{playbackSpeed}x</span>
                </div>
                <div 
                  className="w-full rounded-full h-1"
                  style={{ backgroundColor: themeState.theme.colors.background.tertiary }}
                >
                  <div 
                    className="bg-primary-500 h-1 rounded-full transition-all duration-100"
                    style={{ 
                      width: `${(currentTime / (state.panels[currentPanel].duration || 1)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Timeline Controls */}
      <div 
        className="p-4 border-t"
        style={{ borderColor: themeState.theme.colors.border.primary }}
      >
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={handlePrevious}
            disabled={currentPanel === 0}
            className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: themeState.theme.colors.background.tertiary,
              color: themeState.theme.colors.text.primary
            }}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.background.secondary
              }
            }}
            onMouseOut={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.background.tertiary
              }
            }}
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="p-3 rounded-lg"
            style={{
              backgroundColor: themeState.theme.colors.primary[600],
              color: 'white'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[700]
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[600]
            }}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentPanel === state.panels.length - 1}
            className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: themeState.theme.colors.background.tertiary,
              color: themeState.theme.colors.text.primary
            }}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.background.secondary
              }
            }}
            onMouseOut={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.background.tertiary
              }
            }}
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="space-y-2">
          <div 
            className="flex justify-between text-xs"
            style={{ color: themeState.theme.colors.text.secondary }}
          >
            <span>0s</span>
            <span>{totalDuration}s</span>
          </div>
          
          <div 
            className="relative h-2 rounded-full"
            style={{ backgroundColor: themeState.theme.colors.background.tertiary }}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentPanel + 1) / state.panels.length) * 100}%` 
              }}
            />
          </div>
          
          {/* Panel Markers */}
          <div className="flex justify-between">
            {state.panels.map((panel, index) => (
              <button
                key={panel.id}
                onClick={() => {
                  setCurrentPanel(index)
                  setIsPlaying(false)
                }}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{
                  backgroundColor: index === currentPanel 
                    ? themeState.theme.colors.primary[600]
                    : themeState.theme.colors.background.tertiary,
                  color: index === currentPanel
                    ? 'white'
                    : themeState.theme.colors.text.secondary
                }}
                onMouseOver={(e) => {
                  if (index !== currentPanel) {
                    e.currentTarget.style.backgroundColor = themeState.theme.colors.background.secondary
                  }
                }}
                onMouseOut={(e) => {
                  if (index !== currentPanel) {
                    e.currentTarget.style.backgroundColor = themeState.theme.colors.background.tertiary
                  }
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 