/**
 * E-Governance Complaint Management System - Server Entry Point
 * Express.js server with MongoDB integration
 */

// Load environment variables from .env file (for local development only)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");

// Import database connection
const { connectDB } = require("./db");

// Import routes
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const complaintRoutes = require("./routes/complaints");

// Import middleware
const { sanitizeBodyMiddleware } = require("./middleware/validation");

// Initialize Express app
const app = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development; configure properly for production
  })
);

// Enable CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Request logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Parse JSON bodies
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitize request bodies
app.use(sanitizeBodyMiddleware);

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, "..")));

// ============================================
// API ROUTES
// ============================================

// Disable caching for all API routes to ensure fresh data
app.use("/api", (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Admin routes
app.use("/api/admin", adminRoutes);

// Authentication routes
app.use("/api/auth", authRoutes);

// User management routes
app.use("/api/users", userRoutes);

// Complaint routes
app.use("/api/complaints", complaintRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === "development"
      ? err.message
      : "An unexpected error occurred";

  res.status(err.status || 500).json({
    error: "Server Error",
    message: message,
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3000;

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    return server;
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

// Vercel serverless function handler
// Ensures DB connection before handling requests (connection is reused across invocations)
const handler = async (req, res) => {
  try {
    // Connect to database if not already connected
    // In serverless, connections are reused, so this is efficient
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    console.error("Database connection error in serverless handler:", err);
    return res.status(500).json({
      error: "Database Connection Error",
      message: "Failed to connect to database",
    });
  }
  
  return app(req, res);
};

// Start the server if this file is run directly (local development)
if (require.main === module) {
  startServer();
}

// Export for Vercel serverless functions
// Also export app and startServer for testing and local development
module.exports = handler;
handler.app = app;
handler.startServer = startServer;
