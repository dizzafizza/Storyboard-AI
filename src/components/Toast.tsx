import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  onClose: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  description,
  duration = 5000,
  onClose
}) => {
  const { state: themeState } = useTheme()
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5" style={{ color: themeState.theme.colors.primary[500] }} />
  }

  useEffect(() => {
    if (duration > 0) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100))
          if (newProgress <= 0) {
            clearInterval(progressInterval)
            handleClose()
            return 0
          }
          return newProgress
        })
      }, 100)

      return () => clearInterval(progressInterval)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  return (
    <div 
      className={`toast-item toast-${type} ${isExiting ? 'toast-exit' : ''}`}
      style={{
        background: themeState.theme.colors.background.primary,
        borderColor: themeState.theme.colors.border.primary,
        color: themeState.theme.colors.text.primary
      }}
    >
      <div className="toast-content">
        <div className="toast-icon">
          {icons[type]}
        </div>
        <div className="toast-message">
          <div className="toast-title">{title}</div>
          {description && (
            <div 
              className="toast-description"
              style={{ color: themeState.theme.colors.text.secondary }}
            >
              {description}
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={handleClose}
        className="toast-close"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {duration > 0 && (
        <div className="toast-progress">
          <div 
            className="toast-progress-bar" 
            style={{ 
              width: `${progress}%`,
              animationDuration: `${duration}ms`,
              background: type === 'success' ? '#10b981' : 
                         type === 'error' ? '#ef4444' :
                         type === 'warning' ? '#f59e0b' :
                         themeState.theme.colors.primary[500]
            }}
          />
        </div>
      )}
    </div>
  )
}

export default Toast 