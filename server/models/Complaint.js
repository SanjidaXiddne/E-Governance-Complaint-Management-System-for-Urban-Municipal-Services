/**
 * Complaint Model
 * Mongoose schema for complaints with timeline tracking
 */

const mongoose = require("mongoose");

// Timeline Entry Schema (embedded)
const TimelineEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "submitted",
        "acknowledged",
        "assigned",
        "in-progress",
        "progress",
        "resolved",
        "completed",
        "rejected",
        "closed",
        "reopened",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    actor: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      enum: ["citizen", "officer", "technician", "admin", "system"],
      default: "system",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Progress Update Schema (embedded)
const ProgressUpdateSchema = new mongoose.Schema(
  {
    notes: {
      type: String,
      required: true,
    },
    timeSpent: {
      type: Number,
      default: 0,
    },
    technician: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Main Complaint Schema
const ComplaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      required: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Water", "Road", "Waste", "Light", "Drainage", "Other"],
    },
    categoryLabel: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    status: {
      type: String,
      enum: [
        "new",
        "acknowledged",
        "assigned",
        "in-progress",
        "resolved",
        "completed",
        "rejected",
        "closed",
      ],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "medium", "high", "urgent"],
      default: "normal",
    },
    // Citizen who filed the complaint
    citizen: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      initials: { type: String },
    },
    // Assigned technician
    assignedTo: {
      id: { type: String },
      name: { type: String },
      odRef: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    // Officer who handled the complaint
    handledBy: {
      id: { type: String },
      name: { type: String },
      odRef: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    // Timeline entries
    timeline: [TimelineEntrySchema],
    // Progress updates from technician
    progressUpdates: [ProgressUpdateSchema],
    // Time tracking
    totalTimeSpent: {
      type: Number,
      default: 0,
    },
    workStartedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    // Attachments (future use)
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES
// Note: complaintId already has unique:true in schema
// ============================================
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ priority: 1 });
ComplaintSchema.index({ "citizen.email": 1 });
ComplaintSchema.index({ "citizen.id": 1 });
ComplaintSchema.index({ "assignedTo.id": 1 });
ComplaintSchema.index({ createdAt: -1 });
ComplaintSchema.index({ status: 1, createdAt: -1 });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Generate next complaint ID
 */
ComplaintSchema.statics.generateComplaintId = async function () {
  const lastComplaint = await this.findOne().sort({ createdAt: -1 });
  if (!lastComplaint) {
    return "CMPT-001";
  }
  const lastNum = parseInt(lastComplaint.complaintId.replace("CMPT-", ""));
  return `CMPT-${String(lastNum + 1).padStart(3, "0")}`;
};

/**
 * Get complaints by citizen email
 */
ComplaintSchema.statics.findByCitizenEmail = function (email) {
  return this.find({ "citizen.email": email.toLowerCase() }).sort({
    createdAt: -1,
  });
};

/**
 * Get complaints by citizen ID
 */
ComplaintSchema.statics.findByCitizenId = function (citizenId) {
  return this.find({ "citizen.id": citizenId }).sort({ createdAt: -1 });
};

/**
 * Get complaints assigned to technician
 */
ComplaintSchema.statics.findByTechnicianId = function (technicianId) {
  return this.find({ "assignedTo.id": technicianId }).sort({ createdAt: -1 });
};

/**
 * Get complaint statistics
 */
ComplaintSchema.statics.getStats = async function () {
  const [total, byStatus, byCategory, byPriority, recentWeek] =
    await Promise.all([
      this.countDocuments(),
      this.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      this.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      this.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      this.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

  const statusStats = {};
  byStatus.forEach((s) => (statusStats[s._id] = s.count));

  const categoryStats = {};
  byCategory.forEach((c) => (categoryStats[c._id] = c.count));

  const priorityStats = {};
  byPriority.forEach((p) => (priorityStats[p._id] = p.count));

  return {
    total,
    new: statusStats.new || 0,
    acknowledged: statusStats.acknowledged || 0,
    assigned: statusStats.assigned || 0,
    inProgress: statusStats["in-progress"] || 0,
    resolved: statusStats.resolved || 0,
    closed: statusStats.closed || 0,
    categories: categoryStats,
    priorities: priorityStats,
    newThisWeek: recentWeek,
  };
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Add timeline entry
 */
ComplaintSchema.methods.addTimelineEntry = function (entry) {
  this.timeline.push({
    type: entry.type,
    title: entry.title,
    description: entry.description || "",
    actor: entry.actor,
    actorRole: entry.actorRole || "system",
    timestamp: entry.timestamp || new Date(),
  });
  return this.save();
};

/**
 * Add progress update
 */
ComplaintSchema.methods.addProgressUpdate = function (update) {
  this.progressUpdates.push({
    notes: update.notes,
    timeSpent: update.timeSpent || 0,
    technician: update.technician,
    date: update.date || new Date(),
  });
  this.totalTimeSpent = (this.totalTimeSpent || 0) + (update.timeSpent || 0);
  return this.save();
};

/**
 * Update status with timeline entry
 */
ComplaintSchema.methods.updateStatus = async function (
  newStatus,
  actor,
  actorRole,
  description
) {
  const oldStatus = this.status;
  this.status = newStatus;
  this.updatedAt = new Date();

  // Set timestamps based on status
  if (newStatus === "in-progress" && !this.workStartedAt) {
    this.workStartedAt = new Date();
  } else if (newStatus === "resolved" || newStatus === "completed") {
    this.resolvedAt = new Date();
  } else if (newStatus === "closed") {
    this.closedAt = new Date();
  }

  // Add timeline entry
  const statusTitles = {
    new: "Complaint Submitted",
    acknowledged: "Complaint Acknowledged",
    assigned: "Assigned to Technician",
    "in-progress": "Work In Progress",
    resolved: "Issue Resolved",
    completed: "Task Completed",
    rejected: "Complaint Rejected",
    closed: "Complaint Closed",
  };

  this.timeline.push({
    type: newStatus,
    title: statusTitles[newStatus] || `Status changed to ${newStatus}`,
    description:
      description || `Status changed from ${oldStatus} to ${newStatus}`,
    actor: actor,
    actorRole: actorRole,
    timestamp: new Date(),
  });

  return this.save();
};

module.exports = mongoose.model("Complaint", ComplaintSchema);
