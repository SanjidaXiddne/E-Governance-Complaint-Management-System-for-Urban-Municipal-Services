/**
 * Real-Time Complaint Management Service
 * Handles data persistence, cross-tab synchronization, timeline management, and real-time updates
 */

const ComplaintService = (function () {
  // ============================================
  // CONFIGURATION
  // ============================================
  const STORAGE_KEY = "municipal_complaints";
  const STATS_KEY = "municipal_stats";
  const TIMELINE_KEY = "municipal_timelines";
  const EVENT_KEY = "complaint_event";
  const POLL_INTERVAL = 2000; // 2 seconds polling for real-time feel

  // ============================================
  // INITIAL SAMPLE DATA WITH TIMELINES
  // ============================================
  const INITIAL_COMPLAINTS = [
    {
      id: "CMPT-130",
      category: "Water",
      categoryLabel: "Water Leakage",
      description:
        "Major water pipe leakage causing road flooding near the main intersection.",
      location: "Gulshan-2, Dhaka",
      status: "new",
      priority: "normal",
      citizen: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+880 1700 000000",
        initials: "JD",
      },
      createdAt: new Date("2025-08-24T10:30:00").toISOString(),
      updatedAt: new Date("2025-08-24T10:30:00").toISOString(),
    },
    {
      id: "CMPT-131",
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
      createdAt: new Date("2025-08-24T09:15:00").toISOString(),
      updatedAt: new Date("2025-08-24T09:15:00").toISOString(),
    },
    {
      id: "CMPT-129",
      category: "Waste",
      categoryLabel: "Waste Management",
      description: "Garbage not collected for 3 days.",
      location: "Banani, Dhaka",
      status: "acknowledged",
      priority: "medium",
      citizen: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+880 1700 000000",
        initials: "JD",
      },
      createdAt: new Date("2025-08-22T14:20:00").toISOString(),
      updatedAt: new Date("2025-08-22T16:00:00").toISOString(),
    },
    {
      id: "CMPT-128",
      category: "Light",
      categoryLabel: "Street Lighting",
      description:
        "Multiple street lights not working on the road near the community center. Residents report safety concerns during evening hours.",
      location: "Uttara Sector-7, Dhaka",
      status: "in-progress",
      priority: "medium",
      citizen: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+880 1700 000000",
        initials: "JD",
      },
      assignedTo: {
        id: "TECH-003",
        name: "Fazlur Rahman",
      },
      workStartedAt: new Date("2025-08-21T10:00:00").toISOString(),
      progressUpdates: [
        {
          id: "PU-001",
          date: new Date("2025-08-21T10:30:00").toISOString(),
          notes:
            "Inspected all 5 street lights. Found 3 with burnt out bulbs and 2 with wiring issues.",
          timeSpent: 1.5,
          technician: "Fazlur Rahman",
        },
      ],
      totalTimeSpent: 1.5,
      createdAt: new Date("2025-08-20T11:00:00").toISOString(),
      updatedAt: new Date("2025-08-21T10:30:00").toISOString(),
    },
    {
      id: "CMPT-127",
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
      workStartedAt: new Date("2025-08-23T09:00:00").toISOString(),
      createdAt: new Date("2025-08-22T16:00:00").toISOString(),
      updatedAt: new Date("2025-08-23T09:00:00").toISOString(),
    },
    {
      id: "CMPT-125",
      category: "Road",
      categoryLabel: "Pothole",
      description: "Small pothole near school entrance.",
      location: "Mirpur-10, Dhaka",
      status: "resolved",
      priority: "low",
      citizen: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+880 1700 000000",
        initials: "JD",
      },
      resolvedAt: new Date("2025-08-18T15:00:00").toISOString(),
      createdAt: new Date("2025-08-15T10:00:00").toISOString(),
      updatedAt: new Date("2025-08-18T15:00:00").toISOString(),
    },
  ];

  // Initial timeline entries for sample complaints
  const INITIAL_TIMELINES = {
    "CMPT-130": [
      {
        id: "TL-001",
        timestamp: new Date("2025-08-24T10:30:00").toISOString(),
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "John Doe",
        actorRole: "citizen",
      },
    ],
    "CMPT-131": [
      {
        id: "TL-002",
        timestamp: new Date("2025-08-24T09:15:00").toISOString(),
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "Maria Santos",
        actorRole: "citizen",
      },
    ],
    "CMPT-129": [
      {
        id: "TL-003",
        timestamp: new Date("2025-08-22T14:20:00").toISOString(),
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "John Doe",
        actorRole: "citizen",
      },
      {
        id: "TL-004",
        timestamp: new Date("2025-08-22T16:00:00").toISOString(),
        type: "acknowledged",
        title: "Complaint Acknowledged",
        description: "Reviewed by municipal officer",
        actor: "Officer Jane",
        actorRole: "officer",
      },
    ],
    "CMPT-128": [
      {
        id: "TL-005",
        timestamp: new Date("2025-08-20T11:00:00").toISOString(),
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "John Doe",
        actorRole: "citizen",
      },
      {
        id: "TL-006",
        timestamp: new Date("2025-08-20T14:00:00").toISOString(),
        type: "acknowledged",
        title: "Complaint Acknowledged",
        description: "Reviewed by municipal officer",
        actor: "Officer Jane",
        actorRole: "officer",
      },
      {
        id: "TL-007",
        timestamp: new Date("2025-08-21T09:30:00").toISOString(),
        type: "assigned",
        title: "Assigned to Technician",
        description:
          "Assigned to Fazlur Rahman (TECH-003) - Electrical Specialist",
        actor: "Officer Jane",
        actorRole: "officer",
      },
      {
        id: "TL-008",
        timestamp: new Date("2025-08-21T10:00:00").toISOString(),
        type: "in-progress",
        title: "Work Started",
        description: "Fazlur Rahman has started working on this issue.",
        actor: "Fazlur Rahman",
        actorRole: "technician",
      },
      {
        id: "TL-009",
        timestamp: new Date("2025-08-21T10:30:00").toISOString(),
        type: "progress",
        title: "Progress Update",
        description:
          "Inspected all 5 street lights. Found 3 with burnt out bulbs and 2 with wiring issues. (1.5 hours spent)",
        actor: "Fazlur Rahman",
        actorRole: "technician",
      },
    ],
    "CMPT-127": [
      {
        id: "TL-020",
        timestamp: new Date("2025-08-22T16:00:00").toISOString(),
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "Sarah Khan",
        actorRole: "citizen",
      },
      {
        id: "TL-021",
        timestamp: new Date("2025-08-22T17:30:00").toISOString(),
        type: "acknowledged",
        title: "Complaint Acknowledged",
        description: "Reviewed and marked as high priority",
        actor: "Officer Jane",
        actorRole: "officer",
      },
      {
        id: "TL-022",
        timestamp: new Date("2025-08-23T08:00:00").toISOString(),
        type: "assigned",
        title: "Assigned to Technician",
        description:
          "Assigned to Fazlur Rahman (TECH-003) - Plumbing Specialist",
        actor: "Officer Jane",
        actorRole: "officer",
      },
      {
        id: "TL-023",
        timestamp: new Date("2025-08-23T09:00:00").toISOString(),
        type: "in-progress",
        title: "Work Started",
        description: "Fazlur Rahman has started working on this issue.",
        actor: "Fazlur Rahman",
        actorRole: "technician",
      },
    ],
    "CMPT-125": [
      {
        id: "TL-030",
        timestamp: new Date("2025-08-15T10:00:00").toISOString(),
        type: "submitted",
        title: "Complaint Submitted",
        description: "Received from Citizen Portal",
        actor: "John Doe",
        actorRole: "citizen",
      },
      {
        id: "TL-031",
        timestamp: new Date("2025-08-15T14:00:00").toISOString(),
        type: "acknowledged",
        title: "Complaint Acknowledged",
        description: "Reviewed by municipal officer",
        actor: "Officer Jane",
        actorRole: "officer",
      },
      {
        id: "TL-032",
        timestamp: new Date("2025-08-16T10:00:00").toISOString(),
        type: "assigned",
        title: "Assigned to Technician",
        description: "Assigned to Mohammad Rafiq (TECH-001)",
        actor: "Officer Jane",
        actorRole: "officer",
      },
      {
        id: "TL-033",
        timestamp: new Date("2025-08-18T15:00:00").toISOString(),
        type: "resolved",
        title: "Complaint Resolved",
        description: "Issue has been fixed successfully",
        actor: "Mohammad Rafiq",
        actorRole: "technician",
      },
    ],
  };

  // ============================================
  // INTERNAL STATE
  // ============================================
  let listeners = [];
  let pollTimer = null;
  let lastEventTimestamp = Date.now();

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Initialize storage with sample data if empty
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
      localStorage.setItem(TIMELINE_KEY, JSON.stringify(INITIAL_TIMELINES));
      updateStats();
    }

    // Initialize timelines if not exists
    if (!localStorage.getItem(TIMELINE_KEY)) {
      localStorage.setItem(TIMELINE_KEY, JSON.stringify(INITIAL_TIMELINES));
    }

    // Listen for storage events (cross-tab sync)
    window.addEventListener("storage", handleStorageEvent);

    // Start polling for real-time updates
    startPolling();

    console.log("ComplaintService initialized with timeline support");
  }

  // ============================================
  // DATA OPERATIONS
  // ============================================

  // Get all complaints
  function getAllComplaints() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading complaints:", e);
      return [];
    }
  }

  // Get complaints by status
  function getComplaintsByStatus(status) {
    return getAllComplaints().filter((c) => c.status === status);
  }

  // Get complaints for citizen
  function getComplaintsForCitizen(email) {
    return getAllComplaints().filter((c) => c.citizen.email === email);
  }

  // Get a single complaint by ID
  function getComplaintById(id) {
    return getAllComplaints().find((c) => c.id === id);
  }

  // Generate new complaint ID
  function generateComplaintId() {
    const complaints = getAllComplaints();
    const maxId = complaints.reduce((max, c) => {
      const num = parseInt(c.id.replace("CMPT-", ""));
      return num > max ? num : max;
    }, 130);
    return `CMPT-${maxId + 1}`;
  }

  // Generate timeline entry ID
  function generateTimelineId() {
    return "TL-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  }

  // Add new complaint
  function addComplaint(complaintData) {
    const complaints = getAllComplaints();
    const newId = generateComplaintId();

    const newComplaint = {
      id: newId,
      category: complaintData.category,
      categoryLabel: getCategoryLabel(complaintData.category),
      description: complaintData.description,
      location: complaintData.location,
      status: "new",
      priority: complaintData.priority || "normal",
      citizen: {
        name:
          complaintData.citizenName ||
          sessionStorage.getItem("userName") ||
          "Anonymous",
        email:
          complaintData.citizenEmail ||
          sessionStorage.getItem("userEmail") ||
          "user@example.com",
        phone: complaintData.citizenPhone || "+880 1700 000000",
        initials: getInitials(
          complaintData.citizenName ||
            sessionStorage.getItem("userName") ||
            "AN"
        ),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    complaints.unshift(newComplaint);
    saveComplaints(complaints);

    // Create initial timeline entry
    addTimelineEntry(newId, {
      type: "submitted",
      title: "Complaint Submitted",
      description: "Received from Citizen Portal",
      actor: newComplaint.citizen.name,
      actorRole: "citizen",
    });

    // Broadcast event
    broadcastEvent("NEW_COMPLAINT", newComplaint);

    // Update stats
    updateStats();

    return newComplaint;
  }

  // Update complaint status
  function updateComplaintStatus(id, newStatus, details = {}) {
    const complaints = getAllComplaints();
    const index = complaints.findIndex((c) => c.id === id);

    if (index !== -1) {
      const oldStatus = complaints[index].status;
      complaints[index].status = newStatus;
      complaints[index].updatedAt = new Date().toISOString();

      // Add additional fields based on status
      if (newStatus === "in-progress" && details.assignedTo) {
        complaints[index].assignedTo = details.assignedTo;
      }
      if (newStatus === "resolved") {
        complaints[index].resolvedAt = new Date().toISOString();
      }

      saveComplaints(complaints);

      // Create timeline entry for status change
      const statusTitles = {
        acknowledged: "Complaint Acknowledged",
        "in-progress": "Work In Progress",
        resolved: "Complaint Resolved",
        rejected: "Complaint Rejected",
      };

      const timelineEntry = {
        type: newStatus,
        title: statusTitles[newStatus] || "Status Updated",
        description:
          details.description ||
          `Status changed from ${oldStatus} to ${newStatus}`,
        actor: details.actor || sessionStorage.getItem("userName") || "System",
        actorRole:
          details.actorRole || sessionStorage.getItem("userRole") || "system",
      };

      addTimelineEntry(id, timelineEntry);

      // Broadcast status change event
      broadcastEvent("STATUS_CHANGED", {
        complaintId: id,
        oldStatus: oldStatus,
        newStatus: newStatus,
        complaint: complaints[index],
        timelineEntry: timelineEntry,
      });

      updateStats();
      return complaints[index];
    }
    return null;
  }

  // Update complaint
  function updateComplaint(id, updates) {
    const complaints = getAllComplaints();
    const index = complaints.findIndex((c) => c.id === id);

    if (index !== -1) {
      const oldStatus = complaints[index].status;
      complaints[index] = {
        ...complaints[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveComplaints(complaints);

      // If status changed, add timeline entry
      if (updates.status && updates.status !== oldStatus) {
        broadcastEvent("STATUS_CHANGED", {
          complaintId: id,
          oldStatus: oldStatus,
          newStatus: updates.status,
          complaint: complaints[index],
        });
      } else {
        broadcastEvent("COMPLAINT_UPDATED", complaints[index]);
      }

      updateStats();
      return complaints[index];
    }
    return null;
  }

  // Save complaints to storage
  function saveComplaints(complaints) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    lastEventTimestamp = Date.now();
  }

  // ============================================
  // TIMELINE OPERATIONS
  // ============================================

  // Get all timelines
  function getAllTimelines() {
    try {
      const data = localStorage.getItem(TIMELINE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Error reading timelines:", e);
      return {};
    }
  }

  // Get timeline for a specific complaint
  function getTimeline(complaintId) {
    const timelines = getAllTimelines();
    return timelines[complaintId] || [];
  }

  // Add timeline entry
  function addTimelineEntry(complaintId, entry) {
    const timelines = getAllTimelines();

    if (!timelines[complaintId]) {
      timelines[complaintId] = [];
    }

    const newEntry = {
      id: generateTimelineId(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    timelines[complaintId].unshift(newEntry); // Add to beginning (newest first)
    saveTimelines(timelines);

    // Broadcast timeline update
    broadcastEvent("TIMELINE_UPDATED", {
      complaintId: complaintId,
      entry: newEntry,
      timeline: timelines[complaintId],
    });

    return newEntry;
  }

  // Save timelines to storage
  function saveTimelines(timelines) {
    localStorage.setItem(TIMELINE_KEY, JSON.stringify(timelines));
    lastEventTimestamp = Date.now();
  }

  // Get timeline entry type config
  function getTimelineTypeConfig(type) {
    const configs = {
      submitted: {
        icon: "fa-paper-plane",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
      acknowledged: {
        icon: "fa-check-circle",
        color: "#06b6d4",
        bgColor: "rgba(6, 182, 212, 0.1)",
      },
      assigned: {
        icon: "fa-user-plus",
        color: "#8b5cf6",
        bgColor: "rgba(139, 92, 246, 0.1)",
      },
      "in-progress": {
        icon: "fa-spinner",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
      },
      progress: {
        icon: "fa-tools",
        color: "#f97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
      },
      resolved: {
        icon: "fa-check-double",
        color: "#10b981",
        bgColor: "rgba(16, 185, 129, 0.1)",
      },
      rejected: {
        icon: "fa-times-circle",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      },
      comment: {
        icon: "fa-comment",
        color: "#6b7280",
        bgColor: "rgba(107, 114, 128, 0.1)",
      },
      update: {
        icon: "fa-edit",
        color: "#6366f1",
        bgColor: "rgba(99, 102, 241, 0.1)",
      },
    };
    return configs[type] || configs["update"];
  }

  // ============================================
  // STATISTICS
  // ============================================

  function getStats() {
    const complaints = getAllComplaints();

    return {
      total: complaints.length,
      new: complaints.filter((c) => c.status === "new").length,
      acknowledged: complaints.filter((c) => c.status === "acknowledged")
        .length,
      inProgress: complaints.filter((c) => c.status === "in-progress").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
      rejected: complaints.filter((c) => c.status === "rejected").length,
      byCategory: {
        road: complaints.filter((c) => c.category === "Road").length,
        water: complaints.filter((c) => c.category === "Water").length,
        waste: complaints.filter((c) => c.category === "Waste").length,
        light: complaints.filter((c) => c.category === "Light").length,
      },
      byPriority: {
        high: complaints.filter((c) => c.priority === "high").length,
        medium: complaints.filter((c) => c.priority === "medium").length,
        normal: complaints.filter((c) => c.priority === "normal").length,
        low: complaints.filter((c) => c.priority === "low").length,
      },
    };
  }

  function updateStats() {
    const stats = getStats();
    localStorage.setItem(
      STATS_KEY,
      JSON.stringify({
        ...stats,
        lastUpdated: Date.now(),
      })
    );
  }

  // ============================================
  // REAL-TIME SYNC
  // ============================================

  // Broadcast event to other tabs/windows
  function broadcastEvent(type, data) {
    const event = {
      type: type,
      data: data,
      timestamp: Date.now(),
    };

    localStorage.setItem(EVENT_KEY, JSON.stringify(event));

    // Also trigger local listeners
    notifyListeners(type, data);
  }

  // Handle storage events from other tabs
  function handleStorageEvent(e) {
    if (e.key === EVENT_KEY && e.newValue) {
      try {
        const event = JSON.parse(e.newValue);
        if (event.timestamp > lastEventTimestamp) {
          lastEventTimestamp = event.timestamp;
          notifyListeners(event.type, event.data);
        }
      } catch (err) {
        console.error("Error parsing storage event:", err);
      }
    }
  }

  // Subscribe to events
  function subscribe(callback) {
    listeners.push(callback);
    return function unsubscribe() {
      listeners = listeners.filter((l) => l !== callback);
    };
  }

  // Notify all listeners
  function notifyListeners(type, data) {
    listeners.forEach((callback) => {
      try {
        callback(type, data);
      } catch (err) {
        console.error("Error in listener:", err);
      }
    });
  }

  // Polling for real-time feel
  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);

    pollTimer = setInterval(() => {
      const storedTimestamp = localStorage.getItem(STATS_KEY);
      if (storedTimestamp) {
        try {
          const stats = JSON.parse(storedTimestamp);
          if (stats.lastUpdated > lastEventTimestamp) {
            lastEventTimestamp = stats.lastUpdated;
            notifyListeners("STATS_UPDATED", getStats());
          }
        } catch (e) {}
      }
    }, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function getCategoryLabel(category) {
    const labels = {
      Road: "Pothole",
      Water: "Water Leakage",
      Waste: "Waste Management",
      Light: "Street Lighting",
    };
    return labels[category] || category;
  }

  function getInitials(name) {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  function formatDateTime(isoString) {
    const date = new Date(isoString);
    const options = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
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

  function getStatusBadgeClass(status) {
    const classes = {
      new: "bg-danger",
      acknowledged: "bg-info",
      "in-progress": "bg-warning text-dark",
      resolved: "bg-success",
      rejected: "bg-secondary",
    };
    return classes[status] || "bg-secondary";
  }

  function getStatusLabel(status) {
    const labels = {
      new: "New",
      acknowledged: "Acknowledged",
      "in-progress": "In Progress",
      resolved: "Resolved",
      rejected: "Rejected",
    };
    return labels[status] || status;
  }

  function getCategoryBadgeClass(category) {
    const classes = {
      Road: "badge-road",
      Water: "badge-water",
      Waste: "badge bg-light text-dark border",
      Light: "badge bg-warning text-dark",
    };
    return classes[category] || "badge bg-secondary";
  }

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================

  function showNotification(message, type = "info") {
    // Remove existing notifications
    const existing = document.querySelector(".realtime-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.className = `realtime-notification alert alert-${
      type === "error" ? "danger" : type
    } alert-dismissible fade show`;
    notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            min-width: 320px;
            max-width: 450px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: slideInRight 0.4s ease;
            border-left: 4px solid ${
              type === "success"
                ? "#10b981"
                : type === "warning"
                ? "#f59e0b"
                : "#3b82f6"
            };
        `;

    const icons = {
      success: "check-circle",
      warning: "exclamation-triangle",
      danger: "times-circle",
      info: "bell",
    };

    notification.innerHTML = `
            <div class="d-flex align-items-start">
                <i class="fas fa-${
                  icons[type] || "bell"
                } me-3 mt-1" style="font-size: 1.25rem;"></i>
                <div class="flex-grow-1">
                    <div class="fw-bold mb-1">${
                      type === "success"
                        ? "Success!"
                        : type === "warning"
                        ? "Status Update"
                        : "Notification"
                    }</div>
                    <div class="small">${message}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

    // Add animation styles
    if (!document.getElementById("notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .notification-pulse {
                    animation: pulse 0.3s ease;
                }
                @keyframes timelineSlideIn {
                    from { transform: translateX(-20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .timeline-new-entry {
                    animation: timelineSlideIn 0.5s ease;
                }
            `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.style.animation = "slideInRight 0.3s ease reverse";
        setTimeout(() => notification.remove(), 300);
      }
    }, 6000);
  }

  // ============================================
  // TIMELINE RENDERING HELPER
  // ============================================

  function renderTimelineHTML(complaintId, containerId) {
    const timeline = getTimeline(complaintId);
    const container = document.getElementById(containerId);

    if (!container) return;

    if (timeline.length === 0) {
      container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-clock fa-2x mb-2"></i>
                    <p class="mb-0">No timeline entries yet</p>
                </div>
            `;
      return;
    }

    container.innerHTML = timeline
      .map((entry, index) => {
        const config = getTimelineTypeConfig(entry.type);
        const isFirst = index === 0;

        return `
                <div class="timeline-item ${entry.type} ${
          isFirst ? "timeline-new-entry" : ""
        }" data-entry-id="${entry.id}">
                    <div class="timeline-marker" style="background: ${
                      config.color
                    };">
                        <i class="fas ${
                          config.icon
                        }" style="color: white; font-size: 10px;"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-date">${formatDateTime(
                          entry.timestamp
                        )}</div>
                        <div class="fw-medium">${entry.title}</div>
                        <div class="small text-muted">${entry.description}</div>
                        ${
                          entry.actor
                            ? `<div class="small text-muted mt-1"><i class="fas fa-user me-1"></i>${entry.actor}</div>`
                            : ""
                        }
                    </div>
                </div>
            `;
      })
      .join("");
  }

  // ============================================
  // TECHNICIAN OPERATIONS
  // ============================================

  // Get tasks assigned to a specific technician
  function getTasksForTechnician(technicianId) {
    return getAllComplaints().filter(
      (c) => c.assignedTo && c.assignedTo.id === technicianId
    );
  }

  // Get active (in-progress) tasks for technician
  function getActiveTasksForTechnician(technicianId) {
    return getAllComplaints().filter(
      (c) =>
        c.assignedTo &&
        c.assignedTo.id === technicianId &&
        c.status === "in-progress"
    );
  }

  // Get completed tasks for technician
  function getCompletedTasksForTechnician(technicianId) {
    return getAllComplaints().filter(
      (c) =>
        c.assignedTo &&
        c.assignedTo.id === technicianId &&
        c.status === "resolved"
    );
  }

  // Get pending assignment tasks for technician
  function getPendingTasksForTechnician(technicianId) {
    return getAllComplaints().filter(
      (c) =>
        c.assignedTo &&
        c.assignedTo.id === technicianId &&
        (c.status === "acknowledged" || !c.workStartedAt)
    );
  }

  // Get all progress updates for a complaint
  function getProgressUpdates(complaintId) {
    const timelines = getAllTimelines();
    const timeline = timelines[complaintId] || [];
    return timeline.filter(
      (t) => t.type === "progress" || t.type === "in-progress"
    );
  }

  // Add progress update from technician
  function addProgressUpdate(complaintId, update) {
    const complaints = getAllComplaints();
    const index = complaints.findIndex((c) => c.id === complaintId);

    if (index !== -1) {
      const now = new Date().toISOString();
      const technicianName =
        update.technician || sessionStorage.getItem("userName") || "Technician";

      // Initialize progress updates array if not exists
      if (!complaints[index].progressUpdates) {
        complaints[index].progressUpdates = [];
      }

      const progressEntry = {
        id: "PU-" + Date.now(),
        date: now,
        notes: update.notes,
        timeSpent: update.timeSpent || 0,
        photos: update.photos || [],
        technician: technicianName,
      };

      complaints[index].progressUpdates.push(progressEntry);
      complaints[index].updatedAt = now;

      // Calculate total time spent
      const totalTime = complaints[index].progressUpdates.reduce(
        (sum, pu) => sum + (parseFloat(pu.timeSpent) || 0),
        0
      );
      complaints[index].totalTimeSpent = totalTime;

      saveComplaints(complaints);

      // Add timeline entry for the progress update
      const timelineEntry = addTimelineEntry(complaintId, {
        type: "progress",
        title: "Progress Update",
        description:
          update.notes +
          (update.timeSpent ? ` (${update.timeSpent} hours spent)` : ""),
        actor: technicianName,
        actorRole: "technician",
        photos: update.photos || [],
      });

      broadcastEvent("PROGRESS_UPDATE", {
        complaintId: complaintId,
        progress: progressEntry,
        complaint: complaints[index],
        timeline: timelineEntry,
      });

      return {
        complaint: complaints[index],
        progress: progressEntry,
        timeline: timelineEntry,
      };
    }
    return null;
  }

  // Start working on a task
  function startTask(complaintId, technicianName) {
    const complaints = getAllComplaints();
    const index = complaints.findIndex((c) => c.id === complaintId);

    if (index !== -1) {
      const now = new Date().toISOString();
      const tech =
        technicianName || sessionStorage.getItem("userName") || "Technician";

      complaints[index].workStartedAt = now;
      complaints[index].status = "in-progress";
      complaints[index].updatedAt = now;

      saveComplaints(complaints);

      // Add timeline entry
      const timelineEntry = addTimelineEntry(complaintId, {
        type: "in-progress",
        title: "Work Started",
        description: `${tech} has started working on this issue.`,
        actor: tech,
        actorRole: "technician",
      });

      broadcastEvent("TASK_STARTED", {
        complaintId: complaintId,
        complaint: complaints[index],
        timeline: timelineEntry,
      });

      updateStats();
      return { complaint: complaints[index], timeline: timelineEntry };
    }
    return null;
  }

  // Mark task as completed by technician
  function markTaskCompleted(complaintId, completionData) {
    const complaints = getAllComplaints();
    const index = complaints.findIndex((c) => c.id === complaintId);

    if (index !== -1) {
      const now = new Date().toISOString();
      const technicianName =
        completionData.technician ||
        sessionStorage.getItem("userName") ||
        "Technician";

      // Add final progress entry if notes provided
      if (completionData.notes) {
        if (!complaints[index].progressUpdates) {
          complaints[index].progressUpdates = [];
        }
        complaints[index].progressUpdates.push({
          id: "PU-" + Date.now(),
          date: now,
          notes: completionData.notes,
          timeSpent: completionData.timeSpent || 0,
          photos: completionData.photos || [],
          technician: technicianName,
          isCompletion: true,
        });
      }

      // Calculate total time spent
      let totalTime = 0;
      if (complaints[index].progressUpdates) {
        totalTime = complaints[index].progressUpdates.reduce(
          (sum, pu) => sum + (parseFloat(pu.timeSpent) || 0),
          0
        );
      }
      complaints[index].totalTimeSpent = totalTime;

      // Update status
      complaints[index].status = "resolved";
      complaints[index].resolvedAt = now;
      complaints[index].updatedAt = now;
      complaints[index].resolvedBy = technicianName;

      saveComplaints(complaints);

      // Add completion timeline entry
      const timelineEntry = addTimelineEntry(complaintId, {
        type: "resolved",
        title: "Task Completed",
        description: `Work completed by ${technicianName}. ${
          completionData.notes || "Issue has been resolved successfully."
        }${totalTime > 0 ? ` Total time spent: ${totalTime} hours.` : ""}`,
        actor: technicianName,
        actorRole: "technician",
        photos: completionData.photos || [],
      });

      // Broadcast task completed event - this updates all dashboards instantly
      broadcastEvent("TASK_COMPLETED", {
        complaintId: complaintId,
        complaint: complaints[index],
        timeline: timelineEntry,
        totalTimeSpent: totalTime,
      });

      broadcastEvent("STATUS_CHANGED", {
        complaintId: complaintId,
        oldStatus: "in-progress",
        newStatus: "resolved",
        complaint: complaints[index],
        timelineEntry: timelineEntry,
      });

      updateStats();
      return { complaint: complaints[index], timeline: timelineEntry };
    }
    return null;
  }

  // Get technician stats
  function getTechnicianStats(technicianId) {
    const tasks = getTasksForTechnician(technicianId);
    const active = tasks.filter((t) => t.status === "in-progress");
    const completed = tasks.filter((t) => t.status === "resolved");
    const totalTime = tasks.reduce(
      (sum, t) => sum + (t.totalTimeSpent || 0),
      0
    );

    return {
      totalTasks: tasks.length,
      activeTasks: active.length,
      completedTasks: completed.length,
      totalTimeSpent: totalTime,
      averageTime:
        completed.length > 0 ? (totalTime / completed.length).toFixed(1) : 0,
    };
  }

  // Assign task to technician - dedicated function for dynamic assignment
  function assignTaskToTechnician(complaintId, technician, assignedBy) {
    const complaints = getAllComplaints();
    const index = complaints.findIndex((c) => c.id === complaintId);

    if (index !== -1) {
      const now = new Date().toISOString();
      const oldStatus = complaints[index].status;
      const officerName =
        assignedBy || sessionStorage.getItem("userName") || "Officer";

      // Update complaint with technician assignment
      complaints[index].assignedTo = {
        id: technician.id,
        name: technician.name,
        phone: technician.phone || "",
        specialty: technician.specialty || "",
      };
      complaints[index].status = "in-progress";
      complaints[index].assignedAt = now;
      complaints[index].updatedAt = now;

      saveComplaints(complaints);

      // Add assignment timeline entry
      const timelineEntry = addTimelineEntry(complaintId, {
        type: "assigned",
        title: "Task Assigned to Technician",
        description: `Assigned to ${technician.name} (${technician.id})${
          technician.specialty ? " - " + technician.specialty : ""
        }`,
        actor: officerName,
        actorRole: "officer",
      });

      // Broadcast TASK_ASSIGNED event - this will notify the technician dashboard
      broadcastEvent("TASK_ASSIGNED", {
        complaintId: complaintId,
        complaint: complaints[index],
        technician: complaints[index].assignedTo,
        assignedBy: officerName,
        timeline: timelineEntry,
      });

      // Also broadcast status change for other dashboards
      broadcastEvent("STATUS_CHANGED", {
        complaintId: complaintId,
        oldStatus: oldStatus,
        newStatus: "in-progress",
        complaint: complaints[index],
        assignedTo: complaints[index].assignedTo,
      });

      updateStats();

      return {
        complaint: complaints[index],
        timeline: timelineEntry,
      };
    }
    return null;
  }

  // Reassign task to different technician
  function reassignTask(complaintId, newTechnician, reassignedBy) {
    const complaints = getAllComplaints();
    const index = complaints.findIndex((c) => c.id === complaintId);

    if (index !== -1) {
      const now = new Date().toISOString();
      const oldTechnician = complaints[index].assignedTo;
      const officerName =
        reassignedBy || sessionStorage.getItem("userName") || "Officer";

      // Update with new technician
      complaints[index].assignedTo = {
        id: newTechnician.id,
        name: newTechnician.name,
        phone: newTechnician.phone || "",
        specialty: newTechnician.specialty || "",
      };
      complaints[index].reassignedAt = now;
      complaints[index].updatedAt = now;

      saveComplaints(complaints);

      // Add reassignment timeline entry
      const timelineEntry = addTimelineEntry(complaintId, {
        type: "assigned",
        title: "Task Reassigned",
        description: `Reassigned from ${
          oldTechnician?.name || "Unassigned"
        } to ${newTechnician.name} (${newTechnician.id})`,
        actor: officerName,
        actorRole: "officer",
      });

      // Broadcast reassignment event - notifies both old and new technician
      broadcastEvent("TASK_REASSIGNED", {
        complaintId: complaintId,
        complaint: complaints[index],
        oldTechnician: oldTechnician,
        newTechnician: complaints[index].assignedTo,
        reassignedBy: officerName,
        timeline: timelineEntry,
      });

      updateStats();

      return {
        complaint: complaints[index],
        timeline: timelineEntry,
      };
    }
    return null;
  }

  // ============================================
  // RESET FOR TESTING
  // ============================================

  function resetToInitial() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
    localStorage.setItem(TIMELINE_KEY, JSON.stringify(INITIAL_TIMELINES));
    updateStats();
    broadcastEvent("DATA_RESET", null);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    init,
    getAllComplaints,
    getComplaintsByStatus,
    getComplaintsForCitizen,
    getComplaintById,
    addComplaint,
    updateComplaint,
    updateComplaintStatus,
    getStats,
    // Timeline methods
    getTimeline,
    addTimelineEntry,
    getTimelineTypeConfig,
    renderTimelineHTML,
    // Technician methods
    getTasksForTechnician,
    getActiveTasksForTechnician,
    getCompletedTasksForTechnician,
    getPendingTasksForTechnician,
    getProgressUpdates,
    addProgressUpdate,
    startTask,
    markTaskCompleted,
    getTechnicianStats,
    assignTaskToTechnician,
    reassignTask,
    // Event methods
    subscribe,
    broadcastEvent,
    // Utility methods
    showNotification,
    formatDate,
    formatDateTime,
    formatTimeAgo,
    getStatusBadgeClass,
    getStatusLabel,
    getCategoryBadgeClass,
    getCategoryLabel,
    getInitials,
    resetToInitial,
    stopPolling,
  };
})();

// Auto-initialize when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => ComplaintService.init());
} else {
  ComplaintService.init();
}
