/**
 * Complaint Routes
 * CRUD operations for complaints with timeline support
 */

const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");

/**
 * GET /api/complaints
 * Get all complaints with filtering and pagination
 */
router.get("/", async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      citizenEmail,
      technicianId,
      limit = 100,
      skip = 0,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (citizenEmail) query["citizen.email"] = citizenEmail.toLowerCase();
    if (technicianId) query["assignedTo.id"] = technicianId;

    const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 500);
    const skipNum = Math.max(parseInt(skip) || 0, 0);
    const sortOrder = order === "asc" ? 1 : -1;

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .sort({ [sort]: sortOrder })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: complaints,
      pagination: {
        total,
        limit: limitNum,
        skip: skipNum,
        hasMore: skipNum + complaints.length < total,
      },
    });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch complaints",
    });
  }
});

/**
 * GET /api/complaints/stats
 * Get complaint statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await Complaint.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
});

/**
 * GET /api/complaints/citizen/:email
 * Get complaints by citizen email (for "My Complaints")
 */
router.get("/citizen/:email", async (req, res) => {
  try {
    const complaints = await Complaint.findByCitizenEmail(req.params.email);
    res.json({
      success: true,
      data: complaints,
      count: complaints.length,
    });
  } catch (err) {
    console.error("Error fetching citizen complaints:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch complaints",
    });
  }
});

/**
 * GET /api/complaints/technician/:technicianId
 * Get complaints assigned to technician
 */
router.get("/technician/:technicianId", async (req, res) => {
  try {
    const complaints = await Complaint.findByTechnicianId(
      req.params.technicianId
    );
    res.json({
      success: true,
      data: complaints,
      count: complaints.length,
    });
  } catch (err) {
    console.error("Error fetching technician complaints:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch complaints",
    });
  }
});

/**
 * GET /api/complaints/:id
 * Get single complaint by ID or complaintId
 */
router.get("/:id", async (req, res) => {
  try {
    let complaint;

    // Try to find by complaintId first (e.g., CMPT-001)
    if (req.params.id.startsWith("CMPT-")) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    } else {
      // Try MongoDB ObjectId
      complaint = await Complaint.findById(req.params.id);
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    res.json({
      success: true,
      data: complaint,
    });
  } catch (err) {
    console.error("Error fetching complaint:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid complaint ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch complaint",
    });
  }
});

/**
 * GET /api/complaints/:id/timeline
 * Get complaint timeline
 */
router.get("/:id/timeline", async (req, res) => {
  try {
    let complaint;

    if (req.params.id.startsWith("CMPT-")) {
      complaint = await Complaint.findOne({
        complaintId: req.params.id,
      }).select("timeline complaintId");
    } else {
      complaint = await Complaint.findById(req.params.id).select(
        "timeline complaintId"
      );
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    res.json({
      success: true,
      data: complaint.timeline,
      complaintId: complaint.complaintId,
    });
  } catch (err) {
    console.error("Error fetching timeline:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch timeline",
    });
  }
});

/**
 * POST /api/complaints
 * Create new complaint
 */
router.post("/", async (req, res) => {
  try {
    const {
      category,
      categoryLabel,
      description,
      location,
      priority,
      citizen,
    } = req.body;

    if (!category || !description || !location || !citizen) {
      return res.status(400).json({
        success: false,
        error: "Category, description, location, and citizen info are required",
      });
    }

    // Generate complaint ID with retry logic for race conditions
    let complaintId;
    let newComplaint;
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        // Generate complaint ID
        complaintId = await Complaint.generateComplaintId();

        // Create citizen initials
        const initials = citizen.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        newComplaint = new Complaint({
          complaintId,
          category,
          categoryLabel: categoryLabel || category,
          description,
          location,
          priority: priority || "normal",
          status: "new",
          citizen: {
            ...citizen,
            email: citizen.email.toLowerCase(),
            initials,
          },
          timeline: [
            {
              type: "submitted",
              title: "Complaint Submitted",
              description: "Received from Citizen Portal",
              actor: citizen.name,
              actorRole: "citizen",
              timestamp: new Date(),
            },
          ],
        });

        await newComplaint.save();
        break; // Success, exit retry loop
      } catch (saveErr) {
        // Handle duplicate key error (race condition)
        if (saveErr.code === 11000 && saveErr.keyPattern?.complaintId) {
          retries++;
          if (retries >= maxRetries) {
            console.error(
              `Failed to create complaint after ${maxRetries} retries:`,
              saveErr
            );
            throw {
              ...saveErr,
              message:
                "Failed to generate unique complaint ID. Please try again.",
            };
          }
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * Math.pow(2, retries))
          );
          continue;
        }
        // If it's not a duplicate key error, throw immediately
        throw saveErr;
      }
    }

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: newComplaint,
    });
  } catch (err) {
    console.error("Error creating complaint:", err);

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    // Handle duplicate key error specifically
    if (err.code === 11000 && err.keyPattern?.complaintId) {
      return res.status(409).json({
        success: false,
        error: "Duplicate complaint ID detected. Please try again.",
        message: err.message || "A complaint with this ID already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Failed to create complaint",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/**
 * PUT /api/complaints/:id
 * Update complaint
 */
router.put("/:id", async (req, res) => {
  try {
    const { status, priority, assignedTo, description } = req.body;

    let complaint;
    if (req.params.id.startsWith("CMPT-")) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    } else {
      complaint = await Complaint.findById(req.params.id);
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    // Update fields
    if (priority) complaint.priority = priority;
    if (description) complaint.description = description;
    if (assignedTo) complaint.assignedTo = assignedTo;

    complaint.updatedAt = new Date();
    await complaint.save();

    res.json({
      success: true,
      message: "Complaint updated successfully",
      data: complaint,
    });
  } catch (err) {
    console.error("Error updating complaint:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update complaint",
    });
  }
});

/**
 * PATCH /api/complaints/:id/status
 * Update complaint status with timeline entry
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, actor, actorRole, description } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    let complaint;
    if (req.params.id.startsWith("CMPT-")) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    } else {
      complaint = await Complaint.findById(req.params.id);
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    await complaint.updateStatus(
      status,
      actor || "System",
      actorRole || "system",
      description
    );

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: complaint,
    });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update status",
    });
  }
});

/**
 * POST /api/complaints/:id/timeline
 * Add timeline entry
 */
router.post("/:id/timeline", async (req, res) => {
  try {
    const { type, title, description, actor, actorRole } = req.body;

    if (!type || !title || !actor) {
      return res.status(400).json({
        success: false,
        error: "Type, title, and actor are required",
      });
    }

    let complaint;
    if (req.params.id.startsWith("CMPT-")) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    } else {
      complaint = await Complaint.findById(req.params.id);
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    await complaint.addTimelineEntry({
      type,
      title,
      description,
      actor,
      actorRole,
    });

    res.status(201).json({
      success: true,
      message: "Timeline entry added",
      data: complaint.timeline,
    });
  } catch (err) {
    console.error("Error adding timeline entry:", err);
    res.status(500).json({
      success: false,
      error: "Failed to add timeline entry",
    });
  }
});

/**
 * POST /api/complaints/:id/progress
 * Add progress update (technician)
 */
router.post("/:id/progress", async (req, res) => {
  try {
    const { notes, timeSpent, technician } = req.body;

    if (!notes) {
      return res.status(400).json({
        success: false,
        error: "Notes are required",
      });
    }

    let complaint;
    if (req.params.id.startsWith("CMPT-")) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    } else {
      complaint = await Complaint.findById(req.params.id);
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    await complaint.addProgressUpdate({
      notes,
      timeSpent: parseFloat(timeSpent) || 0,
      technician,
    });

    // Also add timeline entry for progress update
    await complaint.addTimelineEntry({
      type: "progress",
      title: "Progress Update",
      description: `${notes} (${timeSpent || 0} hours spent)`,
      actor: technician || "Technician",
      actorRole: "technician",
    });

    res.status(201).json({
      success: true,
      message: "Progress update added",
      data: complaint,
    });
  } catch (err) {
    console.error("Error adding progress update:", err);
    res.status(500).json({
      success: false,
      error: "Failed to add progress update",
    });
  }
});

/**
 * PATCH /api/complaints/:id/assign
 * Assign complaint to technician
 */
router.patch("/:id/assign", async (req, res) => {
  try {
    const { technicianId, technicianName, assignedBy, assignedByRole } =
      req.body;

    if (!technicianId || !technicianName) {
      return res.status(400).json({
        success: false,
        error: "Technician ID and name are required",
      });
    }

    let complaint;
    if (req.params.id.startsWith("CMPT-")) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    } else {
      complaint = await Complaint.findById(req.params.id);
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    complaint.assignedTo = {
      id: technicianId,
      name: technicianName,
    };
    complaint.status = "assigned";
    complaint.updatedAt = new Date();

    // Add timeline entry
    complaint.timeline.push({
      type: "assigned",
      title: "Assigned to Technician",
      description: `Assigned to ${technicianName} (${technicianId})`,
      actor: assignedBy || "Officer",
      actorRole: assignedByRole || "officer",
      timestamp: new Date(),
    });

    await complaint.save();

    res.json({
      success: true,
      message: `Complaint assigned to ${technicianName}`,
      data: complaint,
    });
  } catch (err) {
    console.error("Error assigning complaint:", err);
    res.status(500).json({
      success: false,
      error: "Failed to assign complaint",
    });
  }
});

/**
 * DELETE /api/complaints/:id
 * Delete complaint (admin only)
 */
router.delete("/:id", async (req, res) => {
  try {
    let complaint;
    if (req.params.id.startsWith("CMPT-")) {
      complaint = await Complaint.findOneAndDelete({
        complaintId: req.params.id,
      });
    } else {
      complaint = await Complaint.findByIdAndDelete(req.params.id);
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    res.json({
      success: true,
      message: "Complaint deleted successfully",
      data: { id: req.params.id },
    });
  } catch (err) {
    console.error("Error deleting complaint:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete complaint",
    });
  }
});

module.exports = router;
