/**
 * Citizen Model
 * Mongoose schema for manually added citizen data with validation and indexing
 */

const mongoose = require("mongoose");

const CitizenSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [50, "Username cannot exceed 50 characters"],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens",
      ],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      sparse: true, // Allows multiple null values for unique index
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/,
        "Please provide a valid phone number",
      ],
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },
    createdBy: {
      type: String,
      trim: true,
      default: "admin",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES for frequently queried fields
// Note: username already has unique:true in schema, which creates an index
// Note: email already has sparse:true in schema
// ============================================
CitizenSchema.index({ createdAt: -1 }); // Descending for recent records
CitizenSchema.index({ status: 1 });
CitizenSchema.index({ createdBy: 1 });
CitizenSchema.index({ name: "text" }); // Text search on name

// Compound index for common queries
CitizenSchema.index({ status: 1, createdAt: -1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================
CitizenSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find citizen by username
 * @param {String} username - The username to search for
 * @returns {Promise} Citizen document or null
 */
CitizenSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username.toLowerCase() });
};

/**
 * Find citizens by status
 * @param {String} status - The status to filter by
 * @returns {Promise} Array of citizen documents
 */
CitizenSchema.statics.findByStatus = function (status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

/**
 * Find recently added citizens
 * @param {Number} limit - Maximum number of records to return
 * @returns {Promise} Array of citizen documents
 */
CitizenSchema.statics.findRecent = function (limit = 10) {
  return this.find().sort({ createdAt: -1 }).limit(limit);
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Get a safe representation of the citizen (without sensitive data)
 * @returns {Object} Safe citizen object
 */
CitizenSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  return {
    id: obj._id,
    username: obj.username,
    name: obj.name,
    email: obj.email,
    phone: obj.phone,
    address: obj.address,
    status: obj.status,
    createdAt: obj.createdAt,
    createdBy: obj.createdBy,
  };
};

module.exports = mongoose.model("Citizen", CitizenSchema);
