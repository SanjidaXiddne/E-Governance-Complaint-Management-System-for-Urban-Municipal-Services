/**
 * Complaint Seed Script
 * Populates the database with sample complaints
 *
 * Run with: node server/seedComplaints.js
 */

require("dotenv").config();

const mongoose = require("mongoose");
const Complaint = require("./models/Complaint");

const SAMPLE_COMPLAINTS = [
  {
    complaintId: "CMPT-130",
    category: "Water",
    categoryLabel: "Water Leakage",
    description:
      "Major water pipe leakage causing road flooding near the main intersection.",
    location: "Gulshan-2, Dhaka",
    status: "new",
    priority: "normal",
    citizen: {
      name: "John Doe",
      email: "citizen@demo.com",
      phone: "+880 1700 000000",
      initials: "JD",
    },
    timeline: [
      {
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "John Doe",
        actorRole: "citizen",
        timestamp: new Date("2025-08-24T10:30:00"),
      },
    ],
  },
  {
    complaintId: "CMPT-131",
    category: "Road",
    categoryLabel: "Pothole",
    description: "Large pothole on the main road causing traffic issues.",
    location: "Dhanmondi-27, Dhaka",
    status: "new",
    priority: "high",
    citizen: {
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "+880 1711 111111",
      initials: "MS",
    },
    timeline: [
      {
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "Maria Santos",
        actorRole: "citizen",
        timestamp: new Date("2025-08-24T09:15:00"),
      },
    ],
  },
  {
    complaintId: "CMPT-129",
    category: "Waste",
    categoryLabel: "Waste Management",
    description: "Garbage not collected for 3 days.",
    location: "Banani, Dhaka",
    status: "acknowledged",
    priority: "medium",
    citizen: {
      name: "John Doe",
      email: "citizen@demo.com",
      phone: "+880 1700 000000",
      initials: "JD",
    },
    timeline: [
      {
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "John Doe",
        actorRole: "citizen",
        timestamp: new Date("2025-08-22T14:20:00"),
      },
      {
        type: "acknowledged",
        title: "Complaint Acknowledged",
        description: "Reviewed by municipal officer",
        actor: "Officer Jane Smith",
        actorRole: "officer",
        timestamp: new Date("2025-08-22T16:00:00"),
      },
    ],
  },
  {
    complaintId: "CMPT-128",
    category: "Light",
    categoryLabel: "Street Lighting",
    description:
      "Multiple street lights not working on the road near the community center. Residents report safety concerns during evening hours.",
    location: "Uttara Sector-7, Dhaka",
    status: "in-progress",
    priority: "medium",
    citizen: {
      name: "John Doe",
      email: "citizen@demo.com",
      phone: "+880 1700 000000",
      initials: "JD",
    },
    assignedTo: {
      id: "TECH-003",
      name: "Fazlur Rahman",
    },
    workStartedAt: new Date("2025-08-21T10:00:00"),
    progressUpdates: [
      {
        notes:
          "Inspected all 5 street lights. Found 3 with burnt out bulbs and 2 with wiring issues.",
        timeSpent: 1.5,
        technician: "Fazlur Rahman",
        date: new Date("2025-08-21T10:30:00"),
      },
    ],
    totalTimeSpent: 1.5,
    timeline: [
      {
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "John Doe",
        actorRole: "citizen",
        timestamp: new Date("2025-08-20T11:00:00"),
      },
      {
        type: "acknowledged",
        title: "Complaint Acknowledged",
        description: "Reviewed by municipal officer",
        actor: "Officer Jane Smith",
        actorRole: "officer",
        timestamp: new Date("2025-08-20T14:00:00"),
      },
      {
        type: "assigned",
        title: "Assigned to Technician",
        description:
          "Assigned to Fazlur Rahman (TECH-003) - Electrical Specialist",
        actor: "Officer Jane Smith",
        actorRole: "officer",
        timestamp: new Date("2025-08-21T09:30:00"),
      },
      {
        type: "in-progress",
        title: "Work Started",
        description: "Fazlur Rahman has started working on this issue.",
        actor: "Fazlur Rahman",
        actorRole: "technician",
        timestamp: new Date("2025-08-21T10:00:00"),
      },
      {
        type: "progress",
        title: "Progress Update",
        description:
          "Inspected all 5 street lights. Found 3 with burnt out bulbs and 2 with wiring issues. (1.5 hours spent)",
        actor: "Fazlur Rahman",
        actorRole: "technician",
        timestamp: new Date("2025-08-21T10:30:00"),
      },
    ],
  },
  {
    complaintId: "CMPT-127",
    category: "Water",
    categoryLabel: "Water Leakage",
    description:
      "Water pipe burst near the main gate causing flooding in the parking area.",
    location: "Gulshan Circle-1, Dhaka",
    status: "in-progress",
    priority: "high",
    citizen: {
      name: "Sarah Khan",
      email: "sarah@example.com",
      phone: "+880 1755 555555",
      initials: "SK",
    },
    assignedTo: {
      id: "TECH-003",
      name: "Fazlur Rahman",
    },
    workStartedAt: new Date("2025-08-23T09:00:00"),
    timeline: [
      {
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "Sarah Khan",
        actorRole: "citizen",
        timestamp: new Date("2025-08-22T16:00:00"),
      },
      {
        type: "acknowledged",
        title: "Complaint Acknowledged",
        description: "Reviewed and marked as high priority",
        actor: "Officer Jane Smith",
        actorRole: "officer",
        timestamp: new Date("2025-08-22T17:30:00"),
      },
      {
        type: "assigned",
        title: "Assigned to Technician",
        description:
          "Assigned to Fazlur Rahman (TECH-003) - Plumbing Specialist",
        actor: "Officer Jane Smith",
        actorRole: "officer",
        timestamp: new Date("2025-08-23T08:00:00"),
      },
      {
        type: "in-progress",
        title: "Work Started",
        description: "Fazlur Rahman has started working on this issue.",
        actor: "Fazlur Rahman",
        actorRole: "technician",
        timestamp: new Date("2025-08-23T09:00:00"),
      },
    ],
  },
  {
    complaintId: "CMPT-125",
    category: "Road",
    categoryLabel: "Pothole",
    description: "Small pothole near school entrance.",
    location: "Mirpur-10, Dhaka",
    status: "resolved",
    priority: "low",
    citizen: {
      name: "John Doe",
      email: "citizen@demo.com",
      phone: "+880 1700 000000",
      initials: "JD",
    },
    resolvedAt: new Date("2025-08-18T15:00:00"),
    timeline: [
      {
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "John Doe",
        actorRole: "citizen",
        timestamp: new Date("2025-08-15T10:00:00"),
      },
      {
        type: "acknowledged",
        title: "Complaint Acknowledged",
        description: "Reviewed by municipal officer",
        actor: "Officer Jane Smith",
        actorRole: "officer",
        timestamp: new Date("2025-08-15T14:00:00"),
      },
      {
        type: "assigned",
        title: "Assigned to Technician",
        description: "Assigned to road maintenance team",
        actor: "Officer Jane Smith",
        actorRole: "officer",
        timestamp: new Date("2025-08-16T09:00:00"),
      },
      {
        type: "in-progress",
        title: "Work Started",
        description: "Road maintenance team has started repair work.",
        actor: "Road Team",
        actorRole: "technician",
        timestamp: new Date("2025-08-17T08:00:00"),
      },
      {
        type: "resolved",
        title: "Issue Resolved",
        description: "Pothole has been filled and road surface repaired.",
        actor: "Road Team",
        actorRole: "technician",
        timestamp: new Date("2025-08-18T15:00:00"),
      },
    ],
  },
];

async function seedComplaints() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI environment variable is not set");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    console.log("Seeding sample complaints...");

    for (const complaintData of SAMPLE_COMPLAINTS) {
      // Check if complaint already exists
      const existing = await Complaint.findOne({
        complaintId: complaintData.complaintId,
      });

      if (existing) {
        console.log(
          `Complaint ${complaintData.complaintId} already exists, skipping...`
        );
      } else {
        const complaint = new Complaint(complaintData);
        await complaint.save();
        console.log(
          `Created complaint: ${complaintData.complaintId} (${complaintData.category})`
        );
      }
    }

    console.log("\nSeeding completed!");

    // Display summary
    const stats = await Complaint.getStats();
    console.log("\nComplaint Statistics:");
    console.log(`  Total complaints: ${stats.total}`);
    console.log(`  New: ${stats.new}`);
    console.log(`  Acknowledged: ${stats.acknowledged}`);
    console.log(`  In Progress: ${stats.inProgress}`);
    console.log(`  Resolved: ${stats.resolved}`);

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

// Run the seed function
seedComplaints();
