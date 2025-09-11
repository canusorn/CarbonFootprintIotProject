# Carbon Footprint Dashboard - Frontend

A Vue.js 3 dashboard application for monitoring real-time energy consumption and CO2 emissions from 3-phase electrical meters.

## Features

### 🌟 Real-time Monitoring
- **3-Phase Energy Monitoring**: Real-time visualization of energy consumption across three electrical phases
- **CO2 Emission Calculation**: Automatic calculation based on configurable emission factors
- **Live Data Updates**: Real-time updates via MQTT and REST API integration

### 📊 Dashboard Components
- **Overview Cards**: Total emissions, Scope 1/2/3 emissions with trend indicators
- **Interactive Charts**: 
  - Doughnut chart for emission sources breakdown
  - Real-time line charts for energy consumption
  - Bar charts for branch and activity-based emissions
  - Historical trend analysis
- **Responsive Design**: Optimized for desktop and mobile viewing

### 🔄 Data Communication
- **REST API Integration**: HTTP requests to backend for data retrieval
- **MQTT Client**: Real-time data streaming from IoT devices
- **Data Simulation**: Built-in simulator for development and demo purposes

## Technology Stack

- **Frontend Framework**: Vue.js 3 with Composition API
- **UI Components**: PrimeVue 3.x with Lara theme
- **Charts**: Chart.js for data visualization
- **Build Tool**: Vite for fast development and building
- **Styling**: PrimeFlex for responsive layouts

## Project Structure

```
vue/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable Vue components
│   ├── views/          # Page components
│   │   └── Dashboard.vue # Main dashboard view
│   ├── services/       # API and service layers
│   │   ├── EnergyService.js   # REST API client
│   │   ├── MqttService.js     # MQTT client
│   │   └── DataSimulator.js   # Demo data generator
│   ├── App.vue         # Root component
│   ├── main.js         # Application entry point
│   └── router.js       # Vue Router configuration
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
└── vite.config.js      # Vite configuration
```

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Backend server running on port 3000
- MQTT broker running on port 1883

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Configuration
The application automatically detects the environment:
- **Development**: Uses localhost endpoints
- **Production**: Configurable API and MQTT endpoints

## Usage

### Development Mode
1. Start the backend server (`node server.js` in the `node/` folder)
2. Start the frontend development server (`npm run dev`)
3. Open http://localhost:8080 in your browser

### Demo Mode
The application includes a built-in data simulator that generates realistic energy consumption patterns when the backend or MQTT broker is unavailable.

## Configuration

### API Endpoints
- Default API base URL: `http://localhost:3000/api`
- Configurable in `services/EnergyService.js`

### MQTT Settings
- Default MQTT broker: `ws://localhost:1883`
- Configurable in `services/MqttService.js`

### Emission Factors
Default emission factor: 0.5 gCO2e/kWh (Thailand electricity grid average)
- Configurable via API or hardcoded in services

## Key Components

### Dashboard.vue
Main dashboard component featuring:
- Real-time energy consumption cards
- Emission scope breakdown
- Interactive charts and graphs
- Connection status indicators

### EnergyService.js
Handles REST API communication:
- Current energy data retrieval
- Historical data fetching
- Emission factor configuration
- Alert threshold management

### MqttService.js
Manages MQTT real-time communication:
- Broker connection management
- Topic subscription handling
- Message publishing capabilities
- Auto-reconnection logic

### DataSimulator.js
Generates realistic demo data:
- 3-phase energy consumption simulation
- Daily demand pattern modeling
- CO2 emission calculations
- Alert generation

## Data Flow

1. **IoT Devices** → MQTT Broker → **Frontend** (real-time updates)
2. **Frontend** → REST API → **Backend** → Database (data persistence)
3. **Frontend** ← REST API ← **Backend** (historical data)
4. **Data Simulator** → **Frontend** (demo mode)

## Chart Types

### Energy Consumption Line Chart
- Real-time updates every 3 seconds
- Shows last 10 data points per phase
- Smooth line interpolation with area fill

### Emission Source Doughnut Chart
- Scope 1, 2, 3 emission breakdown
- Interactive hover effects
- Color-coded categories

### Branch Performance Bar Chart
- Geographic emission comparison
- Horizontal bar layout
- Custom color schemes

### Historical Trend Chart
- Monthly stacked bar chart
- Multi-scope emission tracking
- Year-over-year comparison

## Performance Features

- **Lazy Loading**: Components loaded on demand
- **Real-time Optimization**: Efficient MQTT message handling
- **Chart Performance**: Optimized Chart.js configurations
- **Responsive Design**: Mobile-first approach with PrimeFlex

## Development Guidelines

### Code Style
- Vue 3 Composition API
- ES6+ JavaScript features
- Component-based architecture
- Reactive data patterns

### Best Practices
- Error handling for all service calls
- Graceful degradation when services unavailable
- Responsive design considerations
- Accessibility compliance

## Troubleshooting

### Common Issues

1. **MQTT Connection Failed**
   - Check if MQTT broker is running on port 1883
   - Verify WebSocket support in broker configuration
   - Application falls back to demo mode automatically

2. **API Connection Issues**
   - Ensure backend server is running on port 3000
   - Check CORS configuration if accessing from different domain
   - Review network connectivity and firewall settings

3. **Chart Display Problems**
   - Verify Chart.js dependencies are installed
   - Check browser console for JavaScript errors
   - Ensure data format matches chart expectations

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Custom dashboard layouts
- [ ] Advanced analytics and reporting
- [ ] Mobile application support
- [ ] Multi-language support
- [ ] Dark theme option
- [ ] Export functionality for charts and data

## Contributing

1. Follow Vue.js style guide
2. Use PrimeVue components consistently
3. Maintain responsive design principles
4. Add proper error handling
5. Update documentation for new features