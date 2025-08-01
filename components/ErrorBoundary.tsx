"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Weather app error:", error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.retry} />
      }

      return (
        <div className="min-h-screen weather-gradient-animated flex items-center justify-center p-4 relative overflow-hidden">
          <div className="floating-particles">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="particle" />
            ))}
          </div>
          <div className="weather-background-overlay" />

          <div className="glass-card p-8 sm:p-12 text-center text-white max-w-md sm:max-w-lg relative z-10">
            <AlertTriangle className="w-16 h-16 mx-auto mb-6 text-red-400" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Something went wrong</h2>
            <p className="text-white/80 mb-6 text-sm sm:text-base">
              We encountered an unexpected error. Don't worry, we're working to fix it!
            </p>

            <div className="space-y-3">
              <button
                onClick={this.retry}
                className="w-full bg-gradient-to-r from-blue-500/25 to-purple-500/15 hover:from-blue-500/35 hover:to-purple-500/25 px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Home className="w-5 h-5" />
                <span>Reload Page</span>
              </button>
            </div>

            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-white/60 text-sm">Technical Details</summary>
                <pre className="mt-2 text-xs text-white/50 bg-black/20 p-3 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
