// server.js
const express = require("express");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");
const salesRoutes = require("./routes/salesRoutes"); // ✅ Fixed: points to salesRoutes.js
const inventoryRoutes = require("./routes/inventory");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("Famcare POS Backend Running 🚀");
});

// API Routes
app.use("/auth", authRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/customers", customerRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 FULL ERROR:", err);
  res.status(500).json({ message: err.message });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});