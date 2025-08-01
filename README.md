# Weather Now 🌤️

A beautiful, modern weather web app built with Next.js 14, TypeScript, and Tailwind CSS. Features automatic location detection, city search, and a stunning glassmorphism design.

## ✨ Features

- 🌍 **Auto Location Detection** - Automatically detects your location on first load
- 🔍 **City Search** - Search weather for any city worldwide
- 🎨 **Beautiful Design** - Modern glassmorphism UI with smooth animations
- 📱 **Fully Responsive** - Perfect on mobile, tablet, and desktop
- 🌡️ **Real-time Data** - Live weather data from OpenWeatherMap
- ⚡ **Fast & Smooth** - Built with Next.js 14 App Router for optimal performance

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd weather-now
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Create a \`.env.local\` file in the root directory:
\`\`\`env
WEATHER_API_KEY=your_openweathermap_api_key_here
\`\`\`

Note: The API key is now server-side only for security. Get your free API key from [OpenWeatherMap](https://openweathermap.org/api).

4. Run the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Built With

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **OpenWeatherMap API** - Weather data provider

## 📱 Design Features

- **Glassmorphism Effects** - Translucent cards with backdrop blur
- **Dynamic Backgrounds** - Background changes based on weather conditions
- **Smooth Animations** - Fade-in, slide-up, and glow effects
- **Mobile-First** - Responsive design that works on all devices
- **Clean Typography** - Large, readable fonts with proper hierarchy

## 🌐 API Integration

The app uses the OpenWeatherMap API to fetch real-time weather data. You need to provide your own API key in the \`.env.local\` file.

## 📂 Project Structure

\`\`\`
weather-now/
├── app/
│   ├── favicon.ico          # Site icon
│   ├── globals.css          # Global styles and animations
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main weather page
├── public/
│   └── icons/               # Optional weather icons
├── .env.local               # Environment variables
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
\`\`\`

## 🎯 Usage

1. **Automatic Location**: On first load, the app will request your location permission
2. **Manual Search**: Use the search bar to find weather for any city
3. **Refresh Data**: Click the refresh icon to update weather information
4. **Responsive Design**: Works perfectly on all screen sizes

## 🔧 Customization

- **Colors**: Modify the gradient backgrounds in the \`getWeatherGradient\` function
- **Animations**: Adjust animation timings in \`globals.css\`
- **Layout**: Customize the responsive grid in the weather details section

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

Built with ❤️ using Next.js 14 and Tailwind CSS
