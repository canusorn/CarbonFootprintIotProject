# Carbon Footprint IoT Backend

Node.js backend server with Express.js API and MQTT broker for the Carbon Footprint IoT project.

## Features

- **REST API**: Express.js server with authentication endpoints
- **MQTT Broker**: Aedes-based MQTT broker for IoT device communication
- **MySQL Database**: User authentication data stored in MySQL
- **JWT Authentication**: Secure token-based authentication (no expiration)
- **Password Security**: bcrypt hashing for password protection

## Prerequisites

- Node.js (v16 or higher)
- MySQL Server (v8.0 or higher)
- npm package manager

## Database Setup

### 1. Install MySQL

Download and install MySQL from [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)

### 2. Create Database User (Optional)

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create a dedicated user for the application
CREATE USER 'carbon_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON carbon_footprint_db.* TO 'carbon_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file with your database credentials
```

Update the `.env` file:

```env
DB_HOST=localhost
DB_USER=root  # or carbon_user if you created a dedicated user
DB_PASSWORD=your_mysql_password
DB_NAME=carbon_footprint_db

PORT=3000
MQTT_PORT=1883
JWT_SECRET=your_secure_jwt_secret_key
```

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# For development with auto-restart
npm run dev
```

## Database Schema

The application will automatically create the database and required tables on first run:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user` - Get current user (requires JWT token)

### IoT Data

- `GET /api/devices` - Get all devices
- `GET /api/devices/:id` - Get device by ID
- `PUT /api/devices/:id` - Update device
- `GET /api/sensor-data` - Get sensor data

## MQTT Topics

- `sensor/*` - Sensor data topics (automatically stored)
- Connect to `mqtt://localhost:1883`

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Tokens**: No expiration date for persistent sessions
- **Input Validation**: Email and password validation
- **Error Handling**: Secure error messages without sensitive data exposure

## Troubleshooting

### Database Connection Issues

1. Verify MySQL is running: `sudo systemctl status mysql` (Linux) or check Services (Windows)
2. Test connection: `mysql -u your_user -p`
3. Check firewall settings for port 3306
4. Verify credentials in `.env` file

### Common Errors

- **ER_ACCESS_DENIED_ERROR**: Wrong username/password in `.env`
- **ECONNREFUSED**: MySQL server not running
- **ER_BAD_DB_ERROR**: Database doesn't exist (will be created automatically)

## Development

```bash
# Run with nodemon for development
npm run dev

# The server will restart automatically on file changes
```

## Production Deployment

1. Set strong `JWT_SECRET` in production environment
2. Use dedicated MySQL user with limited privileges
3. Enable MySQL SSL connections
4. Configure proper firewall rules
5. Use process manager like PM2 for production

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name carbon-footprint-api
```