# 🏛️ E-Governance Complaint Management System

A comprehensive web-based complaint management system designed for urban municipal services. This platform enables citizens to submit, track, and resolve complaints related to civic issues while providing municipal staff with efficient tools for complaint handling and resolution.

![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=flat&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [User Roles](#-user-roles)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### For Citizens
- **Submit Complaints**: File complaints across various categories (Water, Road, Waste, Light, Drainage, etc.)
- **Track Status**: Real-time tracking of complaint status with detailed timeline
- **Dashboard**: Personal dashboard showing all submitted complaints and their progress
- **Notifications**: Stay informed about complaint updates and resolutions

### For Municipal Officers
- **Complaint Management**: View, acknowledge, and assign complaints to technicians
- **Priority Assignment**: Set complaint priority levels (Low, Normal, Medium, High, Urgent)
- **Dashboard Analytics**: Overview of pending, in-progress, and resolved complaints
- **Detailed View**: Access full complaint history and citizen information

### For Technicians
- **Task Management**: View assigned complaints and workload
- **Progress Updates**: Log work progress with time tracking
- **Status Updates**: Mark complaints as in-progress, resolved, or completed
- **Work History**: Track completed tasks and time spent

### For Administrators
- **User Management**: Create, edit, and manage all user accounts
- **Reporting & Analytics**: Generate comprehensive reports and statistics
- **System Overview**: Monitor overall system performance and complaint metrics
- **Manual Entry**: Add citizens and staff members manually

### System Features
- **Multi-role Authentication**: Secure login for different user types
- **Timeline Tracking**: Complete audit trail for every complaint
- **RESTful API**: Well-documented API endpoints
- **Input Validation**: Comprehensive server-side validation and sanitization
- **Security**: Helmet.js security headers, CORS configuration, input sanitization

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive Design
- Modern UI/UX

### Backend
- **Runtime**: Node.js 24.x
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM 8.x
- **Security**: Helmet.js, CORS
- **Logging**: Morgan

### DevOps
- **Testing**: Jest with MongoDB Memory Server
- **Deployment**: Vercel Serverless Functions
- **Development**: Nodemon for hot reload

## 👥 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Citizen** | General public who submit complaints | Submit & track own complaints |
| **Officer** | Municipal officers who process complaints | View all, assign, update status |
| **Technician** | Field workers who resolve issues | View assigned, update progress |
| **Admin** | System administrators | Full access, user management |

## 📦 Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/E-Governance-Complaint-Management-System-for-Urban-Municipal-Services.git
   cd E-Governance-Complaint-Management-System-for-Urban-Municipal-Services
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the project root:
   ```env
   # Database Configuration
   MONGODB_URI=your_mongodb_connection_string
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # CORS Configuration
   CORS_ORIGIN=*
   ```

   > ⚠️ **Important**: Never commit your `.env` file to version control!

4. **Seed the database (optional)**
   ```bash
   # Seed users
   npm run seed
   
   # Seed sample complaints
   npm run seed:complaints
   
   # Or seed both
   npm run seed:all
   ```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
Uses nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with hot reload |
| `npm run seed` | Seed database with default users |
| `npm run seed:complaints` | Seed database with sample complaints |
| `npm run seed:all` | Seed users and complaints |
| `npm test` | Run tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Health Check
```http
GET /api/health
```
Returns server status and uptime.

#### Authentication
```http
POST /api/auth/login
POST /api/auth/register
```

#### Complaints
```http
GET    /api/complaints                    # Get all complaints (with filters)
GET    /api/complaints/stats              # Get statistics
GET    /api/complaints/:id                # Get single complaint
GET    /api/complaints/:id/timeline       # Get complaint timeline
GET    /api/complaints/citizen/:email     # Get citizen's complaints
GET    /api/complaints/technician/:id     # Get technician's assignments
POST   /api/complaints                    # Create new complaint
PUT    /api/complaints/:id                # Update complaint
PATCH  /api/complaints/:id/status         # Update status with timeline
PATCH  /api/complaints/:id/assign         # Assign to technician
POST   /api/complaints/:id/timeline       # Add timeline entry
POST   /api/complaints/:id/progress       # Add progress update
DELETE /api/complaints/:id                # Delete complaint
```

#### Users
```http
GET    /api/users                         # Get all users
GET    /api/users/:id                     # Get single user
POST   /api/users                         # Create user
PUT    /api/users/:id                     # Update user
DELETE /api/users/:id                     # Delete user
```

#### Admin
```http
POST   /api/admin/manual-add              # Manually add citizen
GET    /api/admin/citizens                # Get all citizens
GET    /api/admin/citizens/:id            # Get single citizen
PUT    /api/admin/citizens/:id            # Update citizen
DELETE /api/admin/citizens/:id            # Delete citizen
```

### Query Parameters (Complaints)

| Parameter | Description | Example |
|-----------|-------------|---------|
| `status` | Filter by status | `status=new` |
| `category` | Filter by category | `category=Water` |
| `priority` | Filter by priority | `priority=high` |
| `citizenEmail` | Filter by citizen email | `citizenEmail=user@example.com` |
| `technicianId` | Filter by assigned technician | `technicianId=TECH-001` |
| `limit` | Number of results (max 500) | `limit=50` |
| `skip` | Skip results for pagination | `skip=0` |
| `sort` | Sort field | `sort=createdAt` |
| `order` | Sort order | `order=desc` |

### Complaint Categories
- Water
- Road
- Waste
- Light
- Drainage
- Other

### Complaint Statuses
- `new` - Newly submitted
- `acknowledged` - Received by officer
- `assigned` - Assigned to technician
- `in-progress` - Work in progress
- `resolved` - Issue resolved
- `completed` - Task completed
- `rejected` - Complaint rejected
- `closed` - Complaint closed

### Priority Levels
- `low`
- `normal`
- `medium`
- `high`
- `urgent`

## 📁 Project Structure

```
├── api/
│   └── index.js              # Vercel serverless entry point
├── images/                   # Static images
├── server/
│   ├── index.js              # Main server entry point
│   ├── db.js                 # MongoDB connection
│   ├── seed.js               # User seeding script
│   ├── seedComplaints.js     # Complaint seeding script
│   ├── middleware/
│   │   └── validation.js     # Input validation & sanitization
│   ├── models/
│   │   ├── Citizen.js        # Citizen schema
│   │   ├── Complaint.js      # Complaint schema with timeline
│   │   └── User.js           # User schema (all roles)
│   ├── routes/
│   │   ├── admin.js          # Admin API routes
│   │   ├── auth.js           # Authentication routes
│   │   ├── complaints.js     # Complaint CRUD routes
│   │   └── users.js          # User management routes
│   └── tests/
│       └── admin.test.js     # API tests
├── *.html                    # Frontend pages
├── *.css                     # Stylesheets
├── *.js                      # Frontend JavaScript
├── package.json              # Project dependencies
├── vercel.json               # Vercel deployment config
└── README.md                 # This file
```

### Frontend Pages

| File | Description |
|------|-------------|
| `index.html` | Landing page with login |
| `citizen-dashboard.html` | Citizen main dashboard |
| `citizen-new-complaint.html` | New complaint form |
| `citizen-complaint-detail.html` | Complaint detail view |
| `officer-dashboard.html` | Officer main dashboard |
| `officer-complaint-detail.html` | Officer complaint detail |
| `technician-dashboard.html` | Technician dashboard |
| `supervisor-dashboard.html` | Supervisor dashboard |
| `admin-dashboard.html` | Admin main dashboard |
| `admin-user-management.html` | User management panel |
| `admin-reporting.html` | Reports and analytics |

## 🧪 Testing

Run tests using Jest with an in-memory MongoDB instance:

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch
```

Tests use `mongodb-memory-server`, so no external database is needed.

## 🌐 Deployment

### Vercel (Recommended)

This project is configured for seamless deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

The `vercel.json` configuration handles routing and serverless function setup.

### Manual Deployment

1. Set `NODE_ENV=production`
2. Configure your MongoDB production database
3. Run `npm start`

## 📸 Screenshots

### Landing Page
The landing page provides secure authentication for all user roles with a modern, intuitive interface.

### Citizen Dashboard
Citizens can view all their submitted complaints, track progress, and submit new complaints.

### Officer Dashboard
Officers can manage complaints, assign technicians, and update complaint statuses.

### Admin Panel
Administrators have full control over users, complaints, and system analytics.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support, please open an issue in the GitHub repository.

---

<p align="center">
  Made with ❤️ for better civic services
</p>
