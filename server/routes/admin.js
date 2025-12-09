/**
 * Admin Routes
 * Handles administrative operations including manual data entry
 */

const express = require("express");
const router = express.Router();
const Citizen = require("../models/Citizen");
const User = require("../models/User");
const { validateCitizenMiddleware } = require("../middleware/validation");

/**
 * POST /api/admin/manual-add
 * Manually add a new citizen to the database
 *
 * Request body:
 * {
 *   username: string (required),
 *   name: string (required),
 *   email: string (optional),
 *   phone: string (optional),
 *   address: string (optional),
 *   createdBy: string (optional, defaults to 'admin'),
 *   metadata: object (optional),
 *   status: string (optional, defaults to 'active')
 * }
 *
 * Response: 201 Created with saved document
 */
router.post("/manual-add", validateCitizenMiddleware, async (req, res) => {
  try {
    const payload = req.body;

    // Check if username already exists
    const existingCitizen = await Citizen.findOne({
      username: payload.username,
    });
    if (existingCitizen) {
      return res.status(409).json({
        error: "Username already exists",
        field: "username",
      });
    }

    // Check if email already exists (if provided)
    if (payload.email) {
      const existingEmail = await Citizen.findOne({ email: payload.email });
      if (existingEmail) {
        return res.status(409).json({
          error: "Email already exists",
          field: "email",
        });
      }
    }

    // Create new citizen document
    const newCitizen = new Citizen(payload);

    // Save to database
    const saved = await newCitizen.save();

    // Return saved document with 201 status
    res.status(201).json({
      success: true,
      message: "Citizen added successfully",
      data: saved.toSafeObject(),
    });
  } catch (err) {
    console.error("Error in manual-add:", err);

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        error: `${field} already exists`,
        field: field,
      });
    }

    // Generic server error
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/**
 * GET /api/admin/citizens
 * Get all citizens with optional filtering and pagination
 *
 * Query parameters:
 * - status: Filter by status (active, inactive, pending)
 * - limit: Number of records to return (default: 50, max: 100)
 * - skip: Number of records to skip for pagination
 * - sort: Field to sort by (default: createdAt)
 * - order: Sort order (asc or desc, default: desc)
 */
router.get("/citizens", async (req, res) => {
  try {
    const {
      status,
      limit = 50,
      skip = 0,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Build query
    const query = {};
    if (status && ["active", "inactive", "pending"].includes(status)) {
      query.status = status;
    }

    // Parse and validate pagination
    const limitNum = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    const skipNum = Math.max(parseInt(skip) || 0, 0);

    // Build sort object
    const sortOrder = order === "asc" ? 1 : -1;
    const sortObj = { [sort]: sortOrder };

    // Execute query
    const [citizens, total] = await Promise.all([
      Citizen.find(query).sort(sortObj).skip(skipNum).limit(limitNum).lean(),
      Citizen.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: citizens,
      pagination: {
        total,
        limit: limitNum,
        skip: skipNum,
        hasMore: skipNum + citizens.length < total,
      },
    });
  } catch (err) {
    console.error("Error fetching citizens:", err);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/**
 * GET /api/admin/citizens/:id
 * Get a specific citizen by ID
 */
router.get("/citizens/:id", async (req, res) => {
  try {
    const citizen = await Citizen.findById(req.params.id);

    if (!citizen) {
      return res.status(404).json({
        error: "Citizen not found",
      });
    }

    res.json({
      success: true,
      data: citizen.toSafeObject(),
    });
  } catch (err) {
    console.error("Error fetching citizen:", err);

    // Handle invalid ObjectId
    if (err.name === "CastError") {
      return res.status(400).json({
        error: "Invalid citizen ID format",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/**
 * PUT /api/admin/citizens/:id
 * Update a citizen by ID
 */
router.put("/citizens/:id", validateCitizenMiddleware, async (req, res) => {
  try {
    const citizen = await Citizen.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!citizen) {
      return res.status(404).json({
        error: "Citizen not found",
      });
    }

    res.json({
      success: true,
      message: "Citizen updated successfully",
      data: citizen.toSafeObject(),
    });
  } catch (err) {
    console.error("Error updating citizen:", err);

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        error: `${field} already exists`,
        field: field,
      });
    }

    // Handle invalid ObjectId
    if (err.name === "CastError") {
      return res.status(400).json({
        error: "Invalid citizen ID format",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/**
 * DELETE /api/admin/citizens/:id
 * Delete a citizen by ID
 */
router.delete("/citizens/:id", async (req, res) => {
  try {
    const citizen = await Citizen.findByIdAndDelete(req.params.id);

    if (!citizen) {
      return res.status(404).json({
        error: "Citizen not found",
      });
    }

    res.json({
      success: true,
      message: "Citizen deleted successfully",
      data: { id: req.params.id },
    });
  } catch (err) {
    console.error("Error deleting citizen:", err);

    // Handle invalid ObjectId
    if (err.name === "CastError") {
      return res.status(400).json({
        error: "Invalid citizen ID format",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/**
 * POST /api/admin/emergency-alert
 * Send emergency alert to specified user groups
 *
 * Request body:
 * {
 *   title: string (required),
 *   message: string (required),
 *   priority: string (high, critical, urgent),
 *   targetAudience: {
 *     citizens: boolean,
 *     officers: boolean,
 *     technicians: boolean
 *   }
 * }
 */
router.post("/emergency-alert", async (req, res) => {
  try {
    const { title, message, priority, targetAudience } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: "Title and message are required",
      });
    }

    if (!targetAudience) {
      return res.status(400).json({
        success: false,
        error: "Target audience must be specified",
      });
    }

    // Build query based on target audience
    const roleQuery = [];
    if (targetAudience.citizens) {
      roleQuery.push("citizen");
    }
    if (targetAudience.officers) {
      roleQuery.push("officer");
    }
    if (targetAudience.technicians) {
      roleQuery.push("technician");
    }

    if (roleQuery.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one target audience must be selected",
      });
    }

    // Find all users matching the role criteria
    // For citizens, we check both Citizen and User models
    const userQuery = { role: { $in: roleQuery }, status: "active" };

    const users = await User.find(userQuery).lean();
    let citizens = [];

    // If citizens are targeted, also get from Citizen model
    if (targetAudience.citizens) {
      const citizenDocs = await Citizen.find({ status: "active" }).lean();
      citizens = citizenDocs.map((cit) => ({
        id: cit._id,
        email: cit.email,
        name: cit.name,
        role: "citizen",
      }));
    }

    // Combine all recipients
    const recipients = [
      ...users.map((u) => ({
        id: u._id,
        email: u.email,
        name: u.name,
        role: u.role,
      })),
      ...citizens,
    ];

    // Store emergency alert (you could save this to a database if needed)
    const alertData = {
      title,
      message,
      priority: priority || "critical",
      recipients: recipients.length,
      targetAudience,
      sentAt: new Date(),
      sentBy: req.body.sentBy || "admin",
    };

    // In a real application, you would:
    // 1. Store this alert in a database
    // 2. Send push notifications
    // 3. Send emails/SMS
    // 4. Broadcast via WebSocket/SSE for real-time updates

    // For now, we'll just return success
    // The frontend can broadcast this via localStorage events for demo purposes
    console.log("Emergency Alert Sent:", alertData);

    res.json({
      success: true,
      message: "Emergency alert sent successfully",
      recipients: recipients.length,
      alert: alertData,
    });
  } catch (err) {
    console.error("Error sending emergency alert:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/**
 * POST /api/admin/broadcast-announcement
 * Send broadcast announcement to specified user groups
 *
 * Request body:
 * {
 *   title: string (required),
 *   message: string (required),
 *   type: string (general, maintenance, update, news, event),
 *   priority: string (normal, important, high),
 *   targetAudience: {
 *     citizens: boolean,
 *     officers: boolean,
 *     technicians: boolean
 *   }
 * }
 */
router.post("/broadcast-announcement", async (req, res) => {
  try {
    const { title, message, type, priority, targetAudience } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: "Title and message are required",
      });
    }

    if (!targetAudience) {
      return res.status(400).json({
        success: false,
        error: "Target audience must be specified",
      });
    }

    // Build query based on target audience
    const roleQuery = [];
    if (targetAudience.citizens) {
      roleQuery.push("citizen");
    }
    if (targetAudience.officers) {
      roleQuery.push("officer");
    }
    if (targetAudience.technicians) {
      roleQuery.push("technician");
    }

    if (roleQuery.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one target audience must be selected",
      });
    }

    // Find all users matching the role criteria
    const userQuery = { role: { $in: roleQuery }, status: "active" };

    const users = await User.find(userQuery).lean();
    let citizens = [];

    // If citizens are targeted, also get from Citizen model
    if (targetAudience.citizens) {
      const citizenDocs = await Citizen.find({ status: "active" }).lean();
      citizens = citizenDocs.map((cit) => ({
        id: cit._id,
        email: cit.email,
        name: cit.name,
        role: "citizen",
      }));
    }

    // Combine all recipients
    const recipients = [
      ...users.map((u) => ({
        id: u._id,
        email: u.email,
        name: u.name,
        role: u.role,
      })),
      ...citizens,
    ];

    // Store announcement data (you could save this to a database if needed)
    const announcementData = {
      title,
      message,
      type: type || "general",
      priority: priority || "normal",
      recipients: recipients.length,
      targetAudience,
      sentAt: new Date(),
      sentBy: req.body.sentBy || "admin",
    };

    // In a real application, you would:
    // 1. Store this announcement in a database
    // 2. Send push notifications
    // 3. Send emails
    // 4. Broadcast via WebSocket/SSE for real-time updates

    console.log("Broadcast Announcement Sent:", announcementData);

    res.json({
      success: true,
      message: "Announcement broadcasted successfully",
      recipients: recipients.length,
      announcement: announcementData,
    });
  } catch (err) {
    console.error("Error broadcasting announcement:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

module.exports = router;
