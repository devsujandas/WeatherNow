import { Cloud, Sun, CloudRain, Sparkles } from "lucide-react"

interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export default function LoadingSpinner({ message = "Loading weather data...", size = "lg" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  const containerSizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8 sm:p-16",
  }

  return (
    <div
      className={`glass-card ${containerSizeClasses[size]} text-center text-white max-w-md sm:max-w-lg relative z-10`}
    >
      <div className="relative mb-6 sm:mb-8">
        {/* Animated weather icons */}
        <div className="relative">
          <div className={`${sizeClasses[size]} mx-auto mb-4 relative`}>
            <div className="absolute inset-0 animate-spin">
              <div className="w-full h-full border-4 border-white/20 border-t-white rounded-full"></div>
            </div>
            <div className="absolute inset-0 animate-pulse flex items-center justify-center">
              <Sun className="w-6 h-6 text-yellow-400" />
            </div>
          </div>

          {/* Floating weather icons */}
          <div className="absolute -top-2 -left-2 animate-bounce" style={{ animationDelay: "0s" }}>
            <Cloud className="w-4 h-4 text-blue-300 opacity-60" />
          </div>
          <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDelay: "0.5s" }}>
            <CloudRain className="w-4 h-4 text-blue-400 opacity-60" />
          </div>
          <div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 animate-bounce"
            style={{ animationDelay: "1s" }}
          >
            <Sparkles className="w-4 h-4 text-yellow-300 opacity-60" />
          </div>
        </div>

        <div className="pulse-ring"></div>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
        {message}
      </h2>

      <div className="flex items-center justify-center space-x-2 text-sm text-white/70">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "0s" }}></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>
      </div>
    </div>
  )
}
