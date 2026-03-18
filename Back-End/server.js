// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");
const salesRoutes = require("./routes/salesRoutes");
const inventoryRoutes = require("./routes/inventory");
const customerRoutes = require("./routes/customerRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const stockMovementRoutes = require("./routes/stockMovementRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");



// Load purchaseRoutes safely
let purchaseRoutes;
try {
  purchaseRoutes = require("./routes/purchaseRoutes");
  console.log("Purchase routes loaded ✅");
} catch (err) {
  console.error("🔥 Failed to load purchaseRoutes:", err.message);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("Famcare POS Backend Running 🚀");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/suppliers", supplierRoutes);
console.log("Suppliers registered at /api/suppliers");
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/dashboard", dashboardRoutes);



// Only register purchases route if it loaded successfully
if (purchaseRoutes) {
  app.use("/api/purchases", purchaseRoutes);
}

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
const PORT = 5003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});