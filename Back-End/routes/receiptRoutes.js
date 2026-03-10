// backend/routes/receiptRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// ================= GET ALL RECEIPTS =================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT receipts.*, customers.name AS customer_name
      FROM receipts
      LEFT JOIN customers ON receipts.customer_id = customers.id
      ORDER BY receipts.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Fetch Receipts Error:", err.message);
    res.status(500).json({ message: "Error fetching receipts" });
  }
});

// ================= GET SINGLE RECEIPT =================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const receiptRes = await pool.query(
      `SELECT receipts.*, customers.name AS customer_name, customers.phone AS customer_phone
       FROM receipts
       LEFT JOIN customers ON receipts.customer_id = customers.id
       WHERE receipts.id = $1`,
      [id]
    );

    if (receiptRes.rows.length === 0) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // ✅ Fixed: i.name AS product_name
    const saleItemsRes = await pool.query(
      `SELECT si.id, si.quantity, si.price, i.name AS product_name
       FROM sales_items si
       LEFT JOIN inventory i ON si.product_id = i.id
       WHERE si.sale_id = $1`,
      [receiptRes.rows[0].sale_id]
    );

    res.json({
      receipt: receiptRes.rows[0],
      items: saleItemsRes.rows,
    });

  } catch (err) {
    console.error("🔥 Fetch Single Receipt Error:", err.message);
    res.status(500).json({ message: "Error fetching receipt" });
  }
});

module.exports = router;