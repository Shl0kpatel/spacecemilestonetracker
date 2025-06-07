const express = require("express");
const app = express();
const parentRoutes = require("./routes/parents");

app.use(express.json());
app.use("/api/parent", parentRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));