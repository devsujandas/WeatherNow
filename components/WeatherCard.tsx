import Image from "next/image"
import type { WeatherData } from "@/lib/getWeather"
import { Thermometer, Droplets, Wind, Eye, Gauge, MapPin, Calendar } from "lucide-react"

interface WeatherCardProps {
  weather: WeatherData
  unit: "C" | "F"
}

export default function WeatherCard({ weather, unit }: WeatherCardProps) {
  const convertTemp = (temp: number) => {
    if (unit === "F") {
      return Math.round((temp * 9) / 5 + 32)
    }
    return temp
  }

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`
  }

  const getWindDirection = (degrees: number) => {
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ]
    return directions[Math.round(degrees / 22.5) % 16]
  }

  const getBackgroundGradient = (condition: string) => {
    const gradients = {
      Clear: "from-yellow-400 via-orange-500 to-red-500",
      Clouds: "from-gray-400 via-gray-500 to-gray-600",
      Rain: "from-blue-400 via-blue-500 to-blue-600",
      Drizzle: "from-blue-300 via-blue-400 to-blue-500",
      Thunderstorm: "from-gray-700 via-gray-800 to-gray-900",
      Snow: "from-blue-100 via-blue-200 to-blue-300",
      Mist: "from-gray-300 via-gray-400 to-gray-500",
      Fog: "from-gray-300 via-gray-400 to-gray-500",
    }
    return gradients[condition as keyof typeof gradients] || "from-blue-400 via-blue-500 to-blue-600"
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Weather Card */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getBackgroundGradient(weather.current.condition)} p-8 text-white shadow-2xl`}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span className="text-lg font-medium">
                {weather.location.name}, {weather.location.country}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-6xl font-bold">{convertTemp(weather.current.temp)}°</span>
                <span className="text-2xl font-medium opacity-80">{unit}</span>
              </div>
              <p className="text-xl capitalize mb-1">{weather.current.description}</p>
              <p className="text-sm opacity-80">
                Feels like {convertTemp(weather.current.feels_like)}°{unit}
              </p>
            </div>

            <div className="flex-shrink-0">
              <Image
                src={getWeatherIcon(weather.current.icon) || "/placeholder.svg"}
                alt={weather.current.description}
                width={120}
                height={120}
                className="weather-icon animate-float"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Thermometer className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Feels Like</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {convertTemp(weather.current.feels_like)}°{unit}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Humidity</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{weather.current.humidity}%</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Wind className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Wind</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{weather.current.wind_speed} km/h</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getWindDirection(weather.current.wind_deg)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Eye className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Visibility</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{weather.current.visibility} km</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Gauge className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pressure</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{weather.current.pressure} hPa</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg md:col-span-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Condition</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{weather.current.condition}</p>
        </div>
      </div>

      {/* Forecast Section */}
      {weather.forecast && weather.forecast.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5-Day Forecast</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {weather.forecast.map((day, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{day.date}</p>
                <Image
                  src={getWeatherIcon(day.icon) || "/placeholder.svg"}
                  alt={day.condition}
                  width={60}
                  height={60}
                  className="mx-auto mb-2"
                />
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{convertTemp(day.temp_max)}°</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{convertTemp(day.temp_min)}°</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Forecast Unavailable</h3>
            <p className="text-blue-600 dark:text-blue-300 text-sm">
              5-day forecast requires a premium API subscription. Current weather data is available above.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
