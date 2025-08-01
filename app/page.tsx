"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Search,
  MapPin,
  Droplets,
  Wind,
  Eye,
  Loader2,
  AlertCircle,
  Navigation,
  Thermometer,
  Gauge,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Zap,
  Compass,
  Clock,
  Calendar,
  TrendingUp,
  Activity,
  Sunrise,
  Sunset,
  Navigation2,
  ChevronLeft,
  ChevronRight,
  Star,
  Sparkles,
  CloudSnow,
  CloudDrizzle,
  Cloudy,
  MapPinIcon,
  RotateCcw,
  Wifi,
  WifiOff,
  Bookmark,
  BookmarkCheck,
  Settings,
  Info,
  TestTube,
} from "lucide-react"

import { getWeatherByCoords, getWeatherByCity, getLocationSuggestions, testApiConnection } from "@/lib/weather-actions"
import type { WeatherData, LocationSuggestion } from "@/lib/weather-actions"
import LoadingSpinner from "@/components/LoadingSpinner"
import WeatherQuality from "@/components/WeatherQuality"
import { ErrorBoundary } from "@/components/ErrorBoundary"

// Custom hooks for better state management
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue],
  )

  return [storedValue, setValue] as const
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

function WeatherApp() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt")
  const [locationLoading, setLocationLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"daily" | "hourly">("daily")
  const [temperatureUnit, setTemperatureUnit] = useLocalStorage<"C" | "F">("temperatureUnit", "C")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [favoriteLocations, setFavoriteLocations] = useLocalStorage<LocationSuggestion[]>("favoriteLocations", [])
  const [showSettings, setShowSettings] = useState(false)
  const [autoRefresh, setAutoRefresh] = useLocalStorage("autoRefresh", true)
  const [apiStatus, setApiStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [showApiTest, setShowApiTest] = useState(false)

  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const hourlyScrollRef = useRef<HTMLDivElement>(null)
  const isOnline = useOnlineStatus()

  // Test API connection
  const handleApiTest = useCallback(async () => {
    setShowApiTest(true)
    try {
      const result = await testApiConnection()
      setApiStatus(result)
    } catch (error) {
      setApiStatus({
        success: false,
        message: error instanceof Error ? error.message : "API test failed",
      })
    }
  }, [])

  // Auto-refresh weather data every 10 minutes
  useEffect(() => {
    if (!autoRefresh || !weather) return

    const interval = setInterval(async () => {
      try {
        const weatherData = await getWeatherByCoords(weather.location.lat, weather.location.lon)
        setWeather(weatherData)
      } catch (error) {
        console.error("Auto-refresh failed:", error)
      }
    }, 600000) // 10 minutes

    return () => clearInterval(interval)
  }, [weather, autoRefresh])

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Debounced search function
  const debouncedSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([])
      return
    }

    try {
      const suggestions = await getLocationSuggestions(query)
      setLocationSuggestions(suggestions)
    } catch (error) {
      console.error("Error fetching location suggestions:", error)
      setLocationSuggestions([])
    }
  }, [])

  // Handle search input change with debouncing
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value)
      setShowSuggestions(true)

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        debouncedSearch(value)
      }, 300)
    },
    [debouncedSearch],
  )

  // Get user's current location with enhanced error handling
  const getCurrentLocation = useCallback((): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"))
        return
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission("granted")
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        (error) => {
          setLocationPermission("denied")
          let message = "Failed to get location"
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied. You can still search for cities manually."
              break
            case error.POSITION_UNAVAILABLE:
              message = "Location information is unavailable. Please try searching for a city."
              break
            case error.TIMEOUT:
              message = "Location request timed out. Please try searching for a city."
              break
          }
          reject(new Error(message))
        },
        options,
      )
    })
  }, [])

  // Handle location update
  const handleLocationUpdate = useCallback(async () => {
    if (!isOnline) {
      setError("You're offline. Please check your internet connection.")
      return
    }

    try {
      setLocationLoading(true)
      setError(null)

      const coords = await getCurrentLocation()
      const weatherData = await getWeatherByCoords(coords.lat, coords.lon)
      if (weatherData && weatherData.current) {
        setWeather(weatherData)
        setError(null)
      } else {
        throw new Error("Invalid weather data received")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get location"
      setError(errorMessage)
      console.error("Location error:", err)
    } finally {
      setLocationLoading(false)
    }
  }, [getCurrentLocation, isOnline])

  // Load initial weather data
  useEffect(() => {
    const loadInitialWeather = async () => {
      if (!isOnline) {
        setError("You're offline. Please check your internet connection.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        try {
          const coords = await getCurrentLocation()
          const weatherData = await getWeatherByCoords(coords.lat, coords.lon)

          // Validate weather data before setting
          if (weatherData && weatherData.current) {
            setWeather(weatherData)
          } else {
            throw new Error("Invalid weather data received")
          }
        } catch (locationError) {
          console.warn("Location access failed, loading default city:", locationError)

          // If location fails, just load a default city without showing error
          const fallbackCities = ["London", "New York", "Tokyo", "Paris"]
          let weatherData = null

          for (const city of fallbackCities) {
            try {
              weatherData = await getWeatherByCity(city)
              if (weatherData && weatherData.current) {
                setWeather(weatherData)
                // Don't show error for location permission denial - just use default
                break
              }
            } catch (cityError) {
              console.warn(`Failed to get weather for ${city}:`, cityError)
              continue
            }
          }

          if (!weatherData) {
            throw new Error("Unable to load weather data. Please check your API key configuration.")
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Something went wrong"
        setError(errorMessage)
        console.error("Failed to load initial weather:", err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialWeather()
  }, [getCurrentLocation, isOnline])

  // Handle location suggestion selection
  const handleSuggestionSelect = useCallback(
    async (suggestion: LocationSuggestion) => {
      if (!isOnline) {
        setError("You're offline. Please check your internet connection.")
        return
      }

      try {
        setSearchLoading(true)
        setError(null)
        setShowSuggestions(false)
        setSearchQuery("")
        const weatherData = await getWeatherByCoords(suggestion.lat, suggestion.lon)
        if (weatherData && weatherData.current) {
          setWeather(weatherData)
        } else {
          throw new Error("Invalid weather data received")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch weather"
        setError(errorMessage)
      } finally {
        setSearchLoading(false)
      }
    },
    [isOnline],
  )

  // Handle search form submission
  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!searchQuery.trim() || !isOnline) return

      try {
        setSearchLoading(true)
        setError(null)
        setShowSuggestions(false)
        const weatherData = await getWeatherByCity(searchQuery.trim())
        if (weatherData && weatherData.current) {
          setWeather(weatherData)
          setSearchQuery("")
        } else {
          throw new Error("Invalid weather data received")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Search failed"
        setError(errorMessage)
      } finally {
        setSearchLoading(false)
      }
    },
    [searchQuery, isOnline],
  )

  // Refresh current weather
  const handleRefresh = useCallback(async () => {
    if (!weather || !isOnline) return

    try {
      setIsRefreshing(true)
      setError(null)
      const weatherData = await getWeatherByCoords(weather.location.lat, weather.location.lon)
      if (weatherData && weatherData.current) {
        setWeather(weatherData)
      } else {
        throw new Error("Invalid weather data received")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Refresh failed"
      setError(errorMessage)
    } finally {
      setIsRefreshing(false)
    }
  }, [weather, isOnline])

  // Scroll hourly forecast
  const scrollHourly = useCallback((direction: "left" | "right") => {
    if (hourlyScrollRef.current) {
      const scrollAmount = 200
      const currentScroll = hourlyScrollRef.current.scrollLeft
      const newScroll = direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount
      hourlyScrollRef.current.scrollTo({ left: newScroll, behavior: "smooth" })
    }
  }, [])

  // Toggle favorite location
  const toggleFavorite = useCallback(
    (location: LocationSuggestion) => {
      setFavoriteLocations((prev) => {
        const exists = prev.find((fav) => fav.lat === location.lat && fav.lon === location.lon)
        if (exists) {
          return prev.filter((fav) => !(fav.lat === location.lat && fav.lon === location.lon))
        } else {
          return [...prev.slice(0, 9), location] // Limit to 10 favorites
        }
      })
    },
    [setFavoriteLocations],
  )

  // Memoized calculations
  const weatherIconUrl = useMemo(() => {
    return (iconCode: string) => `https://openweathermap.org/img/wn/${iconCode}@4x.png`
  }, [])

  const getWeatherIconComponent = useMemo(() => {
    return (condition: string, size = "w-6 h-6") => {
      const iconProps = { className: `${size} drop-shadow-lg` }
      switch (condition.toLowerCase()) {
        case "clear":
          return <Sun {...iconProps} className={`${size} text-yellow-400 drop-shadow-lg`} />
        case "clouds":
          return <Cloud {...iconProps} className={`${size} text-gray-300 drop-shadow-lg`} />
        case "rain":
          return <CloudRain {...iconProps} className={`${size} text-blue-400 drop-shadow-lg`} />
        case "drizzle":
          return <CloudDrizzle {...iconProps} className={`${size} text-blue-300 drop-shadow-lg`} />
        case "thunderstorm":
          return <Zap {...iconProps} className={`${size} text-purple-400 drop-shadow-lg`} />
        case "snow":
          return <CloudSnow {...iconProps} className={`${size} text-blue-100 drop-shadow-lg`} />
        case "mist":
        case "fog":
          return <Cloudy {...iconProps} className={`${size} text-gray-400 drop-shadow-lg`} />
        default:
          return <Sun {...iconProps} className={`${size} text-yellow-400 drop-shadow-lg`} />
      }
    }
  }, [])

  const getWeatherGradient = useMemo(() => {
    return (condition: string, isNight = false) => {
      if (isNight) {
        return "weather-gradient-night"
      }

      switch (condition.toLowerCase()) {
        case "clear":
          return "weather-gradient-clear"
        case "clouds":
          return "weather-gradient-clouds"
        case "rain":
        case "drizzle":
          return "weather-gradient-rain"
        case "snow":
          return "weather-gradient-snow"
        default:
          return "weather-gradient-clear"
      }
    }
  }, [])

  const getWindDirection = useMemo(() => {
    return (degrees: number) => {
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
  }, [])

  const isNightTime = useMemo(() => {
    if (!weather) return false
    const now = Math.floor(Date.now() / 1000)
    return now < weather.current.sunrise || now > weather.current.sunset
  }, [weather])

  const convertTemperature = useCallback(
    (temp: number) => {
      if (temperatureUnit === "F") {
        return Math.round((temp * 9) / 5 + 32)
      }
      return temp
    },
    [temperatureUnit],
  )

  const currentGradient = useMemo(() => {
    return weather ? getWeatherGradient(weather.current.condition, isNightTime) : "weather-gradient-animated"
  }, [weather, getWeatherGradient, isNightTime])

  if (loading && !weather) {
    return (
      <div className="min-h-screen weather-gradient-animated flex items-center justify-center p-4 relative overflow-hidden">
        <div className="floating-particles">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>
        <div className="weather-background-overlay" />
        <LoadingSpinner
          message={
            locationPermission === "prompt"
              ? "Requesting location access..."
              : locationPermission === "granted"
                ? "Fetching your local weather..."
                : "Loading weather data..."
          }
        />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${currentGradient} transition-all duration-1000 relative overflow-hidden`}>
      {/* Enhanced Floating Particles */}
      <div className="floating-particles">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      {/* Background Overlay */}
      <div className="weather-background-overlay" />

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-center">
          <div className="glass-card px-4 py-2 text-white text-sm flex items-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span>You're offline</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl relative z-10">
        {/* Enhanced Header */}
        <header className="text-center mb-8 sm:mb-16 fade-in-up">
          <div className="flex items-center justify-center space-x-3 sm:space-x-6 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 glass-card rounded-2xl sm:rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent group-hover:from-white/30 transition-all duration-300"></div>
              {weather && getWeatherIconComponent(weather.current.condition, "w-8 h-8 sm:w-12 sm:h-12")}
              <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
              WeatherNow
            </h1>
          </div>
          <p className="text-white/95 text-base sm:text-2xl font-medium mb-4">
            Weather goals, aesthetic achieved
          </p>
          <div className="flex items-center justify-center space-x-4 sm:space-x-8 mt-4 sm:mt-6 text-white/80 text-sm sm:text-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{currentTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">
                {currentTime.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
              </span>
              <span className="sm:hidden">
                {currentTime.toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              )}
            </div>
          </div>
        </header>

        {/* Enhanced Search Bar */}
        <div className="mb-8 sm:mb-16 fade-in-scale relative max-w-2xl sm:max-w-3xl mx-auto">
          <form onSubmit={handleSearch}>
            <div className="search-bar-enhanced relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10"></div>
              <Search className="w-5 h-5 sm:w-7 sm:h-7 text-white/80 ml-3 sm:ml-5 relative z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search for any city worldwide..."
                className="flex-1 bg-transparent text-white placeholder-white/70 outline-none px-3 sm:px-5 py-3 sm:py-5 text-base sm:text-xl relative z-10"
                disabled={searchLoading || !isOnline}
              />
              <button
                type="submit"
                disabled={searchLoading || !searchQuery.trim() || !isOnline}
                className="bg-gradient-to-r from-white/25 to-white/15 hover:from-white/35 hover:to-white/25 disabled:opacity-50 disabled:cursor-not-allowed px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-white font-bold transition-all duration-300 flex items-center space-x-2 mr-2 sm:mr-3 text-sm sm:text-lg shadow-lg relative z-10"
              >
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                  <>
                    <span>Search</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Enhanced Location Suggestions */}
          {showSuggestions && locationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 glass-card p-3 z-50 fade-in-up max-h-80 overflow-y-auto">
              {locationSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="location-suggestion text-white text-sm sm:text-lg hover:bg-white/15 transition-all duration-300 flex items-center justify-between"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                    <div>
                      <div className="font-semibold">{suggestion.displayName}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(suggestion)
                    }}
                    className="p-1 hover:bg-white/20 rounded-full transition-all duration-200"
                  >
                    {favoriteLocations.some((fav) => fav.lat === suggestion.lat && fav.lon === suggestion.lon) ? (
                      <BookmarkCheck className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Bookmark className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8 sm:mb-12 fade-in-scale">
          {/* Temperature Unit Toggle */}
          <div className="glass-card p-1.5 flex rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10"></div>
            <button
              onClick={() => setTemperatureUnit("C")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base relative z-10 ${
                temperatureUnit === "C"
                  ? "bg-gradient-to-r from-white/30 to-white/20 text-white shadow-xl scale-105"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setTemperatureUnit("F")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base relative z-10 ${
                temperatureUnit === "F"
                  ? "bg-gradient-to-r from-white/30 to-white/20 text-white shadow-xl scale-105"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              °F
            </button>
          </div>

          {/* Location Button */}
          <button
            onClick={handleLocationUpdate}
            disabled={locationLoading || !isOnline}
            className="location-button flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 relative overflow-hidden group disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 group-hover:from-white/30 group-hover:to-white/30 transition-all duration-300"></div>
            {locationLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin relative z-10" />
            ) : (
              <Navigation2 className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
            )}
            <span className="font-bold relative z-10">{locationLoading ? "Getting..." : "Use Location"}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="location-button flex items-center space-x-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 group-hover:from-white/30 group-hover:to-white/30 transition-all duration-300"></div>
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
            <span className="font-bold relative z-10">Settings</span>
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-8 fade-in-up">
            <div className="glass-card p-4 sm:p-6 text-white max-w-md mx-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-refresh weather</span>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 ${
                      autoRefresh ? "bg-blue-500" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                        autoRefresh ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="text-xs text-white/60">
                  <Info className="w-3 h-3 inline mr-1" />
                  Auto-refresh updates weather every 10 minutes
                </div>

                {/* API Test Button in Settings */}
                <div className="pt-4 border-t border-white/20">
                  <button
                    onClick={handleApiTest}
                    className="w-full bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 px-4 py-3 rounded-xl text-white font-bold transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <TestTube className="w-4 h-4" />
                    <span>Test API Connection</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Status Display */}
        {showApiTest && apiStatus && (
          <div className="mb-8 fade-in-up">
            <div
              className={`glass-card p-4 sm:p-6 text-white max-w-md mx-auto ${apiStatus.success ? "border-green-400/30" : "border-red-400/30"}`}
            >
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <TestTube className="w-5 h-5" />
                <span>API Connection Test</span>
              </h3>
              <div className={`p-3 rounded-lg ${apiStatus.success ? "bg-green-500/20" : "bg-red-500/20"}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${apiStatus.success ? "bg-green-400" : "bg-red-400"}`}></div>
                  <span className="font-semibold">{apiStatus.success ? "Success" : "Failed"}</span>
                </div>
                <p className="text-sm text-white/90">{apiStatus.message}</p>
              </div>
              <button
                onClick={() => setShowApiTest(false)}
                className="mt-4 w-full bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Error Message */}
        {error && (
          <div className="mb-8 sm:mb-12 slide-in-left">
            <div className="glass-card p-6 sm:p-8 text-center text-white max-w-md sm:max-w-xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/10"></div>
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-red-300 relative z-10" />
              <h3 className="text-xl sm:text-2xl font-bold mb-3 relative z-10">Oops!</h3>
              <p className="text-white/90 mb-6 text-base sm:text-lg relative z-10">{error}</p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-6 relative z-10">
                <button
                  onClick={handleRefresh}
                  disabled={!isOnline}
                  className="bg-gradient-to-r from-white/25 to-white/15 hover:from-white/35 hover:to-white/25 disabled:opacity-50 px-6 sm:px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 text-sm sm:text-base"
                >
                  Try Again
                </button>
                <button
                  onClick={handleLocationUpdate}
                  disabled={!isOnline}
                  className="bg-gradient-to-r from-blue-500/25 to-purple-500/15 hover:from-blue-500/35 hover:to-purple-500/25 disabled:opacity-50 px-6 sm:px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Use Location</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Weather Display */}
        {weather && (
          <div className="space-y-6 sm:space-y-12">
            {/* Enhanced Main Weather Card */}
            <div className="glass-card p-6 sm:p-12 md:p-16 text-white text-center bounce-in relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />
              <div className="absolute top-4 right-4 opacity-20">
                <Sparkles className="w-8 h-8 sm:w-12 sm:h-12" />
              </div>

              <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-6 sm:mb-8 relative z-10">
                <MapPin className="w-5 h-5 sm:w-7 sm:h-7 text-white/90" />
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  {weather.location.name}, {weather.location.country}
                </h2>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || !isOnline}
                  className="ml-3 sm:ml-6 p-2 sm:p-3 hover:bg-white/20 rounded-full transition-all duration-300 relative group disabled:opacity-50"
                  title="Refresh weather data"
                >
                  <RotateCcw
                    className={`w-4 h-4 sm:w-6 sm:h-6 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`}
                  />
                  {isRefreshing && <div className="pulse-ring" />}
                </button>
              </div>

              <div className="mb-6 sm:mb-12 relative z-10">
                <div className="relative inline-block">
                  <img
                    src={weatherIconUrl(weather.current.icon) || "/placeholder.svg"}
                    alt={weather.current.description}
                    className="weather-icon-large mx-auto weather-icon-enhanced"
                    loading="lazy"
                  />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse opacity-75"></div>
                </div>
              </div>

              <div className="mb-6 sm:mb-10 relative z-10">
                <div className="temperature-display temperature-text font-bold mb-3 sm:mb-6 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  {convertTemperature(weather.current.temperature)}°{temperatureUnit}
                </div>
                <div className="text-2xl sm:text-4xl font-bold capitalize mb-2 sm:mb-3 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {weather.current.description}
                </div>
                <div className="text-lg sm:text-2xl text-white/90 mb-3 sm:mb-4">{weather.current.condition}</div>
                <div className="text-base sm:text-xl text-white/80">
                  Feels like {convertTemperature(weather.current.feelsLike)}°{temperatureUnit}
                </div>
              </div>

              {/* Enhanced Quick Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-6 sm:mt-12 relative z-10">
                <div className="text-center group">
                  <div className="p-3 sm:p-4 bg-white/10 rounded-2xl mb-3 mx-auto w-fit group-hover:bg-white/20 transition-all duration-300">
                    <Droplets className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-blue-300" />
                  </div>
                  <div className="text-xl sm:text-3xl font-bold">{weather.current.humidity}%</div>
                  <div className="text-sm sm:text-base text-white/80">Humidity</div>
                </div>
                <div className="text-center group">
                  <div className="p-3 sm:p-4 bg-white/10 rounded-2xl mb-3 mx-auto w-fit group-hover:bg-white/20 transition-all duration-300">
                    <Wind className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-green-300" />
                  </div>
                  <div className="text-xl sm:text-3xl font-bold">{weather.current.windSpeed}</div>
                  <div className="text-sm sm:text-base text-white/80">km/h</div>
                </div>
                <div className="text-center group">
                  <div className="p-3 sm:p-4 bg-white/10 rounded-2xl mb-3 mx-auto w-fit group-hover:bg-white/20 transition-all duration-300">
                    <Eye className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-purple-300" />
                  </div>
                  <div className="text-xl sm:text-3xl font-bold">{weather.current.visibility}</div>
                  <div className="text-sm sm:text-base text-white/80">km</div>
                </div>
              </div>
            </div>

            {/* Weather Quality Card - Only render if weather data is available */}
            {weather && weather.current && <WeatherQuality weather={weather} />}

            {/* Enhanced Forecast Tabs */}
            <div className="fade-in-up">
              <div className="flex justify-center mb-8">
                <div className="glass-card p-2 flex rounded-3xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10"></div>
                  <button
                    onClick={() => setActiveTab("daily")}
                    className={`px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold transition-all duration-300 text-sm sm:text-lg relative z-10 ${
                      activeTab === "daily"
                        ? "bg-gradient-to-r from-white/30 to-white/20 text-white shadow-2xl scale-105"
                        : "text-white/70 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    6-Day Forecast
                  </button>
                  <button
                    onClick={() => setActiveTab("hourly")}
                    className={`px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold transition-all duration-300 text-sm sm:text-lg relative z-10 ${
                      activeTab === "hourly"
                        ? "bg-gradient-to-r from-white/30 to-white/20 text-white shadow-2xl scale-105"
                        : "text-white/70 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    Hourly Forecast
                  </button>
                </div>
              </div>

              {/* Enhanced 6-Day Forecast */}
              {activeTab === "daily" && weather.forecast && weather.forecast.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                  {weather.forecast.map((day, index) => (
                    <div
                      key={index}
                      className="forecast-card group relative overflow-hidden"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent group-hover:from-white/10 transition-all duration-300"></div>
                      <div className="text-sm sm:text-lg font-bold mb-3 sm:mb-4 relative z-10">{day.dayName}</div>
                      <div className="relative z-10 mb-3 sm:mb-4">
                        <img
                          src={weatherIconUrl(day.icon) || "/placeholder.svg"}
                          alt={day.description}
                          className="w-14 h-14 sm:w-20 sm:h-20 mx-auto group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="space-y-2 sm:space-y-3 relative z-10">
                        <div className="flex justify-between items-center">
                          <span className="text-lg sm:text-2xl font-bold">{convertTemperature(day.tempMax)}°</span>
                          <span className="text-sm sm:text-lg text-white/80">{convertTemperature(day.tempMin)}°</span>
                        </div>
                        <div className="text-xs sm:text-sm text-white/90 capitalize font-medium">{day.description}</div>
                        <div className="flex justify-between text-xs sm:text-sm text-white/70">
                          <span>{day.pop}% rain</span>
                          <span>{day.windSpeed} km/h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Enhanced Hourly Forecast */}
              {activeTab === "hourly" && weather.hourly && weather.hourly.length > 0 && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Next 24 Hours
                    </h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => scrollHourly("left")}
                        className="glass-card p-3 text-white hover:bg-white/25 transition-all duration-300 group"
                      >
                        <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      </button>
                      <button
                        onClick={() => scrollHourly("right")}
                        className="glass-card p-3 text-white hover:bg-white/25 transition-all duration-300 group"
                      >
                        <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      </button>
                    </div>
                  </div>
                  <div
                    ref={hourlyScrollRef}
                    className="flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-hide pb-6"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {weather.hourly.map((hour, index) => (
                      <div
                        key={index}
                        className="forecast-card min-w-[140px] sm:min-w-[160px] group relative overflow-hidden"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent group-hover:from-white/10 transition-all duration-300"></div>
                        <div className="text-sm sm:text-base font-bold mb-3 text-white/90 relative z-10">
                          {hour.hour}
                        </div>
                        <div className="relative z-10 mb-3">
                          <img
                            src={weatherIconUrl(hour.icon) || "/placeholder.svg"}
                            alt={hour.condition}
                            className="w-12 h-12 sm:w-16 sm:h-16 mx-auto group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="space-y-2 relative z-10">
                          <div className="text-lg sm:text-2xl font-bold">
                            {convertTemperature(hour.temperature)}°{temperatureUnit}
                          </div>
                          <div className="text-xs sm:text-sm text-white/70">
                            Feels {convertTemperature(hour.feelsLike)}°
                          </div>
                          <div className="text-xs sm:text-sm text-white/70">{hour.pop}% rain</div>
                          <div className="text-xs sm:text-sm text-white/70">{hour.windSpeed} km/h</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Detailed Weather Metrics */}
            <div className="responsive-grid">
              {/* Feels Like */}
              <div className="metric-card slide-in-left group">
                <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-red-400/20 to-orange-400/10 rounded-2xl group-hover:from-red-400/30 group-hover:to-orange-400/20 transition-all duration-300">
                    <Thermometer className="w-5 h-5 sm:w-7 sm:h-7 text-red-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold">Feels Like</div>
                    <div className="text-white/80 text-sm sm:text-base">Apparent temperature</div>
                  </div>
                </div>
                <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
                  {convertTemperature(weather.current.feelsLike)}°{temperatureUnit}
                </div>
                <div className="text-sm sm:text-base text-white/70 mt-2 sm:mt-3">
                  {weather.current.feelsLike > weather.current.temperature
                    ? "Warmer than actual"
                    : "Cooler than actual"}
                </div>
              </div>

              {/* Wind Details */}
              <div className="metric-card slide-in-left group" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-green-400/20 to-blue-400/10 rounded-2xl group-hover:from-green-400/30 group-hover:to-blue-400/20 transition-all duration-300">
                    <Compass className="w-5 h-5 sm:w-7 sm:h-7 text-green-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold">Wind</div>
                    <div className="text-white/80 text-sm sm:text-base">Speed & Direction</div>
                  </div>
                </div>
                <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                  {weather.current.windSpeed} km/h
                </div>
                <div className="text-sm sm:text-base text-white/70 mt-2 sm:mt-3">
                  From {getWindDirection(weather.current.windDirection)} ({weather.current.windDirection}°)
                </div>
              </div>

              {/* Pressure */}
              <div className="metric-card slide-in-left group" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-400/20 to-yellow-400/10 rounded-2xl group-hover:from-orange-400/30 group-hover:to-yellow-400/20 transition-all duration-300">
                    <Gauge className="w-5 h-5 sm:w-7 sm:h-7 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold">Pressure</div>
                    <div className="text-white/80 text-sm sm:text-base">Atmospheric pressure</div>
                  </div>
                </div>
                <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                  {weather.current.pressure}
                </div>
                <div className="text-sm sm:text-base text-white/70 mt-2 sm:mt-3">hPa</div>
              </div>

              {/* Humidity Details */}
              <div className="metric-card slide-in-right group">
                <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-400/20 to-cyan-400/10 rounded-2xl group-hover:from-blue-400/30 group-hover:to-cyan-400/20 transition-all duration-300">
                    <Droplets className="w-5 h-5 sm:w-7 sm:h-7 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold">Humidity</div>
                    <div className="text-white/80 text-sm sm:text-base">Relative humidity</div>
                  </div>
                </div>
                <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {weather.current.humidity}%
                </div>
                <div className="text-sm sm:text-base text-white/70 mt-2 sm:mt-3">
                  {weather.current.humidity > 70 ? "Very humid" : weather.current.humidity > 40 ? "Comfortable" : "Dry"}
                </div>
              </div>

              {/* Visibility */}
              <div className="metric-card slide-in-right group" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-400/20 to-pink-400/10 rounded-2xl group-hover:from-purple-400/30 group-hover:to-pink-400/20 transition-all duration-300">
                    <Eye className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold">Visibility</div>
                    <div className="text-white/80 text-sm sm:text-base">How far you can see</div>
                  </div>
                </div>
                <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  {weather.current.visibility} km
                </div>
                <div className="text-sm sm:text-base text-white/70 mt-2 sm:mt-3">
                  {weather.current.visibility > 10 ? "Excellent" : weather.current.visibility > 5 ? "Good" : "Poor"}
                </div>
              </div>

              {/* Sun Times */}
              <div className="metric-card slide-in-right group" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-400/20 to-orange-400/10 rounded-2xl group-hover:from-yellow-400/30 group-hover:to-orange-400/20 transition-all duration-300">
                    {isNightTime ? (
                      <Moon className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-400" />
                    ) : (
                      <Sun className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold">Sun Times</div>
                    <div className="text-white/80 text-sm sm:text-base">Sunrise & Sunset</div>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Sunrise className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                      <span className="text-white/80 text-sm sm:text-base">Sunrise</span>
                    </div>
                    <span className="font-bold text-base sm:text-lg">
                      {new Date(weather.current.sunrise * 1000).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Sunset className="w-4 h-4 sm:w-5 sm:h-5 text-orange-300" />
                      <span className="text-white/80 text-sm sm:text-base">Sunset</span>
                    </div>
                    <span className="font-bold text-base sm:text-lg">
                      {new Date(weather.current.sunset * 1000).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite Locations */}
            {favoriteLocations.length > 0 && (
              <div className="fade-in-up">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Favorite Locations
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {favoriteLocations.map((location, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionSelect(location)}
                      className="glass-card p-4 text-white hover:bg-white/15 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <MapPin className="w-4 h-4 text-white/70" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(location)
                          }}
                          className="p-1 hover:bg-white/20 rounded-full transition-all duration-200"
                        >
                          <BookmarkCheck className="w-4 h-4 text-yellow-400" />
                        </button>
                      </div>
                      <div className="text-sm font-semibold truncate">{location.name}</div>
                      <div className="text-xs text-white/70 truncate">{location.country}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Last Updated */}
            <div className="glass-card p-4 sm:p-8 text-white text-center fade-in-up relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10"></div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-white/80 text-sm sm:text-lg relative z-10">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Last updated: {currentTime.toLocaleString()}</span>
                <Sparkles className="w-4 h-4 opacity-60" />
              </div>
              {autoRefresh && (
                <div className="text-xs text-white/60 mt-2">
                  Auto-refresh enabled • Next update in {Math.ceil((600000 - (Date.now() % 600000)) / 60000)} minutes
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Footer */}
        <footer className="text-center mt-12 sm:mt-20 text-white/70 space-y-3 sm:space-y-4">
          
{/* Developer Links */}
<div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
  <span className="text-white/60">Developed by Sujan Das</span>
  <div className="flex items-center space-x-4">
    <a
      href="https://github.com/devsujandas"
      target="_blank"
      rel="noopener noreferrer"
      className="text-white/60 hover:text-white transition-colors duration-300 flex items-center space-x-1"
    >
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" className="w-4 h-4" />
      <span>GitHub</span>
    </a>
    <a
      href="https://in.linkedin.com/in/devsujandas"
      target="_blank"
      rel="noopener noreferrer"
      className="text-white/60 hover:text-white transition-colors duration-300 flex items-center space-x-1"
    >
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" alt="LinkedIn" className="w-4 h-4" />
      <span>LinkedIn</span>
    </a>
    <a
      href="https://www.sujandas.info/"
      target="_blank"
      rel="noopener noreferrer"
      className="text-white/60 hover:text-white transition-colors duration-300 flex items-center space-x-1"
    >
      <img src="https://cdn-icons-png.flaticon.com/512/69/69524.png" alt="Portfolio" className="w-4 h-4" />
      <span>Portfolio</span>
    </a>
  </div>
</div>

          <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Powered by OpenWeatherMap API</span>
            <Star className="w-3 h-3 animate-pulse" />
          </div>


          <div className="text-xs text-white/50">v2.1.3 • Enhanced with better performance and error handling</div>
        </footer>
      </div>
    </div>
  )
}

export default function WeatherNow() {
  return (
    <ErrorBoundary>
      <WeatherApp />
    </ErrorBoundary>
  )
}
