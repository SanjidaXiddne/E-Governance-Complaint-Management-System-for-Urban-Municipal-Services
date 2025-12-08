# Server Setup Guide

## E-Governance Complaint Management System - Backend

This guide explains how to set up and run the Node.js/Express backend with MongoDB integration.

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)

## Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   Create a `.env` file in the project root with the following contents:

   ```env
   # Database Configuration
   MONGODB_URI=mongodb+srv://dbUser:dbUser@egov.ogv85vp.mongodb.net/?appName=egov

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # CORS Configuration
   CORS_ORIGIN=*
   ```

   > ⚠️ **Important:** Never commit your `.env` file to version control!

## Running the Server

### Development Mode

```bash
npm run dev
```

This uses nodemon for automatic restarts on file changes.

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and uptime.

### Manual Add Citizen

```
POST /api/admin/manual-add
Content-Type: application/json

{
  "username": "john_doe",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+880 1700 000000",
  "address": "123 Main Street, Dhaka",
  "createdBy": "admin",
  "metadata": {
    "source": "manual_entry"
  }
}
```

**Required fields:** `username`, `name`

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Citizen added successfully",
  "data": {
    "id": "...",
    "username": "john_doe",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+880 1700 000000",
    "address": "123 Main Street, Dhaka",
    "status": "active",
    "createdAt": "2025-12-08T...",
    "createdBy": "admin"
  }
}
```

### Get All Citizens

```
GET /api/admin/citizens?status=active&limit=50&skip=0&sort=createdAt&order=desc
```

### Get Single Citizen

```
GET /api/admin/citizens/:id
```

### Update Citizen

```
PUT /api/admin/citizens/:id
Content-Type: application/json

{
  "name": "Updated Name"
}
```

### Delete Citizen

```
DELETE /api/admin/citizens/:id
```

## Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch
```

Tests use an in-memory MongoDB instance (`mongodb-memory-server`), so no external database is needed for testing.

## Project Structure

```
server/
├── index.js           # Main entry point
├── db.js              # MongoDB connection
├── models/
│   └── Citizen.js     # Citizen schema with validation
├── routes/
│   └── admin.js       # Admin API routes
├── middleware/
│   └── validation.js  # Input validation & sanitization
└── tests/
    └── admin.test.js  # API tests
```

## Schema Validation

The Citizen model includes:

- **username:** Required, unique, 3-50 chars, alphanumeric with underscores/hyphens
- **name:** Required, 2-100 chars
- **email:** Optional, valid email format, lowercase
- **phone:** Optional, valid phone format, max 20 chars
- **address:** Optional, max 500 chars
- **createdBy:** Optional, defaults to 'admin'
- **metadata:** Optional, flexible object for additional data
- **status:** 'active' | 'inactive' | 'pending', defaults to 'active'

## Database Indexes

For optimal query performance, the following indexes are created:

- `username` (unique)
- `email` (sparse)
- `createdAt` (descending)
- `status`
- `createdBy`
- `name` (text search)
- Compound index: `status` + `createdAt`

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate username/email)
- `500` - Internal Server Error

## Security Features

- Helmet.js for security headers
- CORS configuration
- Input sanitization (removes HTML tags, MongoDB operators)
- Request body size limits
- Mongoose schema validation
