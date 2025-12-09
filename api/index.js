/**
 * Vercel Serverless Function Entry Point
 * This file wraps the Express app for Vercel serverless functions
 */

const handler = require("../server/index.js");

module.exports = handler;

