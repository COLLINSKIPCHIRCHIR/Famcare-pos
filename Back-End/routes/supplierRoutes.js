// backend/routes/supplierRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
console.log("Suppliers routes loaded");
console.log("SUPPLIER ROUTES FILE LOADED");

// ================= CREATE SUPPLIER =================
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name) return res.status(400).json({ message: "Supplier name is required" });

    const result = await pool.query(
      `INSERT INTO suppliers (name, phone, email, address)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, phone || "", email || "", address || ""]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Create Supplier Error:", err.message);
    res.status(500).json({ message: "Error creating supplier" });
  }
});

// ================= GET ALL SUPPLIERS =================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM suppliers ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Fetch Suppliers Error:", err.message);
    res.status(500).json({ message: "Error fetching suppliers" });
  }
});

// ================= GET SINGLE SUPPLIER =================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM suppliers WHERE id = $1`, [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Supplier not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Fetch Supplier Error:", err.message);
    res.status(500).json({ message: "Error fetching supplier" });
  }
});

// ================= UPDATE SUPPLIER =================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    const result = await pool.query(
      `UPDATE suppliers
       SET name = $1, phone = $2, email = $3, address = $4
       WHERE id = $5 RETURNING *`,
      [name, phone, email, address, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Supplier not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Update Supplier Error:", err.message);
    res.status(500).json({ message: "Error updating supplier" });
  }
});

// ================= DELETE SUPPLIER =================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM suppliers WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Supplier not found" });

    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    console.error("🔥 Delete Supplier Error:", err.message);
    res.status(500).json({ message: "Error deleting supplier" });
  }
});

module.exports = router;