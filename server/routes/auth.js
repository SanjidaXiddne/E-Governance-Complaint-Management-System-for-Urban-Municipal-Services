/**
 * Authentication Routes
 * Handles login for all user types: citizen, officer, technician, admin
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");

/**
 * POST /api/auth/login/citizen
 * Citizen login
 */
router.post("/login/citizen", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.role !== "citizen") {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials for citizen login",
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password",
      });
    }

    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        error: "Account is inactive",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login successful",
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("Citizen login error:", err);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
});

/**
 * POST /api/auth/login/officer
 * Officer login with officerId verification
 */
router.post("/login/officer", async (req, res) => {
  try {
    const { email, password, officerId } = req.body;

    if (!email || !password || !officerId) {
      return res.status(400).json({
        success: false,
        error: "Email, password, and officer ID are required",
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.role !== "officer") {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials for officer login",
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password",
      });
    }

    if (user.officerId !== officerId) {
      return res.status(401).json({
        success: false,
        error: "Invalid Officer ID",
      });
    }

    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        error: "Account is inactive",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login successful",
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("Officer login error:", err);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
});

/**
 * POST /api/auth/login/technician
 * Technician login with technicianId verification
 */
router.post("/login/technician", async (req, res) => {
  try {
    const { email, password, technicianId } = req.body;

    if (!email || !password || !technicianId) {
      return res.status(400).json({
        success: false,
        error: "Email, password, and technician ID are required",
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.role !== "technician") {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials for technician login",
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password",
      });
    }

    if (user.technicianId !== technicianId) {
      return res.status(401).json({
        success: false,
        error: "Invalid Technician ID",
      });
    }

    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        error: "Account is inactive",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login successful",
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("Technician login error:", err);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
});

/**
 * POST /api/auth/login/admin
 * Admin login with security code verification
 */
router.post("/login/admin", async (req, res) => {
  try {
    const { email, password, securityCode } = req.body;

    if (!email || !password || !securityCode) {
      return res.status(400).json({
        success: false,
        error: "Email, password, and security code are required",
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials for admin login",
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password",
      });
    }

    if (user.securityCode !== securityCode) {
      return res.status(401).json({
        success: false,
        error: "Invalid security code",
      });
    }

    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        error: "Account is inactive",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login successful",
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
});

/**
 * POST /api/auth/register
 * Register new citizen account
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
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

    // Create new citizen user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || "",
      role: "citizen",
      status: "active",
      createdBy: "self-registration",
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: newUser.toSafeObject(),
    });
  } catch (err) {
    console.error("Registration error:", err);

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
      error: "Server error during registration",
    });
  }
});

module.exports = router;
