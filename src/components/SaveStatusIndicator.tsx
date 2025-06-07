import { CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react'
import { ChatSaveState } from '../types'

interface SaveStatusIndicatorProps {
  saveState: ChatSaveState
  className?: string
}

export default function SaveStatusIndicator({ saveState, className = '' }: SaveStatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (saveState.status) {
      case 'saving':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Saving...',
          color: 'text-blue-600 bg-blue-50',
          textColor: 'text-blue-700'
        }
      case 'saved':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: saveState.lastSaved ? `Saved ${formatTimeAgo(saveState.lastSaved)}` : 'Saved',
          color: 'text-green-600 bg-green-50',
          textColor: 'text-green-700'
        }
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Save failed',
          color: 'text-red-600 bg-red-50',
          textColor: 'text-red-700'
        }
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          text: 'Not saved',
          color: 'text-gray-600 bg-gray-50',
          textColor: 'text-gray-700'
        }
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const { icon, text, color, textColor } = getStatusDisplay()

  return (
    <div className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-200 ${color} ${className}`}>
      <div className={textColor} title={text}>
        {icon}
      </div>
    </div>
  )
} 