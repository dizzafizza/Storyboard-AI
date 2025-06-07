import React, { createContext, useContext, useState, useCallback } from 'react'
import Toast, { ToastProps } from './Toast'

interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast
    }
    setToasts(prev => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearToasts }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Convenience functions for different toast types
export const toast = {
  success: (title: string, description?: string, duration?: number) => {
    // This will be implemented when the context is available
  },
  error: (title: string, description?: string, duration?: number) => {
    // This will be implemented when the context is available
  },
  warning: (title: string, description?: string, duration?: number) => {
    // This will be implemented when the context is available
  },
  info: (title: string, description?: string, duration?: number) => {
    // This will be implemented when the context is available
  }
}

export default ToastProvider 