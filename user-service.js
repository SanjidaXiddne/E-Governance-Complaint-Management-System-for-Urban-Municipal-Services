/**
 * User Management Service
 * Handles user registration, authentication, and management with localStorage persistence
 */

const UserService = (function () {
  // ============================================
  // CONFIGURATION
  // ============================================
  const USERS_KEY = "municipal_users";
  const EVENT_KEY = "user_event";
  const ACTIVITY_LOG_KEY = "municipal_activity_log";

  // ============================================
  // INITIAL DEFAULT USERS (System Users)
  // ============================================
  const DEFAULT_USERS = [
    {
      id: "USR-001",
      name: "John Doe",
      email: "citizen@demo.com",
      phone: "+880 1700 000000",
      password: "password123",
      role: "citizen",
      status: "active",
      createdAt: new Date("2025-01-01T10:00:00").toISOString(),
      isDefault: true,
    },
    {
      id: "USR-002",
      name: "Officer Jane Smith",
      email: "officer@demo.com",
      phone: "+880 1711 111111",
      password: "officer123",
      role: "officer",
      officerId: "OFF-001",
      department: "Water Works",
      status: "active",
      createdAt: new Date("2025-01-01T10:00:00").toISOString(),
      isDefault: true,
    },
    {
      id: "USR-003",
      name: "Fazlur Rahman",
      email: "technician@demo.com",
      phone: "+880 1722 222222",
      password: "tech123",
      role: "technician",
      technicianId: "TECH-003",
      department: "Electrical",
      specialty: "Electrical Specialist",
      status: "active",
      createdAt: new Date("2025-01-01T10:00:00").toISOString(),
      isDefault: true,
    },
    {
      id: "USR-004",
      name: "Administrator",
      email: "admin@demo.com",
      phone: "+880 1733 333333",
      password: "admin123",
      role: "admin",
      securityCode: "SECURE2025",
      status: "active",
      createdAt: new Date("2025-01-01T10:00:00").toISOString(),
      isDefault: true,
    },
  ];

  // ============================================
  // INTERNAL STATE
  // ============================================
  let listeners = [];

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Initialize storage with default users if empty
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    } else {
      // Ensure default users exist (merge)
      const existingUsers = getAllUsers();
      let needsUpdate = false;

      DEFAULT_USERS.forEach((defaultUser) => {
        const exists = existingUsers.find(
          (u) => u.email === defaultUser.email && u.isDefault
        );
        if (!exists) {
          existingUsers.push(defaultUser);
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        saveUsers(existingUsers);
      }
    }

    // Listen for storage events (cross-tab sync)
    window.addEventListener("storage", handleStorageEvent);

    console.log("UserService initialized");
  }

  // ============================================
  // USER OPERATIONS
  // ============================================

  // Get all users
  function getAllUsers() {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading users:", e);
      return [];
    }
  }

  // Get users by role
  function getUsersByRole(role) {
    return getAllUsers().filter((u) => u.role === role);
  }

  // Get user by ID
  function getUserById(id) {
    return getAllUsers().find((u) => u.id === id);
  }

  // Get user by email
  function getUserByEmail(email) {
    return getAllUsers().find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  // Generate new user ID
  function generateUserId() {
    const users = getAllUsers();
    const maxId = users.reduce((max, u) => {
      const num = parseInt(u.id.replace("USR-", ""));
      return num > max ? num : max;
    }, 4);
    return `USR-${String(maxId + 1).padStart(3, "0")}`;
  }

  // Register new citizen account
  function registerCitizen(userData) {
    const users = getAllUsers();

    // Check if email already exists
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    const newUser = {
      id: generateUserId(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      phone: userData.phone || "",
      password: userData.password,
      role: "citizen",
      status: "active",
      createdAt: new Date().toISOString(),
      isDefault: false,
    };

    users.push(newUser);
    saveUsers(users);

    // Log activity
    logUserRegistration(newUser);

    // Broadcast event
    broadcastEvent("USER_REGISTERED", {
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    return { success: true, user: newUser };
  }

  // Register staff user (officer/technician) - Admin only
  function registerStaff(userData) {
    const users = getAllUsers();

    // Check if email already exists
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    const newUser = {
      id: generateUserId(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      phone: userData.phone || "",
      password: userData.password || "password123", // Default password
      role: userData.role,
      department: userData.department || "",
      status: "active",
      createdAt: new Date().toISOString(),
      isDefault: false,
    };

    // Add role-specific fields
    if (userData.role === "officer") {
      newUser.officerId =
        userData.officerId || `OFF-${String(Date.now()).slice(-4)}`;
    } else if (userData.role === "technician") {
      newUser.technicianId =
        userData.technicianId || `TECH-${String(Date.now()).slice(-4)}`;
      newUser.specialty = userData.specialty || "";
    }

    users.push(newUser);
    saveUsers(users);

    // Log activity
    logUserRegistration(newUser);

    // Broadcast event
    broadcastEvent("STAFF_REGISTERED", {
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    return { success: true, user: newUser };
  }

  // Authenticate citizen
  function authenticateCitizen(email, password) {
    const user = getUserByEmail(email);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "citizen") {
      return { success: false, error: "Invalid credentials for citizen login" };
    }

    if (user.password !== password) {
      return { success: false, error: "Incorrect password" };
    }

    if (user.status !== "active") {
      return { success: false, error: "Account is inactive" };
    }

    // Update last login
    updateUser(user.id, { lastLogin: new Date().toISOString() });

    // Log activity
    logUserLogin(user);

    return { success: true, user: user };
  }

  // Authenticate officer
  function authenticateOfficer(email, password, officerId) {
    const user = getUserByEmail(email);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "officer") {
      return { success: false, error: "Invalid credentials for officer login" };
    }

    if (user.password !== password) {
      return { success: false, error: "Incorrect password" };
    }

    if (user.officerId !== officerId) {
      return { success: false, error: "Invalid Officer ID" };
    }

    if (user.status !== "active") {
      return { success: false, error: "Account is inactive" };
    }

    // Update last login
    updateUser(user.id, { lastLogin: new Date().toISOString() });

    // Log activity
    logUserLogin(user);

    return { success: true, user: user };
  }

  // Authenticate technician
  function authenticateTechnician(email, password, technicianId) {
    const user = getUserByEmail(email);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "technician") {
      return {
        success: false,
        error: "Invalid credentials for technician login",
      };
    }

    if (user.password !== password) {
      return { success: false, error: "Incorrect password" };
    }

    if (user.technicianId !== technicianId) {
      return { success: false, error: "Invalid Technician ID" };
    }

    if (user.status !== "active") {
      return { success: false, error: "Account is inactive" };
    }

    // Update last login
    updateUser(user.id, { lastLogin: new Date().toISOString() });

    // Log activity
    logUserLogin(user);

    return { success: true, user: user };
  }

  // Authenticate admin
  function authenticateAdmin(email, password, securityCode) {
    const user = getUserByEmail(email);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "admin") {
      return { success: false, error: "Invalid credentials for admin login" };
    }

    if (user.password !== password) {
      return { success: false, error: "Incorrect password" };
    }

    if (user.securityCode !== securityCode) {
      return { success: false, error: "Invalid security code" };
    }

    if (user.status !== "active") {
      return { success: false, error: "Account is inactive" };
    }

    // Update last login
    updateUser(user.id, { lastLogin: new Date().toISOString() });

    // Log activity
    logUserLogin(user);

    return { success: true, user: user };
  }

  // Update user
  function updateUser(id, updates) {
    const users = getAllUsers();
    const index = users.findIndex((u) => u.id === id);

    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveUsers(users);

      broadcastEvent("USER_UPDATED", users[index]);
      return users[index];
    }
    return null;
  }

  // Delete user
  function deleteUser(id) {
    const users = getAllUsers();
    const user = users.find((u) => u.id === id);

    if (user && user.isDefault) {
      return { success: false, error: "Cannot delete default system users" };
    }

    const filteredUsers = users.filter((u) => u.id !== id);

    if (filteredUsers.length < users.length) {
      saveUsers(filteredUsers);
      broadcastEvent("USER_DELETED", { userId: id });
      return { success: true };
    }

    return { success: false, error: "User not found" };
  }

  // Toggle user status
  function toggleUserStatus(id) {
    const users = getAllUsers();
    const index = users.findIndex((u) => u.id === id);

    if (index !== -1) {
      users[index].status =
        users[index].status === "active" ? "inactive" : "active";
      users[index].updatedAt = new Date().toISOString();
      saveUsers(users);

      broadcastEvent("USER_STATUS_CHANGED", users[index]);
      return users[index];
    }
    return null;
  }

  // Save users to storage
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // ============================================
  // STATISTICS
  // ============================================

  function getStats() {
    const users = getAllUsers();

    return {
      total: users.length,
      citizens: users.filter((u) => u.role === "citizen").length,
      officers: users.filter((u) => u.role === "officer").length,
      technicians: users.filter((u) => u.role === "technician").length,
      admins: users.filter((u) => u.role === "admin").length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      newThisWeek: users.filter((u) => {
        const created = new Date(u.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      }).length,
    };
  }

  // ============================================
  // EVENT HANDLING
  // ============================================

  function broadcastEvent(type, data) {
    const event = {
      type: type,
      data: data,
      timestamp: Date.now(),
    };

    localStorage.setItem(EVENT_KEY, JSON.stringify(event));
    notifyListeners(type, data);
  }

  function handleStorageEvent(e) {
    if (e.key === EVENT_KEY && e.newValue) {
      try {
        const event = JSON.parse(e.newValue);
        notifyListeners(event.type, event.data);
      } catch (err) {
        console.error("Error parsing storage event:", err);
      }
    }
  }

  function subscribe(callback) {
    listeners.push(callback);
    return function unsubscribe() {
      listeners = listeners.filter((l) => l !== callback);
    };
  }

  function notifyListeners(type, data) {
    listeners.forEach((callback) => {
      try {
        callback(type, data);
      } catch (err) {
        console.error("Error in listener:", err);
      }
    });
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function getInitials(name) {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }

  function getRoleBadgeClass(role) {
    const classes = {
      citizen: "bg-success",
      officer: "bg-primary",
      technician: "bg-warning text-dark",
      admin: "bg-danger",
    };
    return classes[role] || "bg-secondary";
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  // ============================================
  // ACTIVITY LOG
  // ============================================

  function getActivityLog() {
    try {
      const data = localStorage.getItem(ACTIVITY_LOG_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading activity log:", e);
      return [];
    }
  }

  function addActivityLog(activity) {
    const logs = getActivityLog();
    const newLog = {
      id: "ACT-" + Date.now(),
      timestamp: new Date().toISOString(),
      ...activity,
    };
    logs.unshift(newLog); // Add to beginning (newest first)

    // Keep only last 100 activities
    if (logs.length > 100) {
      logs.splice(100);
    }

    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs));
    broadcastEvent("ACTIVITY_LOGGED", newLog);
    return newLog;
  }

  function logUserRegistration(user) {
    return addActivityLog({
      type: "registration",
      action: "New account created",
      user: {
        id: user.id,
        name: user.name,
        initials: getInitials(user.name),
        role: user.role,
      },
      status: "success",
      statusLabel: "New",
      statusClass: "bg-info",
    });
  }

  function logUserLogin(user) {
    return addActivityLog({
      type: "login",
      action: `${capitalizeRole(user.role)} logged in`,
      user: {
        id: user.id,
        name: user.name,
        initials: getInitials(user.name),
        role: user.role,
      },
      status: "success",
      statusLabel: "Success",
      statusClass: "bg-success",
    });
  }

  function logComplaintAction(action, complaintId, user, status = "success") {
    const statusConfig = {
      success: { label: "Success", class: "bg-success" },
      new: { label: "New", class: "bg-info" },
      "in-progress": { label: "In Progress", class: "bg-warning text-dark" },
      resolved: { label: "Resolved", class: "bg-success" },
      assigned: { label: "Assigned", class: "bg-primary" },
    };

    const config = statusConfig[status] || statusConfig.success;

    return addActivityLog({
      type: "complaint",
      action: action,
      complaintId: complaintId,
      user: {
        id: user.id || "system",
        name: user.name || "System",
        initials: getInitials(user.name || "SY"),
        role: user.role || "system",
      },
      status: status,
      statusLabel: config.label,
      statusClass: config.class,
    });
  }

  function logUserAction(action, targetUser, performedBy) {
    return addActivityLog({
      type: "user_management",
      action: action,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
      },
      user: {
        id: performedBy.id || "admin",
        name: performedBy.name || "Administrator",
        initials: getInitials(performedBy.name || "AD"),
        role: performedBy.role || "admin",
      },
      status: "success",
      statusLabel: "Success",
      statusClass: "bg-success",
    });
  }

  function formatTimeAgo(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + " min ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago";
    if (seconds < 604800) return Math.floor(seconds / 86400) + " days ago";
    return formatDate(isoString);
  }

  function capitalizeRole(role) {
    const roleNames = {
      citizen: "Citizen",
      officer: "Officer",
      technician: "Technician",
      admin: "Administrator",
    };
    return roleNames[role] || role;
  }

  function clearActivityLog() {
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify([]));
    broadcastEvent("ACTIVITY_CLEARED", null);
  }

  // ============================================
  // RESET FOR TESTING
  // ============================================

  function resetToDefault() {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify([]));
    broadcastEvent("USERS_RESET", null);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    init,
    getAllUsers,
    getUsersByRole,
    getUserById,
    getUserByEmail,
    registerCitizen,
    registerStaff,
    authenticateCitizen,
    authenticateOfficer,
    authenticateTechnician,
    authenticateAdmin,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getStats,
    subscribe,
    broadcastEvent,
    getInitials,
    getRoleBadgeClass,
    formatDate,
    resetToDefault,
    // Activity Log
    getActivityLog,
    addActivityLog,
    logUserRegistration,
    logUserLogin,
    logComplaintAction,
    logUserAction,
    formatTimeAgo,
    clearActivityLog,
  };
})();

// Auto-initialize when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => UserService.init());
} else {
  UserService.init();
}
