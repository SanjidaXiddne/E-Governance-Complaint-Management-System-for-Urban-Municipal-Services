/**
 * Database Seed Script
 * Populates the database with default users
 *
 * Run with: node server/seed.js
 */

require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const DEFAULT_USERS = [
  {
    name: "John Doe",
    email: "citizen@demo.com",
    phone: "+880 1700 000000",
    password: "password123",
    role: "citizen",
    status: "active",
    isDefault: true,
    createdBy: "system",
  },
  {
    name: "Officer Jane Smith",
    email: "officer@demo.com",
    phone: "+880 1711 111111",
    password: "officer123",
    role: "officer",
    officerId: "OFF-001",
    department: "Water Works",
    status: "active",
    isDefault: true,
    createdBy: "system",
  },
  {
    name: "Fazlur Rahman",
    email: "technician@demo.com",
    phone: "+880 1722 222222",
    password: "tech123",
    role: "technician",
    technicianId: "TECH-003",
    department: "Electrical",
    specialty: "Electrical Specialist",
    status: "active",
    isDefault: true,
    createdBy: "system",
  },
  {
    name: "Administrator",
    email: "admin@demo.com",
    phone: "+880 1733 333333",
    password: "admin123",
    role: "admin",
    securityCode: "SECURE2025",
    status: "active",
    isDefault: true,
    createdBy: "system",
  },
];

async function seedDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI environment variable is not set");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    console.log("Seeding default users...");

    for (const userData of DEFAULT_USERS) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
      } else {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.email} (${userData.role})`);
      }
    }

    console.log("\nSeeding completed!");

    // Display summary
    const stats = await User.getStats();
    console.log("\nUser Statistics:");
    console.log(`  Total users: ${stats.total}`);
    console.log(`  Citizens: ${stats.citizens}`);
    console.log(`  Officers: ${stats.officers}`);
    console.log(`  Technicians: ${stats.technicians}`);
    console.log(`  Admins: ${stats.admins}`);

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
