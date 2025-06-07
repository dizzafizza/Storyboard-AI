import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

const ThemedErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ error, resetError }) => {
  const { state } = useTheme()
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: state.theme.colors.background.secondary }}
    >
      <div 
        className="max-w-lg w-full rounded-lg shadow-lg p-6 text-center"
        style={{
          backgroundColor: state.theme.colors.background.primary,
          borderColor: state.theme.colors.border.primary,
        }}
      >
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${state.theme.colors.primary[500]}20` }}
        >
          <AlertTriangle 
            className="w-8 h-8"
            style={{ color: state.theme.colors.primary[600] }}
          />
        </div>
        
        <h1 
          className="text-xl font-semibold mb-2"
          style={{ color: state.theme.colors.text.primary }}
        >
          Something went wrong
        </h1>
        
        <p 
          className="mb-6"
          style={{ color: state.theme.colors.text.secondary }}
        >
          We encountered an unexpected error. Your data is safe in your browser's storage.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full btn-secondary flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Reload Page</span>
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary 
              className="cursor-pointer text-sm hover:opacity-75"
              style={{ color: state.theme.colors.text.secondary }}
            >
              Error Details (Development)
            </summary>
            <div 
              className="mt-2 p-3 rounded text-xs font-mono overflow-auto max-h-32"
              style={{
                backgroundColor: state.theme.colors.background.tertiary,
                color: state.theme.colors.primary[600]
              }}
            >
              <div className="font-semibold mb-1">Error:</div>
              <div className="mb-2">{error.message}</div>
              <div className="font-semibold mb-1">Stack:</div>
              <div className="whitespace-pre-wrap">{error.stack}</div>
            </div>
          </details>
        )}
        
        <div 
          className="mt-6 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: `${state.theme.colors.primary[500]}10`,
            color: state.theme.colors.primary[700]
          }}
        >
          <strong>💾 Your data is safe!</strong> All your projects are stored locally in your browser.
        </div>
      </div>
    </div>
  )
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // In production, we could send this to an error reporting service
    // But since we're privacy-focused, we'll just log locally
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return <Fallback error={this.state.error} resetError={this.resetError} />
      }

            // Default error UI
      return <ThemedErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
}

// Async error boundary hook
export const useAsyncError = () => {
  const { handleError } = useErrorHandler()

  return React.useCallback((error: Error) => {
    // Schedule error to be thrown in next render cycle
    setTimeout(() => handleError(error), 0)
  }, [handleError])
}

export default ErrorBoundary 