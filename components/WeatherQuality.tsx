"use client"

import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { WeatherData } from "@/lib/weather-actions"
import { getWeatherQuality } from "@/lib/weather-actions"
import { useEffect, useState } from "react"

interface WeatherQualityProps {
  weather: WeatherData
}

export default function WeatherQuality({ weather }: WeatherQualityProps) {
  const [quality, setQuality] = useState<{
    score: number
    label: string
    color: string
    factors: string[]
  } | null>(null)

  useEffect(() => {
    // Add error boundary and null checks
    if (!weather || !weather.current) {
      return
    }

    const calculateQuality = async () => {
      try {
        const qualityResult = await getWeatherQuality(weather)
        setQuality(qualityResult)
      } catch (error) {
        console.error("Error calculating weather quality:", error)
        // Fallback quality object
        setQuality({
          score: 50,
          label: "Unknown",
          color: "text-gray-400",
          factors: ["Weather data unavailable"],
        })
      }
    }

    calculateQuality()
  }, [weather])

  if (!quality) {
    return (
      <div className="glass-card p-4 sm:p-6 text-white relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent group-hover:from-white/10 transition-all duration-300"></div>
        <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6 relative z-10">
          <div className="p-2 sm:p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-all duration-300">
            <div className="w-5 h-5 sm:w-7 sm:h-7 bg-white/20 rounded animate-pulse"></div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold">Weather Quality</div>
            <div className="text-white/80 text-xs sm:text-sm">Calculating...</div>
          </div>
        </div>
      </div>
    )
  }

  const getIcon = () => {
    if (quality.score >= 60) return <TrendingUp className="w-5 h-5" />
    if (quality.score >= 40) return <Minus className="w-5 h-5" />
    return <TrendingDown className="w-5 h-5" />
  }

  return (
    <div className="glass-card p-4 sm:p-6 text-white relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent group-hover:from-white/10 transition-all duration-300"></div>

      <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 relative z-10">
        <div className="p-2 sm:p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-all duration-300">
          {getIcon()}
        </div>
        <div>
          <div className="text-base sm:text-lg font-bold">Weather Quality</div>
          <div className="text-white/80 text-xs sm:text-sm">Overall conditions</div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-3">
          <div className="text-2xl sm:text-3xl font-bold">{quality.score}/100</div>
          <div className={`text-lg sm:text-xl font-semibold ${quality.color}`}>{quality.label}</div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              quality.score >= 80
                ? "bg-green-400"
                : quality.score >= 60
                  ? "bg-blue-400"
                  : quality.score >= 40
                    ? "bg-yellow-400"
                    : quality.score >= 20
                      ? "bg-orange-400"
                      : "bg-red-400"
            }`}
            style={{ width: `${Math.max(0, Math.min(100, quality.score))}%` }}
          ></div>
        </div>

        {/* Quality factors */}
        <div className="space-y-1">
          {(quality.factors || []).slice(0, 3).map((factor, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs sm:text-sm text-white/80">
              <Star className="w-3 h-3 text-yellow-400" />
              <span>{factor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
