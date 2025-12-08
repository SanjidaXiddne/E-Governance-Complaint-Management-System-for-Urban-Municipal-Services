/**
 * User Model
 * Mongoose schema for all user types: citizen, officer, technician, admin
 */

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["citizen", "officer", "technician", "admin"],
      required: [true, "Role is required"],
      default: "citizen",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
    // Officer-specific fields
    officerId: {
      type: String,
      trim: true,
      sparse: true,
    },
    // Technician-specific fields
    technicianId: {
      type: String,
      trim: true,
      sparse: true,
    },
    specialty: {
      type: String,
      trim: true,
    },
    // Common staff fields
    department: {
      type: String,
      trim: true,
    },
    // Admin-specific fields
    securityCode: {
      type: String,
      trim: true,
    },
    // System fields
    isDefault: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    createdBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password; // Never send password in response
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES
// Note: email already has unique:true in schema, which creates an index
// Note: officerId and technicianId have sparse:true in schema
// ============================================
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find user by email
 */
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find users by role
 */
UserSchema.statics.findByRole = function (role) {
  return this.find({ role }).sort({ createdAt: -1 });
};

/**
 * Authenticate user
 */
UserSchema.statics.authenticate = async function (email, password) {
  const user = await this.findOne({ email: email.toLowerCase() });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.password !== password) {
    return { success: false, error: "Incorrect password" };
  }

  if (user.status !== "active") {
    return { success: false, error: "Account is inactive" };
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  return { success: true, user };
};

/**
 * Get user statistics
 */
UserSchema.statics.getStats = async function () {
  const [total, byRole, byStatus, newThisWeek] = await Promise.all([
    this.countDocuments(),
    this.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    this.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    this.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  const roleStats = {};
  byRole.forEach((r) => (roleStats[r._id] = r.count));

  const statusStats = {};
  byStatus.forEach((s) => (statusStats[s._id] = s.count));

  return {
    total,
    citizens: roleStats.citizen || 0,
    officers: roleStats.officer || 0,
    technicians: roleStats.technician || 0,
    admins: roleStats.admin || 0,
    active: statusStats.active || 0,
    inactive: statusStats.inactive || 0,
    pending: statusStats.pending || 0,
    newThisWeek,
  };
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Get safe user object (without sensitive data)
 */
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.securityCode;
  return obj;
};

/**
 * Check if user has specific role
 */
UserSchema.methods.hasRole = function (role) {
  return this.role === role;
};

module.exports = mongoose.model("User", UserSchema);
