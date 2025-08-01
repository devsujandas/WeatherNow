"use server"

const API_KEY = process.env.WEATHER_API_KEY || process.env.NEXT_PUBLIC_WEATHER_API_KEY
const API_BASE = "https://api.openweathermap.org/data/2.5"
const GEO_API_BASE = "https://api.openweathermap.org/geo/1.0"

export interface WeatherData {
  location: {
    name: string
    country: string
    region?: string
    lat: number
    lon: number
    timezone?: string
  }
  current: {
    temperature: number
    feelsLike: number
    condition: string
    description: string
    humidity: number
    windSpeed: number
    windDirection: number
    visibility: number
    pressure: number
    uvIndex: number
    icon: string
    sunrise: number
    sunset: number
    cloudiness: number
    dewPoint: number
  }
  forecast?: ForecastDay[]
  hourly?: HourlyForecast[]
  alerts?: WeatherAlert[]
}

export interface ForecastDay {
  date: string
  dayName: string
  tempMax: number
  tempMin: number
  condition: string
  description: string
  icon: string
  humidity: number
  windSpeed: number
  pop: number
  pressure: number
  uvIndex: number
}

export interface HourlyForecast {
  time: string
  hour: string
  temperature: number
  condition: string
  icon: string
  pop: number
  windSpeed: number
  humidity: number
  feelsLike: number
}

export interface LocationSuggestion {
  name: string
  country: string
  region?: string
  lat: number
  lon: number
  displayName: string
}

export interface WeatherAlert {
  event: string
  description: string
  start: number
  end: number
  severity: "minor" | "moderate" | "severe" | "extreme"
}

// Enhanced error handling
class WeatherError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message)
    this.name = "WeatherError"
  }
}

// Retry mechanism for API calls with better error handling
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  console.log(`Attempting to fetch: ${url}`)

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "WeatherNow/1.0",
          Accept: "application/json",
        },
        cache: "no-store",
      })

      console.log(`Response status: ${response.status} ${response.statusText}`)

      if (response.ok) {
        return response
      }

      // Handle specific error cases
      if (response.status === 401) {
        throw new WeatherError("Invalid API key. Please check your OpenWeatherMap API key.", "INVALID_API_KEY", 401)
      }

      if (response.status === 404) {
        throw new WeatherError("Location not found. Please check the city name.", "LOCATION_NOT_FOUND", 404)
      }

      if (response.status === 429) {
        console.log(`Rate limited, retrying in ${1000 * (i + 1)}ms...`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }

      if (response.status >= 500 && i < retries - 1) {
        console.log(`Server error, retrying in ${500 * (i + 1)}ms...`)
        await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)))
        continue
      }

      // Try to get error message from response
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = `API Error: ${errorData.message}`
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }

      throw new WeatherError(errorMessage, "API_ERROR", response.status)
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed:`, error)

      if (error instanceof WeatherError) {
        throw error
      }

      if (i === retries - 1) {
        throw new WeatherError(
          `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
          "NETWORK_ERROR",
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)))
    }
  }

  throw new WeatherError("Max retries exceeded", "RETRY_FAILED")
}

// Enhanced data transformation with better error handling
function transformWeatherData(currentData: any, forecastData?: any): WeatherData {
  try {
    console.log("Transforming weather data:", {
      hasCurrentData: !!currentData,
      hasForecastData: !!forecastData,
      currentDataKeys: currentData ? Object.keys(currentData) : [],
    })

    if (
      !currentData ||
      !currentData.main ||
      !currentData.weather ||
      !Array.isArray(currentData.weather) ||
      currentData.weather.length === 0
    ) {
      console.error("Invalid current weather data structure:", currentData)
      throw new WeatherError("Invalid current weather data structure", "INVALID_DATA")
    }

    const forecast: ForecastDay[] = []
    const hourly: HourlyForecast[] = []

    if (forecastData?.list && Array.isArray(forecastData.list)) {
      const dailyForecasts = forecastData.list.filter((_: any, index: number) => index % 8 === 4).slice(0, 6)

      dailyForecasts.forEach((item: any) => {
        if (item && item.main && item.weather && Array.isArray(item.weather) && item.weather.length > 0) {
          const date = new Date(item.dt * 1000)
          forecast.push({
            date: date.toISOString().split("T")[0],
            dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
            tempMax: Math.round(item.main.temp_max || 0),
            tempMin: Math.round(item.main.temp_min || 0),
            condition: item.weather[0].main || "Unknown",
            description: item.weather[0].description || "Unknown",
            icon: item.weather[0].icon || "01d",
            humidity: item.main.humidity || 0,
            windSpeed: Math.round((item.wind?.speed || 0) * 3.6),
            pop: Math.round((item.pop || 0) * 100),
            pressure: item.main.pressure || 0,
            uvIndex: 0,
          })
        }
      })

      const hourlyForecasts = forecastData.list.slice(0, 8)

      hourlyForecasts.forEach((item: any) => {
        if (item && item.main && item.weather && Array.isArray(item.weather) && item.weather.length > 0) {
          const date = new Date(item.dt * 1000)
          hourly.push({
            time: item.dt_txt || "",
            hour: date.toLocaleTimeString("en-US", {
              hour: "numeric",
              hour12: true,
            }),
            temperature: Math.round(item.main.temp || 0),
            condition: item.weather[0].main || "Unknown",
            icon: item.weather[0].icon || "01d",
            pop: Math.round((item.pop || 0) * 100),
            windSpeed: Math.round((item.wind?.speed || 0) * 3.6),
            humidity: item.main.humidity || 0,
            feelsLike: Math.round(item.main.feels_like || 0),
          })
        }
      })
    }

    const weatherData: WeatherData = {
      location: {
        name: currentData.name || "Unknown",
        country: currentData.sys?.country || "Unknown",
        lat: currentData.coord?.lat || 0,
        lon: currentData.coord?.lon || 0,
        timezone: currentData.timezone
          ? `UTC${currentData.timezone >= 0 ? "+" : ""}${Math.round(currentData.timezone / 3600)}`
          : undefined,
      },
      current: {
        temperature: Math.round(currentData.main?.temp || 0),
        feelsLike: Math.round(currentData.main?.feels_like || 0),
        condition: currentData.weather[0]?.main || "Unknown",
        description: currentData.weather[0]?.description || "Unknown",
        humidity: currentData.main?.humidity || 0,
        windSpeed: Math.round((currentData.wind?.speed || 0) * 3.6),
        windDirection: currentData.wind?.deg || 0,
        visibility: Math.round((currentData.visibility || 10000) / 1000),
        pressure: currentData.main?.pressure || 1013,
        uvIndex: 0,
        icon: currentData.weather[0]?.icon || "01d",
        sunrise: currentData.sys?.sunrise || 0,
        sunset: currentData.sys?.sunset || 0,
        cloudiness: currentData.clouds?.all || 0,
        dewPoint: Math.round((currentData.main?.temp || 0) - (100 - (currentData.main?.humidity || 50)) / 5),
      },
      forecast,
      hourly,
      alerts: [],
    }

    console.log("Weather data transformed successfully")
    return weatherData
  } catch (error) {
    console.error("Error transforming weather data:", error)
    throw new WeatherError("Failed to process weather data", "TRANSFORM_ERROR")
  }
}

export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  console.log(`Getting weather by coordinates: ${lat}, ${lon}`)

  if (!API_KEY) {
    console.error("API key not found in environment variables")
    throw new WeatherError(
      "Weather API key is not configured. Please add WEATHER_API_KEY to your environment variables.",
      "CONFIG_ERROR",
    )
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new WeatherError("Invalid coordinates provided", "INVALID_COORDS")
  }

  try {
    const currentUrl = `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    const forecastUrl = `${API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`

    const [currentResponse, forecastResponse] = await Promise.all([
      fetchWithRetry(currentUrl),
      fetchWithRetry(forecastUrl),
    ])

    const [currentData, forecastData] = await Promise.all([currentResponse.json(), forecastResponse.json()])

    console.log("API responses received successfully")
    return transformWeatherData(currentData, forecastData)
  } catch (error) {
    console.error("Weather API error:", error)
    if (error instanceof WeatherError) {
      throw error
    }
    throw new WeatherError("Unable to fetch weather data", "FETCH_ERROR")
  }
}

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  console.log(`Getting weather by city: ${city}`)

  if (!API_KEY) {
    console.error("API key not found in environment variables")
    throw new WeatherError(
      "Weather API key is not configured. Please add WEATHER_API_KEY to your environment variables.",
      "CONFIG_ERROR",
    )
  }

  if (!city || city.trim().length < 2) {
    throw new WeatherError("Please provide a valid city name", "INVALID_CITY")
  }

  const sanitizedCity = city.trim().slice(0, 100)

  try {
    const currentUrl = `${API_BASE}/weather?q=${encodeURIComponent(sanitizedCity)}&appid=${API_KEY}&units=metric`
    const forecastUrl = `${API_BASE}/forecast?q=${encodeURIComponent(sanitizedCity)}&appid=${API_KEY}&units=metric`

    console.log(`Making API calls for city: ${sanitizedCity}`)

    const [currentResponse, forecastResponse] = await Promise.all([
      fetchWithRetry(currentUrl),
      fetchWithRetry(forecastUrl),
    ])

    const [currentData, forecastData] = await Promise.all([currentResponse.json(), forecastResponse.json()])

    console.log("City weather API responses received successfully")
    return transformWeatherData(currentData, forecastData)
  } catch (error) {
    console.error("Weather API error:", error)
    if (error instanceof WeatherError) {
      throw error
    }
    throw new WeatherError("Unable to fetch weather data", "FETCH_ERROR")
  }
}

export async function getLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  console.log(`Getting location suggestions for: ${query}`)

  if (!API_KEY) {
    console.warn("API key not found, returning empty suggestions")
    return []
  }

  if (!query || query.trim().length < 2) {
    return []
  }

  const sanitizedQuery = query.trim().slice(0, 50)

  try {
    const url = `${GEO_API_BASE}/direct?q=${encodeURIComponent(sanitizedQuery)}&limit=8&appid=${API_KEY}`
    const response = await fetchWithRetry(url)
    const data = await response.json()

    if (!Array.isArray(data)) {
      console.warn("Location suggestions response is not an array:", data)
      return []
    }

    const suggestions = data.map((item: any) => ({
      name: item.name || "Unknown",
      country: item.country || "Unknown",
      region: item.state,
      lat: item.lat || 0,
      lon: item.lon || 0,
      displayName: `${item.name}${item.state ? `, ${item.state}` : ""}, ${item.country}`,
    }))

    console.log(`Found ${suggestions.length} location suggestions`)
    return suggestions
  } catch (error) {
    console.error("Error fetching location suggestions:", error)
    return []
  }
}

export async function getWeatherQuality(weather: WeatherData): Promise<{
  score: number
  label: string
  color: string
  factors: string[]
}> {
  if (!weather || !weather.current) {
    return {
      score: 0,
      label: "Unknown",
      color: "text-gray-400",
      factors: ["Weather data unavailable"],
    }
  }

  let score = 50
  const factors: string[] = []

  try {
    const temp = weather.current.temperature || 0
    if (temp >= 20 && temp <= 25) {
      score += 20
      factors.push("Perfect temperature")
    } else if (temp >= 15 && temp <= 30) {
      score += 10
      factors.push("Comfortable temperature")
    } else if (temp < 0 || temp > 35) {
      score -= 20
      factors.push("Extreme temperature")
    }

    const humidity = weather.current.humidity || 0
    if (humidity >= 40 && humidity <= 60) {
      score += 15
      factors.push("Ideal humidity")
    } else if (humidity < 30 || humidity > 70) {
      score -= 10
      factors.push(humidity < 30 ? "Very dry" : "Very humid")
    }

    const windSpeed = weather.current.windSpeed || 0
    if (windSpeed < 10) {
      score += 10
      factors.push("Calm winds")
    } else if (windSpeed > 30) {
      score -= 15
      factors.push("Strong winds")
    }

    const condition = (weather.current.condition || "").toLowerCase()
    if (condition === "clear") {
      score += 15
      factors.push("Clear skies")
    } else if (condition === "clouds") {
      score += 5
      factors.push("Partly cloudy")
    } else if (condition.includes("rain") || condition.includes("storm")) {
      score -= 20
      factors.push("Rainy weather")
    }

    const visibility = weather.current.visibility || 0
    if (visibility >= 10) {
      score += 5
      factors.push("Excellent visibility")
    } else if (visibility < 5) {
      score -= 10
      factors.push("Poor visibility")
    }

    score = Math.max(0, Math.min(100, score))

    let label: string
    let color: string

    if (score >= 80) {
      label = "Excellent"
      color = "text-green-400"
    } else if (score >= 60) {
      label = "Good"
      color = "text-blue-400"
    } else if (score >= 40) {
      label = "Fair"
      color = "text-yellow-400"
    } else if (score >= 20) {
      label = "Poor"
      color = "text-orange-400"
    } else {
      label = "Very Poor"
      color = "text-red-400"
    }

    return { score, label, color, factors }
  } catch (error) {
    console.error("Error calculating weather quality:", error)
    return {
      score: 0,
      label: "Error",
      color: "text-red-400",
      factors: ["Unable to calculate quality"],
    }
  }
}

// Test function to check API connectivity
export async function testApiConnection(): Promise<{ success: boolean; message: string }> {
  console.log("Testing API connection...")

  if (!API_KEY) {
    return {
      success: false,
      message: "API key not configured. Please add WEATHER_API_KEY to your environment variables.",
    }
  }

  try {
    // Test with a simple weather request for London
    const testUrl = `${API_BASE}/weather?q=London&appid=${API_KEY}&units=metric`
    const response = await fetchWithRetry(testUrl, 1)
    const data = await response.json()

    if (data && data.main && data.weather) {
      return {
        success: true,
        message: "API connection successful!",
      }
    } else {
      return {
        success: false,
        message: "API returned invalid data structure",
      }
    }
  } catch (error) {
    console.error("API test failed:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown API error",
    }
  }
}
