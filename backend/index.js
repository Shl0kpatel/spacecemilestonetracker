// Load environment variables
require('dotenv').config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const authRoutes = require("./routes/auth");
const parentRoutes = require("./routes/parents");
const volunteerRoutes = require("./routes/volunteers");
const milestoneRoutes = require("./routes/milestones");

// Enable CORS for frontend communication
app.use(cors());

app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/milestones", milestoneRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  
  res.status(500).json({
    error: err.message || 'Internal server error',
    details: err.toString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));