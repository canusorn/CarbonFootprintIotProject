# Carbon Footprint IoT Project API Documentation

This document provides comprehensive documentation for all API endpoints available in the Carbon Footprint IoT Project server.

## Base URL
- **Development**: `http://localhost:3000`
- **API Prefix**: `/api`

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### 1. Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Authentication**: Public (No authentication required)
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "your-password"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "token": "jwt-token-string",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing email/password or user already exists
  - `500 Internal Server Error`: Server error

### 2. Login User
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Authentication**: Public (No authentication required)
- **Description**: Authenticate user and get JWT token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "your-password"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "token": "jwt-token-string",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing credentials or invalid credentials
  - `500 Internal Server Error`: Server error

### 3. Get User Profile
- **Method**: `GET`
- **Path**: `/api/auth/user`
- **Authentication**: Private (JWT token required)
- **Description**: Get current user's profile information
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response** (200 OK):
  ```json
  {
    "id": 1,
    "email": "user@example.com"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: No token or invalid token
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error

---

## Health Check Endpoint

### 4. Health Check
- **Method**: `GET`
- **Path**: `/api/health`
- **Authentication**: Public (No authentication required)
- **Description**: Check server and database health status
- **Response** (200 OK):
  ```json
  {
    "status": "ok",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "database": {
      "connected": true,
      "healthy": true,
      "hasPool": true,
      "hasSensorPool": true
    },
    "services": {
      "sensorService": true,
      "deviceService": true,
      "deviceRoutes": true
    }
  }
  ```
- **Error Response** (503 Service Unavailable):
  ```json
  {
    "status": "error",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "error": "error-message",
    "database": {
      "connected": false,
      "healthy": false
    }
  }
  ```

---

## Device Management Endpoints

### 5. Get All Devices
- **Method**: `GET`
- **Path**: `/api/devices`
- **Authentication**: Private (JWT token required)
- **Description**: Get all devices belonging to the authenticated user
- **Query Parameters**:
  - `username` (optional): Filter by username (must match authenticated user's email)
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response** (200 OK):
  ```json
  [
    {
      "id": 1,
      "espid": "ESP001",
      "name": "Living Room Monitor",
      "username": "user@example.com",
      "date": "2024-01-01T12:00:00.000Z"
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: No token or invalid token
  - `403 Forbidden`: Access denied (trying to access other user's devices)
  - `503 Service Unavailable`: Device service not available

### 6. Get Device by ID
- **Method**: `GET`
- **Path**: `/api/devices/:id`
- **Authentication**: Private (JWT token required)
- **Description**: Get specific device by ESP ID
- **Path Parameters**:
  - `id`: ESP device ID (e.g., "ESP001")
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response** (200 OK):
  ```json
  {
    "id": 1,
    "espid": "ESP001",
    "name": "Living Room Monitor",
    "username": "user@example.com",
    "date": "2024-01-01T12:00:00.000Z"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: No token or invalid token
  - `403 Forbidden`: Access denied (device belongs to another user)
  - `404 Not Found`: Device not found
  - `503 Service Unavailable`: Device service not available

### 7. Update Device
- **Method**: `PUT`
- **Path**: `/api/devices/:id`
- **Authentication**: Private (JWT token required)
- **Description**: Update device name
- **Path Parameters**:
  - `id`: ESP device ID (e.g., "ESP001")
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Request Body**:
  ```json
  {
    "name": "New Device Name"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Device updated successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid or missing device name
  - `401 Unauthorized`: No token or invalid token
  - `403 Forbidden`: Access denied (device belongs to another user)
  - `404 Not Found`: Device not found
  - `503 Service Unavailable`: Device service not available

---

## Sensor Data Endpoints

### 8. Get Sensor Data
- **Method**: `GET`
- **Path**: `/api/sensor-data`
- **Authentication**: Public (No authentication required)
- **Description**: Get sensor data for specific ESP device
- **Query Parameters**:
  - `espId` (required): ESP device ID
  - `limit` (optional): Number of records to return (default: 50)
- **Response** (200 OK):
  ```json
  [
    {
      "id": 1,
      "timestamp": "2024-01-01T12:00:00.000Z",
      "voltage": 220.5,
      "current": 1.2,
      "power": 264.6,
      "energy": 0.264,
      "frequency": 50.0,
      "pf": 0.95
    }
  ]
  ```
- **Error Responses**:
  - `400 Bad Request`: ESP ID is required
  - `503 Service Unavailable`: Sensor service not available

### 9. Get Sensor Data by ESP ID
- **Method**: `GET`
- **Path**: `/api/sensor-data/:espId`
- **Authentication**: Private (JWT token required)
- **Description**: Get historical sensor data for specific ESP device
- **Path Parameters**:
  - `espId`: ESP device ID (e.g., "ESP001")
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response** (200 OK):
  ```json
  [
    {
      "id": 1,
      "timestamp": "2024-01-01T12:00:00.000Z",
      "voltage": 220.5,
      "current": 1.2,
      "power": 264.6,
      "energy": 0.264,
      "frequency": 50.0,
      "pf": 0.95
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: No token or invalid token
  - `500 Internal Server Error`: Failed to fetch sensor data
  - `503 Service Unavailable`: Sensor service not available

### 10. Get Latest Sensor Data
- **Method**: `GET`
- **Path**: `/api/sensor-data/:espId/latest`
- **Authentication**: Private (JWT token required)
- **Description**: Get latest sensor data for specific ESP device
- **Path Parameters**:
  - `espId`: ESP device ID (e.g., "ESP001")
- **Query Parameters**:
  - `limit` (optional): Number of latest records to return (default: 1)
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response** (200 OK):
  ```json
  [
    {
      "id": 1,
      "timestamp": "2024-01-01T12:00:00.000Z",
      "voltage": 220.5,
      "current": 1.2,
      "power": 264.6,
      "energy": 0.264,
      "frequency": 50.0,
      "pf": 0.95
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: No token or invalid token
  - `500 Internal Server Error`: Failed to fetch latest sensor data
  - `503 Service Unavailable`: Sensor service not available

### 11. Get Historical Sensor Data by Date Range
- **Method**: `GET`
- **Path**: `/api/sensor-data/:espId/history`
- **Authentication**: Private (JWT token required)
- **Description**: Get historical sensor data within a specific date range
- **Path Parameters**:
  - `espId`: ESP device ID (e.g., "ESP001")
- **Query Parameters**:
  - `startDate` (required): Start date in ISO format (e.g., "2024-01-01T00:00:00.000Z")
  - `endDate` (required): End date in ISO format (e.g., "2024-01-31T23:59:59.999Z")
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response** (200 OK):
  ```json
  [
    {
      "id": 1,
      "timestamp": "2024-01-01T12:00:00.000Z",
      "voltage": 220.5,
      "current": 1.2,
      "power": 264.6,
      "energy": 0.264,
      "frequency": 50.0,
      "pf": 0.95
    }
  ]
  ```
- **Error Responses**:
  - `400 Bad Request`: startDate and endDate query parameters are required
  - `401 Unauthorized`: No token or invalid token
  - `500 Internal Server Error`: Failed to fetch historical sensor data
  - `503 Service Unavailable`: Sensor service not available

---

## Energy Data Endpoints

### 12. Get Daily Energy Data
- **Method**: `GET`
- **Path**: `/api/daily-energy/:espId`
- **Authentication**: Private (JWT token required)
- **Description**: Get daily energy consumption data for specific ESP device
- **Path Parameters**:
  - `espId`: ESP device ID (e.g., "ESP001")
- **Query Parameters**:
  - `days` (optional): Number of days to retrieve (default: 30, max: 365)
  - `month` (optional): Specific month in YYYY-MM format (overrides days parameter)
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response** (200 OK):
  ```json
  [
    {
      "date": "2024-01-01",
      "total_energy": 12.5,
      "avg_power": 520.8,
      "max_power": 850.0,
      "min_power": 120.0
    }
  ]
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid ESP ID, days parameter, or month format
  - `401 Unauthorized`: No token or invalid token
  - `500 Internal Server Error`: Failed to retrieve daily energy data
  - `503 Service Unavailable`: Daily energy service not available

### 13. Get Today's Energy Data
- **Method**: `GET`
- **Path**: `/api/today-energy/:espId`
- **Authentication**: Private (JWT token required)
- **Description**: Get today's energy consumption data for specific ESP device
- **Path Parameters**:
  - `espId`: ESP device ID (e.g., "ESP001")
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response** (200 OK):
  ```json
  {
    "date": "2024-01-01",
    "total_energy": 8.2,
    "avg_power": 341.7,
    "max_power": 650.0,
    "min_power": 85.0,
    "current_power": 425.3
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: ESP ID is required
  - `401 Unauthorized`: No token or invalid token
  - `500 Internal Server Error`: Failed to retrieve today energy data
  - `503 Service Unavailable`: Today energy service not available

### 14. Get Today's Power Data
- **Method**: `GET`
- **Path**: `/api/today-power/:espId`
- **Authentication**: Private (JWT token required)
- **Description**: Get today's power consumption data for line chart visualization
- **Path Parameters**:
  - `espId`: ESP device ID (e.g., "ESP001")
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response** (200 OK):
  ```json
  [
    {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "power": 125.5
    },
    {
      "timestamp": "2024-01-01T01:00:00.000Z",
      "power": 230.8
    }
  ]
  ```
- **Error Responses**:
  - `400 Bad Request`: ESP ID is required
  - `401 Unauthorized`: No token or invalid token
  - `500 Internal Server Error`: Failed to retrieve today power data
  - `503 Service Unavailable`: Today power service not available

### 15. Get Monthly Energy Data
- **Method**: `GET`
- **Path**: `/api/monthly-energy/:espId`
- **Authentication**: Private (JWT token required)
- **Description**: Get monthly energy consumption data for specific ESP device
- **Path Parameters**:
  - `espId`: ESP device ID (e.g., "ESP001")
- **Query Parameters**:
  - `year` (optional): Specific year (2020-2030, defaults to current year)
- **Headers**:
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response** (200 OK):
  ```json
  [
    {
      "month": "2024-01",
      "total_energy": 375.2,
      "avg_daily_energy": 12.1,
      "max_daily_energy": 18.5,
      "min_daily_energy": 8.2
    }
  ]
  ```
- **Error Responses**:
  - `400 Bad Request`: ESP ID is required or invalid year parameter
  - `401 Unauthorized`: No token or invalid token
  - `500 Internal Server Error`: Failed to retrieve monthly energy data
  - `503 Service Unavailable`: Monthly energy service not available

---

## MQTT Integration

The server also includes an MQTT broker for real-time IoT device communication:

### MQTT Broker Details
- **Port**: 1883 (configurable via MQTT_PORT environment variable)
- **WebSocket Port**: 8083 (configurable via WS_PORT environment variable)
- **Authentication**: Required (username/password)
- **Connection URLs**:
  - MQTT: `mqtt://localhost:1883`
  - WebSocket: `ws://localhost:8083/mqtt`

### MQTT Topics
- **Device Updates**: `{deviceId}/update` - ESP devices publish power meter data
- **Sensor Data**: `sensor/{sensorType}` - General sensor data topics

### MQTT Message Format (Power Meter Data)
```json
{
  "espid": "ESP001",
  "voltage": 220.5,
  "current": 1.2,
  "power": 264.6,
  "energy": 0.264,
  "frequency": 50.0,
  "pf": 0.95,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Error Handling

### Common HTTP Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data or parameters
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Access denied (insufficient permissions)
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

### Error Response Format
```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Database Requirements

The API requires a MySQL database connection for full functionality:
- **Database**: MySQL 5.7+ or MariaDB 10.2+
- **Configuration**: Via environment variables in `.env` file
- **Fallback**: Server runs in limited mode without database connection
- **Auto-reconnection**: Automatic database reconnection every 30 seconds

---

## Environment Variables

Key environment variables for API configuration:
- `PORT`: HTTP server port (default: 3000)
- `MQTT_PORT`: MQTT broker port (default: 1883)
- `WS_PORT`: WebSocket server port (default: 8083)
- `MQTT_PASSWORD`: MQTT authentication password
- `JWT_SECRET`: JWT token signing secret
- `DB_HOST`: MySQL database host
- `DB_PORT`: MySQL database port
- `DB_NAME`: MySQL database name
- `DB_USER`: MySQL database username
- `DB_PASSWORD`: MySQL database password