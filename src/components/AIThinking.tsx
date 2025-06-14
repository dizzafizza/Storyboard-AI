import { useState, useEffect } from 'react'
import { Brain } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

interface AIThinkingProps {
  isActive: boolean
  thinking: string
  agentId: string
  loadingStages?: string[]
}

/**
 * Component that displays the AI's thinking process in real-time
 * Shows a typing animation effect with markdown formatting
 */
export default function AIThinking({ 
  isActive, 
  thinking, 
  agentId,
  loadingStages = []
}: AIThinkingProps) {
  const [visibleText, setVisibleText] = useState('')
  const [typingIndex, setTypingIndex] = useState(0)
  const [currentLoadingStage, setCurrentLoadingStage] = useState(0)
  const typingSpeed = 10 // ms per character
  
  // Reset visible text when thinking changes completely
  useEffect(() => {
    if (!isActive) {
      setVisibleText('')
      setTypingIndex(0)
      return
    }
    
    // Simulate typing effect
    if (typingIndex < thinking.length) {
      const timer = setTimeout(() => {
        setVisibleText(prev => prev + thinking[typingIndex])
        setTypingIndex(prev => prev + 1)
      }, typingSpeed)
      
      return () => clearTimeout(timer)
    }
  }, [thinking, typingIndex, isActive])
  
  // Handle loading stages display
  useEffect(() => {
    if (loadingStages.length > 0 && currentLoadingStage < loadingStages.length) {
      const timer = setTimeout(() => {
        setCurrentLoadingStage(prev => prev + 1)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [loadingStages, currentLoadingStage])
  
  if (!isActive) return null
  
  const renderLoadingStages = () => {
    if (loadingStages.length === 0) return null
    
    return (
      <div className="flex flex-col gap-1 text-sm mt-2 border-l-2 pl-2 border-gray-300 dark:border-gray-700">
        {loadingStages.slice(0, currentLoadingStage).map((stage, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center text-white text-xs">
              ✓
            </div>
            <span className="text-gray-600 dark:text-gray-300">{stage}</span>
          </div>
        ))}
        {currentLoadingStage < loadingStages.length && (
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-gray-600 dark:text-gray-300">{loadingStages[currentLoadingStage]}</span>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-md p-3 mt-3">
      <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
        <Brain size={16} className="text-indigo-500 animate-pulse" />
        <span className="text-sm font-semibold">AI Thinking Process</span>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">
        <MarkdownRenderer content={visibleText} />
        {typingIndex < thinking.length && (
          <span className="inline-block w-2 h-4 bg-indigo-500 animate-blink ml-1"></span>
        )}
      </div>
      
      {renderLoadingStages()}
    </div>
  )
} 