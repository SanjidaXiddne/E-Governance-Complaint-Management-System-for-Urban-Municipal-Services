/**
 * User Management Routes
 * CRUD operations for users (admin functionality)
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");

/**
 * GET /api/users
 * Get all users with optional filtering
 */
router.get("/", async (req, res) => {
  try {
    const {
      role,
      status,
      limit = 100,
      skip = 0,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};
    if (role && ["citizen", "officer", "technician", "admin"].includes(role)) {
      query.role = role;
    }
    if (status && ["active", "inactive", "pending"].includes(status)) {
      query.status = status;
    }

    const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 500);
    const skipNum = Math.max(parseInt(skip) || 0, 0);
    const sortOrder = order === "asc" ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -securityCode")
        .sort({ [sort]: sortOrder })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit: limitNum,
        skip: skipNum,
        hasMore: skipNum + users.length < total,
      },
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
});

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await User.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user statistics",
    });
  }
});

/**
 * GET /api/users/role/:role
 * Get users by role
 */
router.get("/role/:role", async (req, res) => {
  try {
    const { role } = req.params;

    if (!["citizen", "officer", "technician", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role specified",
      });
    }

    const users = await User.find({ role })
      .select("-password -securityCode")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (err) {
    console.error("Error fetching users by role:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
});

/**
 * GET /api/users/:id
 * Get single user by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -securityCode"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Error fetching user:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch user",
    });
  }
});

/**
 * POST /api/users
 * Create new user (admin creates staff)
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      department,
      officerId,
      technicianId,
      specialty,
      securityCode,
    } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and role are required",
      });
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Build user object based on role
    const userData = {
      name,
      email: email.toLowerCase(),
      password: password || "password123", // Default password
      phone: phone || "",
      role,
      status: "active",
      createdBy: "admin",
    };

    // Add role-specific fields
    if (role === "officer") {
      userData.officerId =
        officerId || `OFF-${Date.now().toString().slice(-4)}`;
      userData.department = department || "";
    } else if (role === "technician") {
      userData.technicianId =
        technicianId || `TECH-${Date.now().toString().slice(-4)}`;
      userData.department = department || "";
      userData.specialty = specialty || "";
    } else if (role === "admin") {
      userData.securityCode = securityCode || "SECURE2025";
    }

    const newUser = new User(userData);
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser.toSafeObject(),
    });
  } catch (err) {
    console.error("Error creating user:", err);

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create user",
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone, status, department, specialty, password } =
      req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.status = status;
    if (department !== undefined) updateData.department = department;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (password) updateData.password = password;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -securityCode");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("Error updating user:", err);

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
      });
    }

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update user",
    });
  }
});

/**
 * PATCH /api/users/:id/status
 * Toggle user status
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Toggle status
    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();

    res.json({
      success: true,
      message: `User ${
        user.status === "active" ? "activated" : "deactivated"
      } successfully`,
      data: user.toSafeObject(),
    });
  } catch (err) {
    console.error("Error toggling user status:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update user status",
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.isDefault) {
      return res.status(403).json({
        success: false,
        error: "Cannot delete default system users",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
      data: { id: req.params.id },
    });
  } catch (err) {
    console.error("Error deleting user:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
});

module.exports = router;
