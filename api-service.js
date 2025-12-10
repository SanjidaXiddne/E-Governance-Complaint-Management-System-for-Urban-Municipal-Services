/**
 * API Service
 * Frontend service for communicating with the backend API
 * Replaces localStorage-based UserService with MongoDB-backed API calls
 */

const ApiService = (function () {
  // ============================================
  // CONFIGURATION
  // ============================================
  const API_BASE_URL = window.location.origin + "/api";
  const CURRENT_USER_KEY = "current_user";
  const EVENT_KEY = "user_event";

  // ============================================
  // INTERNAL STATE
  // ============================================
  let listeners = [];
  let currentUser = null;

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Load current user from session storage
    const storedUser = sessionStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
      } catch (e) {
        console.error("Error parsing stored user:", e);
        sessionStorage.removeItem(CURRENT_USER_KEY);
      }
    }

    // Listen for storage events (cross-tab sync)
    window.addEventListener("storage", handleStorageEvent);

    console.log("ApiService initialized");
  }

  // ============================================
  // HTTP HELPERS
  // ============================================

  async function apiRequest(endpoint, options = {}) {
    // Add cache-buster for GET requests to prevent stale data
    let url = `${API_BASE_URL}${endpoint}`;
    if (!options.method || options.method === "GET") {
      const separator = url.includes("?") ? "&" : "?";
      url += `${separator}_t=${Date.now()}`;
    }

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.error || data.message || "Request failed",
          data: data,
        };
      }

      return data;
    } catch (err) {
      if (err.status) {
        throw err;
      }
      console.error("API Request failed:", err);
      throw { status: 500, message: "Network error. Please try again." };
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async function authenticateCitizen(email, password) {
    try {
      const result = await apiRequest("/auth/login/citizen", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (result.success) {
        setCurrentUser(result.user);
        logUserLogin(result.user);
        broadcastEvent("USER_LOGGED_IN", result.user);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function authenticateOfficer(email, password, officerId) {
    try {
      const result = await apiRequest("/auth/login/officer", {
        method: "POST",
        body: JSON.stringify({ email, password, officerId }),
      });

      if (result.success) {
        setCurrentUser(result.user);
        logUserLogin(result.user);
        broadcastEvent("USER_LOGGED_IN", result.user);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function authenticateTechnician(email, password, technicianId) {
    try {
      const result = await apiRequest("/auth/login/technician", {
        method: "POST",
        body: JSON.stringify({ email, password, technicianId }),
      });

      if (result.success) {
        setCurrentUser(result.user);
        logUserLogin(result.user);
        broadcastEvent("USER_LOGGED_IN", result.user);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function authenticateAdmin(email, password, securityCode) {
    try {
      const result = await apiRequest("/auth/login/admin", {
        method: "POST",
        body: JSON.stringify({ email, password, securityCode }),
      });

      if (result.success) {
        setCurrentUser(result.user);
        logUserLogin(result.user);
        broadcastEvent("USER_LOGGED_IN", result.user);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function registerCitizen(userData) {
    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          phone: userData.phone || "",
        }),
      });

      if (result.success) {
        logUserRegistration(result.user);
        broadcastEvent("USER_REGISTERED", result.user);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function logout() {
    const user = currentUser;
    currentUser = null;
    sessionStorage.removeItem(CURRENT_USER_KEY);
    broadcastEvent("USER_LOGGED_OUT", user);
    return { success: true };
  }

  function setCurrentUser(user) {
    currentUser = user;
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  function getCurrentUser() {
    return currentUser;
  }

  function isLoggedIn() {
    return currentUser !== null;
  }

  // ============================================
  // USER OPERATIONS
  // ============================================

  async function getAllUsers() {
    try {
      const result = await apiRequest("/users");
      return result.success ? result.data : [];
    } catch (err) {
      console.error("Error fetching users:", err);
      return [];
    }
  }

  async function getUsersByRole(role) {
    try {
      const result = await apiRequest(`/users/role/${role}`);
      return result.success ? result.data : [];
    } catch (err) {
      console.error("Error fetching users by role:", err);
      return [];
    }
  }

  async function getUserById(id) {
    try {
      const result = await apiRequest(`/users/${id}`);
      return result.success ? result.data : null;
    } catch (err) {
      console.error("Error fetching user:", err);
      return null;
    }
  }

  async function getUserByEmail(email) {
    try {
      const result = await apiRequest(
        `/users?email=${encodeURIComponent(email)}`
      );
      if (result.success && result.data.length > 0) {
        return (
          result.data.find(
            (u) => u.email.toLowerCase() === email.toLowerCase()
          ) || null
        );
      }
      return null;
    } catch (err) {
      console.error("Error fetching user by email:", err);
      return null;
    }
  }

  async function registerStaff(userData) {
    try {
      const result = await apiRequest("/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      if (result.success) {
        broadcastEvent("STAFF_REGISTERED", result.data);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function updateUser(id, updates) {
    try {
      const result = await apiRequest(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      if (result.success) {
        broadcastEvent("USER_UPDATED", result.data);
      }

      return result.success ? result.data : null;
    } catch (err) {
      console.error("Error updating user:", err);
      return null;
    }
  }

  async function deleteUser(id) {
    try {
      const result = await apiRequest(`/users/${id}`, {
        method: "DELETE",
      });

      if (result.success) {
        broadcastEvent("USER_DELETED", { userId: id });
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function toggleUserStatus(id) {
    try {
      const result = await apiRequest(`/users/${id}/status`, {
        method: "PATCH",
      });

      if (result.success) {
        broadcastEvent("USER_STATUS_CHANGED", result.data);
      }

      return result.success ? result.data : null;
    } catch (err) {
      console.error("Error toggling user status:", err);
      return null;
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  async function getStats() {
    try {
      const result = await apiRequest("/users/stats");
      return result.success
        ? result.data
        : {
            total: 0,
            citizens: 0,
            officers: 0,
            technicians: 0,
            admins: 0,
            active: 0,
            inactive: 0,
            newThisWeek: 0,
          };
    } catch (err) {
      console.error("Error fetching stats:", err);
      return {
        total: 0,
        citizens: 0,
        officers: 0,
        technicians: 0,
        admins: 0,
        active: 0,
        inactive: 0,
        newThisWeek: 0,
      };
    }
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
  // COMPLAINT OPERATIONS
  // ============================================

  async function getAllComplaints(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.skip) params.append("skip", filters.skip);

      const queryString = params.toString();
      const result = await apiRequest(
        `/complaints${queryString ? "?" + queryString : ""}`
      );
      return result.success ? result.data : [];
    } catch (err) {
      console.error("Error fetching complaints:", err);
      return [];
    }
  }

  async function getComplaintsByEmail(email) {
    try {
      const result = await apiRequest(
        `/complaints/citizen/${encodeURIComponent(email)}`
      );
      return result.success ? result.data : [];
    } catch (err) {
      console.error("Error fetching citizen complaints:", err);
      return [];
    }
  }

  async function getComplaintById(id) {
    try {
      const result = await apiRequest(`/complaints/${id}`);
      return result.success ? result.data : null;
    } catch (err) {
      console.error("Error fetching complaint:", err);
      return null;
    }
  }

  async function getComplaintTimeline(id) {
    try {
      const result = await apiRequest(`/complaints/${id}/timeline`);
      return result.success ? result.data : [];
    } catch (err) {
      console.error("Error fetching timeline:", err);
      return [];
    }
  }

  async function getComplaintStats() {
    try {
      const result = await apiRequest("/complaints/stats");
      return result.success
        ? result.data
        : {
            total: 0,
            new: 0,
            acknowledged: 0,
            inProgress: 0,
            resolved: 0,
          };
    } catch (err) {
      console.error("Error fetching complaint stats:", err);
      return { total: 0, new: 0, acknowledged: 0, inProgress: 0, resolved: 0 };
    }
  }

  async function createComplaint(complaintData) {
    try {
      const result = await apiRequest("/complaints", {
        method: "POST",
        body: JSON.stringify(complaintData),
      });

      if (result.success) {
        // Broadcast multiple event types for compatibility
        broadcastEvent("COMPLAINT_CREATED", result.data);
        broadcastEvent("NEW_COMPLAINT", result.data);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function updateComplaintStatus(
    id,
    status,
    actor,
    actorRole,
    description
  ) {
    try {
      const result = await apiRequest(`/complaints/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, actor, actorRole, description }),
      });

      if (result.success) {
        // Broadcast multiple event types for compatibility
        broadcastEvent("COMPLAINT_STATUS_CHANGED", result.data);
        broadcastEvent("STATUS_CHANGED", {
          complaintId: id,
          newStatus: status,
          complaint: result.data,
        });
        broadcastEvent("COMPLAINT_UPDATED", result.data);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function assignComplaint(
    id,
    technicianId,
    technicianName,
    assignedBy,
    assignedByRole
  ) {
    try {
      const result = await apiRequest(`/complaints/${id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({
          technicianId,
          technicianName,
          assignedBy,
          assignedByRole,
        }),
      });

      if (result.success) {
        // Broadcast multiple event types for compatibility
        broadcastEvent("COMPLAINT_ASSIGNED", result.data);
        broadcastEvent("TASK_ASSIGNED", {
          complaintId: id,
          technician: {
            id: technicianId,
            name: technicianName,
          },
          complaint: result.data,
        });
        broadcastEvent("COMPLAINT_UPDATED", result.data);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function addProgressUpdate(id, notes, timeSpent, technician) {
    try {
      const result = await apiRequest(`/complaints/${id}/progress`, {
        method: "POST",
        body: JSON.stringify({ notes, timeSpent, technician }),
      });

      if (result.success) {
        broadcastEvent("COMPLAINT_PROGRESS_UPDATED", result.data);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function addTimelineEntry(id, entry) {
    try {
      const result = await apiRequest(`/complaints/${id}/timeline`, {
        method: "POST",
        body: JSON.stringify(entry),
      });

      if (result.success) {
        broadcastEvent("COMPLAINT_TIMELINE_UPDATED", result.data);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function getComplaintsByTechnician(technicianId) {
    try {
      const result = await apiRequest(`/complaints/technician/${technicianId}`);
      return result.success ? result.data : [];
    } catch (err) {
      console.error("Error fetching technician complaints:", err);
      return [];
    }
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

  // ============================================
  // ACTIVITY LOG (Local storage for now)
  // ============================================
  const ACTIVITY_LOG_KEY = "municipal_activity_log";

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
    logs.unshift(newLog);

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
        id: user.id || user._id,
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
        id: user.id || user._id,
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
        id: user.id || user._id || "system",
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
        id: targetUser.id || targetUser._id,
        name: targetUser.name,
      },
      user: {
        id: performedBy.id || performedBy._id || "admin",
        name: performedBy.name || "Administrator",
        initials: getInitials(performedBy.name || "AD"),
        role: performedBy.role || "admin",
      },
      status: "success",
      statusLabel: "Success",
      statusClass: "bg-success",
    });
  }

  function clearActivityLog() {
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify([]));
    broadcastEvent("ACTIVITY_CLEARED", null);
  }

  // ============================================
  // NOTIFICATIONS (Mongo-backed)
  // ============================================
  async function getNotifications(role = "officer") {
    try {
      return await apiRequest(`/notifications?role=${role}`, { method: "GET" });
    } catch (err) {
      console.error("Error fetching notifications:", err);
      return { success: false, error: err.message || "Failed to load notifications" };
    }
  }

  async function clearNotifications(role = "officer") {
    try {
      return await apiRequest(`/notifications/clear?role=${role}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error clearing notifications:", err);
      return { success: false, error: err.message || "Failed to clear notifications" };
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    init,
    // Authentication
    authenticateCitizen,
    authenticateOfficer,
    authenticateTechnician,
    authenticateAdmin,
    registerCitizen,
    logout,
    getCurrentUser,
    isLoggedIn,
    // User operations
    getAllUsers,
    getUsersByRole,
    getUserById,
    getUserByEmail,
    registerStaff,
    updateUser,
    deleteUser,
    toggleUserStatus,
    // User Statistics
    getStats,
    // Complaint operations
    getAllComplaints,
    getComplaintsByEmail,
    getComplaintById,
    getComplaintTimeline,
    getComplaintStats,
    createComplaint,
    updateComplaintStatus,
    assignComplaint,
    addProgressUpdate,
    addTimelineEntry,
    getComplaintsByTechnician,
    // Events
    subscribe,
    broadcastEvent,
    // Utilities
    getInitials,
    getRoleBadgeClass,
    formatDate,
    formatTimeAgo,
    capitalizeRole,
    // Activity log
    getActivityLog,
    addActivityLog,
    logUserRegistration,
    logUserLogin,
    logComplaintAction,
    logUserAction,
    clearActivityLog,
    // Notifications
    getNotifications,
    clearNotifications,
  };
})();

// Auto-initialize when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => ApiService.init());
} else {
  ApiService.init();
}
