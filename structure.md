# Carbon Footprint IoT Project - Structure Documentation

## Project Overview

The Carbon Footprint IoT Project is a comprehensive IoT solution for monitoring and managing energy consumption using ESP32 devices, MQTT communication, and a modern web interface. The project follows a microservice architecture with separate frontend and backend components.

## Project Architecture

```
CarbonFootprintIotProject/
├── Backend (Node.js)     - REST API & MQTT Broker
├── Frontend (Vue.js)     - Web Application Interface
├── ESP32 Devices         - IoT Sensor Hardware
└── Database (MySQL)      - Data Storage & Management
```

## Folder Structure

```
CarbonFootprintIotProject/
├── .gitattributes
├── .gitignore
├── README.md
├── api.md                          # API Documentation
├── diagram.drawio                  # System Architecture Diagram
├── package.json                    # Root package configuration
├── package-lock.json
├── line_oa_chat_250911_105022.jpg  # Project reference image
│
├── .qoder/                         # Qoder IDE configuration
│   └── rules/
│       └── projectcarbonfootprint.md
│
├── .trae/                          # Trae AI configuration
│   └── rules/
│       └── project_rules.md
│
├── node/                           # Backend (Node.js + Express + MQTT)
│   ├── .env.example               # Environment variables template
│   ├── README.md
│   ├── package.json               # Backend dependencies
│   ├── package-lock.json
│   ├── server.js                  # Main server entry point
│   ├── test-reconnection.js       # Database reconnection testing
│   │
│   ├── config/
│   │   └── database.js            # MySQL database configuration
│   │
│   ├── middleware/
│   │   └── auth.js                # JWT authentication middleware
│   │
│   ├── models/
│   │   └── User.js                # User data model
│   │
│   ├── routes/
│   │   ├── auth.js                # Authentication routes
│   │   └── devices.js             # Device management routes
│   │
│   ├── services/
│   │   ├── deviceService.js       # Device business logic
│   │   └── sensorService.js       # Sensor data processing
│   │
│   └── utils/
│       └── validation.js          # Input validation utilities
│
├── vue/                           # Frontend (Vue.js 3 + PrimeVue)
│   ├── .editorconfig
│   ├── .gitattributes
│   ├── .gitignore
│   ├── README.md
│   ├── package.json               # Frontend dependencies
│   ├── package-lock.json
│   ├── index.html                 # Main HTML template
│   ├── vite.config.js             # Vite build configuration
│   ├── jsconfig.json              # JavaScript configuration
│   ├── eslint.config.js           # ESLint configuration
│   │
│   ├── .vscode/
│   │   └── extensions.json        # VS Code extensions
│   │
│   ├── public/
│   │   └── favicon.ico
│   │
│   └── src/
│       ├── App.vue                # Root Vue component
│       ├── main.js                # Application entry point
│       │
│       ├── assets/
│       │   ├── main.css           # Global styles
│       │   └── datepicker-styles.css
│       │
│       ├── components/            # Reusable Vue components
│       │   ├── CO2Card.vue        # CO2 emission display
│       │   ├── DailyEnergyChart.vue
│       │   ├── DataCard.vue       # Generic data display card
│       │   ├── EnergyCard.vue     # Energy consumption display
│       │   ├── LoginForm.vue      # User authentication form
│       │   ├── MonthlyEnergyChart.vue
│       │   └── RegisterForm.vue   # User registration form
│       │
│       ├── router/
│       │   └── index.js           # Vue Router configuration
│       │
│       ├── services/
│       │   ├── README.md
│       │   └── co2Calculator.js   # CO2 calculation utilities
│       │
│       ├── store/                 # State management (empty)
│       │
│       └── views/                 # Page components
│           ├── HomeView.vue       # Landing/Login page
│           ├── DevicesView.vue    # Device management page
│           └── DashboardView.vue  # Main dashboard interface
│
└── esp32/                         # ESP32 Device Code
    └── dtsu666/
        └── dtsu666.ino            # Arduino code for DTSU666 power meter
```

## Technology Stack

### Backend (Node.js)
- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **MQTT Broker**: Aedes 0.51.3
- **Database**: MySQL with mysql2 3.6.5
- **Authentication**: JWT (jsonwebtoken 9.0.2) + bcryptjs 3.0.2
- **Environment**: dotenv 16.3.1
- **WebSocket**: ws 8.18.3
- **MQTT Client**: mqtt 5.14.1
- **Development**: nodemon 3.1.10

**Key Features:**
- RESTful API endpoints for device and sensor data management
- MQTT broker for real-time IoT communication
- JWT-based authentication (no expiration)
- MySQL database integration with connection pooling
- Real-time ESP device connection status tracking
- Modular architecture with services, routes, and middleware

### Frontend (Vue.js)
- **Framework**: Vue.js 3.5.18
- **UI Library**: PrimeVue 4.3.9 with Aura theme
- **Icons**: PrimeIcons 7.0.0
- **Routing**: Vue Router 4.5.1
- **HTTP Client**: Axios 1.11.0
- **Charts**: Chart.js 4.5.0 + Vue-ChartJS 5.3.2
- **MQTT Client**: mqtt 5.14.1
- **Build Tool**: Vite 7.1.5
- **Linting**: ESLint 9.31.0

**Key Features:**
- Modern Vue 3 Composition API
- Responsive design with PrimeVue components
- Real-time data visualization with Chart.js
- MQTT client for live sensor data updates
- JWT-based authentication with route guards
- Device management and monitoring interface

### ESP32 Device
- **Platform**: Arduino IDE for ESP32
- **Microcontroller**: ESP32 with WiFi capability
- **Communication**: MQTT client + Modbus RTU
- **Display**: OLED SSD1306 128x64
- **Power Meter**: DTSU666 via RS485/Modbus
- **Libraries**:
  - WiFi.h - WiFi connectivity
  - MQTT.h - MQTT communication
  - ModbusMaster.h - Modbus RTU protocol
  - Adafruit_SSD1306.h - OLED display
  - WebServer.h - OTA updates

**Key Features:**
- Real-time power meter data reading via Modbus
- MQTT publishing of sensor data every 5 seconds
- Remote device control via MQTT commands
- OLED display for local data visualization
- OTA (Over-The-Air) firmware updates
- Automatic WiFi reconnection and MQTT resubscription

## System Communication Flow

### Data Flow Architecture
```
ESP32 Device → MQTT Broker (Aedes) → Node.js Backend → MySQL Database
     ↓                                        ↓
OLED Display                           Vue.js Frontend ← HTTP API
     ↑                                        ↑
Control Commands ← MQTT ← Backend ← User Interface
```

### Communication Protocols

1. **ESP32 ↔ Backend**
   - Protocol: MQTT over TCP
   - Port: 1883
   - Topics:
     - `{espid}/data` - Sensor data publishing
     - `{espid}/control` - Device control commands
     - `{espid}/confirm` - Command confirmations
     - `{espid}/status` - Connection status

2. **Frontend ↔ Backend**
   - Protocol: HTTP/HTTPS REST API
   - Port: 3000
   - Authentication: JWT Bearer tokens
   - Real-time updates: MQTT WebSocket client

3. **ESP32 ↔ Power Meter**
   - Protocol: Modbus RTU over RS485
   - Baud Rate: 9600
   - Data: Voltage, Current, Power, Energy readings

## Database Schema

### Main Database (carbon_footprint_db)
- **users**: User authentication (id, email, password_hash, timestamps)
- **device**: ESP device registry (id, espid, name, username, date)

### Sensor Data (Time Series)
- **sensor_data_{espid}**: Individual tables per ESP device
- **Columns**: timestamp, voltage (Va,Vb,Vc), current (Ia,Ib,Ic), power (Pa,Pb,Pc), power_factor, frequency, energy

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Device Management
- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get device details
- `PUT /api/devices/:id` - Update device
- `POST /api/devices/:id/control` - Control device
- `GET /api/devices/:espid/status` - Get connection status

### Sensor Data
- `GET /api/sensor-data/:espId` - Get sensor data
- `GET /api/sensor-data/:espId/latest` - Latest readings
- `GET /api/sensor-data/:espId/history` - Historical data
- `GET /api/daily-energy/:espId` - Daily energy data
- `GET /api/today-energy/:espId` - Today's energy
- `GET /api/today-power/:espId` - Today's power
- `GET /api/monthly-energy/:espId` - Monthly energy

## Security Features

### Authentication & Authorization
- JWT tokens with no expiration for persistent sessions
- bcrypt password hashing (salt rounds: 10)
- Protected routes with authentication middleware
- CORS configuration for cross-origin requests

### Data Validation
- Input validation for ESP ID format
- Power meter data validation
- SQL injection prevention with parameterized queries
- Environment variable configuration for sensitive data

## Development & Deployment

### Environment Configuration
```bash
# Backend (.env)
PORT=3000
MQTT_PORT=1883
WS_PORT=8083
DB_HOST=localhost
DB_PORT=3306
DB_NAME=carbon_footprint_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

### Build & Run Commands
```bash
# Backend
cd node
npm install
npm start

# Frontend
cd vue
npm install
npm run dev

# ESP32
# Upload via Arduino IDE to ESP32 device
```

## Key Features Summary

1. **Real-time Monitoring**: Live sensor data from ESP32 devices
2. **Device Management**: Add, configure, and control IoT devices
3. **Data Visualization**: Interactive charts and dashboards
4. **User Authentication**: Secure login with JWT tokens
5. **MQTT Communication**: Reliable IoT messaging protocol
6. **Database Integration**: Persistent data storage with MySQL
7. **Responsive Design**: Modern web interface with PrimeVue
8. **OTA Updates**: Remote firmware updates for ESP32 devices
9. **Connection Status**: Real-time device connectivity monitoring
10. **Energy Analytics**: CO2 footprint calculation and reporting

This architecture provides a scalable, maintainable, and feature-rich IoT solution for carbon footprint monitoring and energy management.