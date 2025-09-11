---
trigger: always_on
alwaysApply: true
---

# Carbon Footprint IoT Project Rules

## Project Architecture

This project follows a microservice architecture with separate frontend and backend components:

### Backend (Node.js)
- **Location**: `node/` folder
- **Framework**: Express.js for REST API server
- **MQTT Broker**: Aedes library for MQTT messaging
- **Entry Point**: `node/server.js`
- **Package Management**: npm with `node/package.json`

### Frontend (Vue.js)
- **Location**: `vue/` folder
- **Framework**: Vue.js 3
- **UI Components**: PrimeVue theme and component library
- **Data Communication**: 
  - REST API calls to backend
  - MQTT client for real-time data updates

## Development Guidelines

### Backend Development
1. All backend code must be placed in the `node/` directory
2. Use Express.js for creating REST API endpoints
3. Implement MQTT broker using Aedes library
4. Follow RESTful API design principles
5. Handle MQTT message publishing and subscription for IoT device communication
6. Server runs on port 3000 (configurable via PORT environment variable)
7. MQTT broker runs on port 1883 (configurable via MQTT_PORT environment variable)

### Frontend Development
1. All frontend code must be placed in the `vue/` directory
2. Use Vue.js 3 as the primary frontend framework
3. Implement UI components using PrimeVue library
4. Follow PrimeVue theming guidelines for consistent design
5. Integrate with backend via:
   - HTTP/HTTPS requests to Express API endpoints
   - MQTT client connections for real-time data updates
6. Ensure responsive design for various device sizes

### Communication Protocols
1. **REST API**: Use for CRUD operations and standard data retrieval
2. **MQTT**: Use for real-time IoT data streaming and updates
3. **WebSockets**: Optional for additional real-time features if needed

### Code Organization
- Keep backend and frontend code strictly separated
- Use proper folder structure within each directory
- Implement proper error handling for both API and MQTT communications
- Follow Vue.js composition API patterns for frontend components
- Use Express middleware patterns for backend request processing

### Data Flow
1. IoT devices → MQTT Broker (Aedes) → Backend processing
2. Frontend → REST API → Backend → Database/Processing
3. Backend → MQTT messages → Frontend (real-time updates)
4. Frontend displays data using PrimeVue components

### Technology Stack Compliance
- **Backend**: Node.js + Express + Aedes
- **Frontend**: Vue.js 3 + PrimeVue
- **Communication**: REST API + MQTT
- **Package Management**: npm for both frontend and backend

All code changes and new features must adhere to this architectural pattern.