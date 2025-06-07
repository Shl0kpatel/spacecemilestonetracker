const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Helper function to load JSON
function loadJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, `../data/${file}`)));
}

// Parent login (basic version)
router.post("/login", (req, res) => {
  const { phone, password } = req.body;
  const users = loadJSON("users.json");
  const user = users.find(u => u.phone === phone && u.password === password && u.role === "parent");

  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Get milestones for a child
router.get("/milestones/:childId", (req, res) => {
  const children = loadJSON("children.json");
  const milestones = loadJSON("milestones.json");
  const child = children.find(c => c.id == req.params.childId);

  if (!child) return res.status(404).json({ error: "Child not found" });

  const relevantMilestones = milestones.filter(m => m.ageGroup === child.ageGroup);
  res.json(relevantMilestones);
});

module.exports = router;
