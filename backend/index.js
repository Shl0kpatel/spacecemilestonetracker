const express = require("express");
const path = require("path");
const app = express();
const authRoutes = require("./routes/auth");
const parentRoutes = require("./routes/parents");
const volunteerRoutes = require("./routes/volunteers");
const milestoneRoutes = require("./routes/milestones");

// Enable CORS for frontend communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));