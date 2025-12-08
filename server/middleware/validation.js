/**
 * Validation Middleware
 * Input validation and sanitization for API requests
 */

/**
 * Sanitize string input by removing potentially harmful characters
 * @param {String} str - Input string to sanitize
 * @returns {String} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;

  return str
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/\$/g, "") // Remove MongoDB operator prefix
    .replace(/\{|\}/g, ""); // Remove curly braces
};

/**
 * Recursively sanitize an object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip keys that start with $ (MongoDB operators)
      if (!key.startsWith("$")) {
        sanitized[sanitizeString(key)] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Validate citizen data for manual-add endpoint
 * @param {Object} data - Request body data
 * @returns {Object} { isValid: boolean, errors: string[], sanitizedData: Object }
 */
const validateCitizenData = (data) => {
  const errors = [];
  const sanitizedData = {};

  // Validate and sanitize username (required)
  if (!data.username) {
    errors.push("Username is required");
  } else if (typeof data.username !== "string") {
    errors.push("Username must be a string");
  } else {
    const username = sanitizeString(data.username);
    if (username.length < 3) {
      errors.push("Username must be at least 3 characters long");
    } else if (username.length > 50) {
      errors.push("Username cannot exceed 50 characters");
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
    } else {
      sanitizedData.username = username;
    }
  }

  // Validate and sanitize name (required)
  if (!data.name) {
    errors.push("Name is required");
  } else if (typeof data.name !== "string") {
    errors.push("Name must be a string");
  } else {
    const name = sanitizeString(data.name);
    if (name.length < 2) {
      errors.push("Name must be at least 2 characters long");
    } else if (name.length > 100) {
      errors.push("Name cannot exceed 100 characters");
    } else {
      sanitizedData.name = name;
    }
  }

  // Validate and sanitize email (optional)
  if (data.email !== undefined && data.email !== null && data.email !== "") {
    if (typeof data.email !== "string") {
      errors.push("Email must be a string");
    } else {
      const email = sanitizeString(data.email).toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push("Please provide a valid email address");
      } else {
        sanitizedData.email = email;
      }
    }
  }

  // Validate and sanitize phone (optional)
  if (data.phone !== undefined && data.phone !== null && data.phone !== "") {
    if (typeof data.phone !== "string") {
      errors.push("Phone must be a string");
    } else {
      const phone = sanitizeString(data.phone);
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/;
      if (!phoneRegex.test(phone)) {
        errors.push("Please provide a valid phone number");
      } else if (phone.length > 20) {
        errors.push("Phone number cannot exceed 20 characters");
      } else {
        sanitizedData.phone = phone;
      }
    }
  }

  // Validate and sanitize address (optional)
  if (
    data.address !== undefined &&
    data.address !== null &&
    data.address !== ""
  ) {
    if (typeof data.address !== "string") {
      errors.push("Address must be a string");
    } else {
      const address = sanitizeString(data.address);
      if (address.length > 500) {
        errors.push("Address cannot exceed 500 characters");
      } else {
        sanitizedData.address = address;
      }
    }
  }

  // Validate and sanitize createdBy (optional)
  if (
    data.createdBy !== undefined &&
    data.createdBy !== null &&
    data.createdBy !== ""
  ) {
    if (typeof data.createdBy !== "string") {
      errors.push("createdBy must be a string");
    } else {
      sanitizedData.createdBy = sanitizeString(data.createdBy);
    }
  }

  // Validate and sanitize metadata (optional)
  if (data.metadata !== undefined && data.metadata !== null) {
    if (typeof data.metadata !== "object" || Array.isArray(data.metadata)) {
      errors.push("Metadata must be an object");
    } else {
      sanitizedData.metadata = sanitizeObject(data.metadata);
    }
  }

  // Validate status (optional)
  if (data.status !== undefined && data.status !== null && data.status !== "") {
    const validStatuses = ["active", "inactive", "pending"];
    if (!validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
    } else {
      sanitizedData.status = data.status;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
};

/**
 * Express middleware for validating citizen data
 */
const validateCitizenMiddleware = (req, res, next) => {
  const validation = validateCitizenData(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      error: "Validation failed",
      details: validation.errors,
    });
  }

  // Replace request body with sanitized data
  req.body = validation.sanitizedData;
  next();
};

/**
 * Express middleware for sanitizing request body
 */
const sanitizeBodyMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  validateCitizenData,
  validateCitizenMiddleware,
  sanitizeBodyMiddleware,
};
