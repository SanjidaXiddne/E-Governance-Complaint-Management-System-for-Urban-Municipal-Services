/**
 * Admin Routes Test Suite
 * Tests for the /api/admin endpoints including manual-add
 */

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { app } = require("../index");
const Citizen = require("../models/Citizen");

let mongoServer;

// ============================================
// TEST SETUP AND TEARDOWN
// ============================================

beforeAll(async () => {
  // Create an in-memory MongoDB instance for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Clean up connections
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all data before each test
  await Citizen.deleteMany({});
});

// ============================================
// TEST DATA
// ============================================

const validCitizenData = {
  username: "john_doe",
  name: "John Doe",
  email: "john@example.com",
  phone: "+880 1700 000000",
  address: "123 Main Street, Dhaka, Bangladesh",
  createdBy: "admin",
  metadata: {
    source: "manual_entry",
    notes: "Test citizen",
  },
};

const minimalCitizenData = {
  username: "jane_doe",
  name: "Jane Doe",
};

// ============================================
// POST /api/admin/manual-add TESTS
// ============================================

describe("POST /api/admin/manual-add", () => {
  describe("Success Cases", () => {
    it("should create a new citizen with all fields", async () => {
      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(validCitizenData)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Citizen added successfully");
      expect(response.body.data).toMatchObject({
        username: validCitizenData.username,
        name: validCitizenData.name,
        email: validCitizenData.email.toLowerCase(),
        phone: validCitizenData.phone,
        address: validCitizenData.address,
        createdBy: validCitizenData.createdBy,
        status: "active",
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    it("should create a new citizen with minimal required fields", async () => {
      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(minimalCitizenData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(minimalCitizenData.username);
      expect(response.body.data.name).toBe(minimalCitizenData.name);
      expect(response.body.data.status).toBe("active");
    });

    it("should convert email to lowercase", async () => {
      const data = {
        username: "test_user",
        name: "Test User",
        email: "TEST@EXAMPLE.COM",
      };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(data)
        .expect(201);

      expect(response.body.data.email).toBe("test@example.com");
    });

    it("should save citizen to database", async () => {
      await request(app)
        .post("/api/admin/manual-add")
        .send(validCitizenData)
        .expect(201);

      const savedCitizen = await Citizen.findOne({
        username: validCitizenData.username,
      });
      expect(savedCitizen).toBeDefined();
      expect(savedCitizen.name).toBe(validCitizenData.name);
    });
  });

  describe("Validation Errors", () => {
    it("should return 400 when username is missing", async () => {
      const data = { name: "John Doe" };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(data)
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toContain("Username is required");
    });

    it("should return 400 when name is missing", async () => {
      const data = { username: "john_doe" };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(data)
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toContain("Name is required");
    });

    it("should return 400 when username is too short", async () => {
      const data = { username: "ab", name: "John Doe" };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(data)
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toContain(
        "Username must be at least 3 characters long"
      );
    });

    it("should return 400 when username contains invalid characters", async () => {
      const data = { username: "john@doe!", name: "John Doe" };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(data)
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
    });

    it("should return 400 when email format is invalid", async () => {
      const data = {
        username: "john_doe",
        name: "John Doe",
        email: "invalid-email",
      };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(data)
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toContain(
        "Please provide a valid email address"
      );
    });

    it("should return 400 when phone format is invalid", async () => {
      const data = {
        username: "john_doe",
        name: "John Doe",
        phone: "not-a-phone",
      };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(data)
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
    });

    it("should return 400 when status is invalid", async () => {
      const data = {
        username: "john_doe",
        name: "John Doe",
        status: "invalid_status",
      };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(data)
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe("Duplicate Handling", () => {
    it("should return 409 when username already exists", async () => {
      // Create first citizen
      await request(app)
        .post("/api/admin/manual-add")
        .send(validCitizenData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(validCitizenData)
        .expect(409);

      expect(response.body.error).toBe("Username already exists");
      expect(response.body.field).toBe("username");
    });

    it("should return 409 when email already exists", async () => {
      // Create first citizen
      await request(app)
        .post("/api/admin/manual-add")
        .send(validCitizenData)
        .expect(201);

      // Try to create citizen with same email but different username
      const duplicateEmailData = {
        username: "different_username",
        name: "Different Person",
        email: validCitizenData.email,
      };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(duplicateEmailData)
        .expect(409);

      expect(response.body.error).toBe("Email already exists");
    });
  });

  describe("Input Sanitization", () => {
    it("should trim whitespace from string fields", async () => {
      const data = {
        username: "  test_user  ",
        name: "  Test User  ",
        email: "  test@example.com  ",
      };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(data)
        .expect(201);

      expect(response.body.data.username).toBe("test_user");
      expect(response.body.data.name).toBe("Test User");
      expect(response.body.data.email).toBe("test@example.com");
    });

    it("should remove potentially harmful characters", async () => {
      const data = {
        username: "test_user",
        name: '<script>alert("xss")</script>John',
        address: "Some address with {brackets}",
      };

      const response = await request(app)
        .post("/api/admin/manual-add")
        .send(data)
        .expect(201);

      expect(response.body.data.name).not.toContain("<script>");
      expect(response.body.data.address).not.toContain("{");
    });
  });
});

// ============================================
// GET /api/admin/citizens TESTS
// ============================================

describe("GET /api/admin/citizens", () => {
  beforeEach(async () => {
    // Create test citizens
    await Citizen.create([
      { username: "user1", name: "User One", status: "active" },
      { username: "user2", name: "User Two", status: "active" },
      { username: "user3", name: "User Three", status: "inactive" },
    ]);
  });

  it("should return all citizens", async () => {
    const response = await request(app).get("/api/admin/citizens").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.pagination.total).toBe(3);
  });

  it("should filter citizens by status", async () => {
    const response = await request(app)
      .get("/api/admin/citizens?status=active")
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((c) => c.status === "active")).toBe(true);
  });

  it("should support pagination", async () => {
    const response = await request(app)
      .get("/api/admin/citizens?limit=2&skip=0")
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.pagination.hasMore).toBe(true);
  });

  it("should limit maximum results to 100", async () => {
    const response = await request(app)
      .get("/api/admin/citizens?limit=999")
      .expect(200);

    expect(response.body.pagination.limit).toBe(100);
  });
});

// ============================================
// GET /api/admin/citizens/:id TESTS
// ============================================

describe("GET /api/admin/citizens/:id", () => {
  let citizenId;

  beforeEach(async () => {
    const citizen = await Citizen.create({
      username: "test_user",
      name: "Test User",
    });
    citizenId = citizen._id.toString();
  });

  it("should return a specific citizen", async () => {
    const response = await request(app)
      .get(`/api/admin/citizens/${citizenId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.username).toBe("test_user");
  });

  it("should return 404 for non-existent citizen", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/admin/citizens/${fakeId}`)
      .expect(404);

    expect(response.body.error).toBe("Citizen not found");
  });

  it("should return 400 for invalid ID format", async () => {
    const response = await request(app)
      .get("/api/admin/citizens/invalid-id")
      .expect(400);

    expect(response.body.error).toBe("Invalid citizen ID format");
  });
});

// ============================================
// DELETE /api/admin/citizens/:id TESTS
// ============================================

describe("DELETE /api/admin/citizens/:id", () => {
  let citizenId;

  beforeEach(async () => {
    const citizen = await Citizen.create({
      username: "delete_me",
      name: "Delete Me",
    });
    citizenId = citizen._id.toString();
  });

  it("should delete a citizen", async () => {
    const response = await request(app)
      .delete(`/api/admin/citizens/${citizenId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Citizen deleted successfully");

    // Verify deletion
    const deleted = await Citizen.findById(citizenId);
    expect(deleted).toBeNull();
  });

  it("should return 404 for non-existent citizen", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .delete(`/api/admin/citizens/${fakeId}`)
      .expect(404);

    expect(response.body.error).toBe("Citizen not found");
  });
});

// ============================================
// HEALTH CHECK TEST
// ============================================

describe("GET /api/health", () => {
  it("should return health status", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
  });
});
