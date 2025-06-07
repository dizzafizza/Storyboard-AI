import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useStoryboard } from '../context/StoryboardContext'
import { Lightbulb, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ContextualTipsProps {
  context: 'empty' | 'first-panel' | 'ai-assistant' | 'panel-editing' | 'general'
  className?: string
}

const ContextualTips: React.FC<ContextualTipsProps> = ({ context, className = '' }) => {
  const { state: themeState } = useTheme()
  const { state } = useStoryboard()
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false)

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(`contextual-tips-${context}-dismissed`)
    if (dismissed === 'true') {
      setHasBeenDismissed(true)
      setIsVisible(false)
    }
  }, [context])

  const getTips = () => {
    switch (context) {
      case 'empty':
        return [
          "👋 Welcome to Storyboard AI! Start by clicking 'New Project' or choose a template.",
          "💡 Try the AI Assistant to generate your first story panels automatically.",
          "🎨 Use the Templates section for quick starts on common story types."
        ]
      
      case 'first-panel':
        return [
          "🎉 Great! You created your first panel. Double-click it to add content.",
          "✨ Use the AI Assistant to generate images and refine your story.",
          "📝 Add detailed descriptions, dialogue, and camera notes in the panel editor."
        ]
      
      case 'ai-assistant':
        return [
          "🤖 Describe your story concept and let AI generate panel scripts for you.",
          "🎯 Be specific about genres, moods, and visual styles for better results.",
          "🔄 Ask for revisions by describing what you want changed.",
          "⚙️ Check AI Settings to customize image dimensions and style preferences."
        ]
      
      case 'panel-editing':
        return [
          "✍️ Write clear, concise scene descriptions for each panel.",
          "🎬 Include camera angles like 'close-up', 'wide shot', or 'bird's eye view'.",
          "🎭 Add dialogue, sound effects, and timing notes for complete scenes.",
          "🔄 Use the timeline view to check story flow and pacing."
        ]
      
      case 'general':
      default:
        return [
          "💾 Your work auto-saves, but you can export projects as JSON for backup.",
          "🎨 Switch themes to match your project's mood or reduce eye strain.",
          "⌨️ Press Ctrl/Cmd + N for new panels, Ctrl/Cmd + S to save.",
          "🖱️ Right-click panels for quick actions like duplicate or delete."
        ]
    }
  }

  const tips = getTips()
  
  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length)
  }
  
  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length)
  }
  
  const dismissTips = () => {
    setIsVisible(false)
    setHasBeenDismissed(true)
    localStorage.setItem(`contextual-tips-${context}-dismissed`, 'true')
  }

  if (!isVisible || hasBeenDismissed || tips.length === 0) {
    return null
  }

  return (
    <div 
      className={`bg-opacity-98 rounded-lg border shadow-lg p-4 animate-slide-in-from-bottom glass-effect ${className}`}
      style={{
        backgroundColor: themeState.theme.colors.primary[50],
        borderColor: themeState.theme.colors.primary[200],
        color: themeState.theme.colors.primary[800]
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Lightbulb 
            className="h-5 w-5 mt-0.5 flex-shrink-0"
            style={{ color: themeState.theme.colors.primary[600] }}
          />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">
              💡 Tip {currentTipIndex + 1} of {tips.length}
            </p>
            <p className="text-sm leading-relaxed">
              {tips[currentTipIndex]}
            </p>
          </div>
        </div>
        
        <button
          onClick={dismissTips}
          className="p-1 rounded-full transition-colors ml-2 flex-shrink-0"
          style={{
            color: themeState.theme.colors.primary[500],
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[100]
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title="Dismiss tips"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {tips.length > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: themeState.theme.colors.primary[200] }}>
          <button
            onClick={prevTip}
            disabled={tips.length <= 1}
            className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
            style={{
              color: themeState.theme.colors.primary[600],
            }}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[100]
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ChevronLeft className="h-3 w-3" />
            <span>Previous</span>
          </button>
          
          <div className="flex space-x-1">
            {tips.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: index === currentTipIndex 
                    ? themeState.theme.colors.primary[500] 
                    : themeState.theme.colors.primary[200]
                }}
              />
            ))}
          </div>
          
          <button
            onClick={nextTip}
            disabled={tips.length <= 1}
            className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
            style={{
              color: themeState.theme.colors.primary[600],
            }}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = themeState.theme.colors.primary[100]
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span>Next</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export default ContextualTips 