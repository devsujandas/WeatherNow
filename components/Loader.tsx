export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div
          className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin animate-reverse"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 animate-pulse">Getting weather data...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This may take a few seconds</p>
      </div>
    </div>
  )
}
