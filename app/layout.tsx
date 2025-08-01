import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "Weather Now - Beautiful Real-time Weather App",
  description:
    "Beautiful, real-time weather app with location detection, city search, and stunning glassmorphism design. Get accurate weather forecasts with hourly and 5-day predictions.",
  keywords:
    "weather, forecast, temperature, humidity, wind, weather app, real-time weather, weather forecast, glassmorphism",
  authors: [{ name: "Weather Now", url: "https://github.com/weather-now" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Weather Now - Beautiful Real-time Weather App",
    description: "Get accurate weather forecasts with stunning glassmorphism design",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weather Now - Beautiful Real-time Weather App",
    description: "Get accurate weather forecasts with stunning glassmorphism design",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="preconnect" href="https://api.openweathermap.org" />
        <link rel="preconnect" href="https://openweathermap.org" />
        <link rel="dns-prefetch" href="https://api.openweathermap.org" />
        <link rel="dns-prefetch" href="https://openweathermap.org" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
