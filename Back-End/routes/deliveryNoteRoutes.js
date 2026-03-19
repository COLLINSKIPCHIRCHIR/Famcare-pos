const express = require("express");
const router = express.Router();
const pool = require("../db");

// ================= CREATE DELIVERY NOTE FROM A SALE =================
router.post("/", async (req, res) => {
  try {
    const { sale_id, customer_id, delivery_address, delivered_by, notes } = req.body;

    if (!sale_id) return res.status(400).json({ error: "sale_id is required" });

    const existing = await pool.query(
    `SELECT id FROM delivery_notes WHERE sale_id = $1`, [sale_id]
    );
    if (existing.rows.length > 0) {
    return res.status(400).json({ error: "A delivery note already exists for this sale" });
    }

    // Auto-generate delivery note number
    const last = await pool.query(
      `SELECT delivery_number FROM delivery_notes 
       WHERE delivery_number LIKE 'DN/%' 
       ORDER BY id DESC LIMIT 1`
    );
    let nextNum = 1;
    if (last.rows.length > 0) {
      const lastNum = parseInt(last.rows[0].delivery_number.split("/")[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const year = new Date().getFullYear();
    const delivery_number = `DN/${String(nextNum).padStart(4, "0")}/${year}`;

    const result = await pool.query(
      `INSERT INTO delivery_notes 
        (sale_id, customer_id, delivery_number, delivery_address, delivered_by, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [sale_id, customer_id, delivery_number, delivery_address, delivered_by, notes]
    );

    // Copy items from the sale
    const saleItems = await pool.query(
      `SELECT product_id, quantity FROM sales_items WHERE sale_id = $1`,
      [sale_id]
    );

    for (let item of saleItems.rows) {
      await pool.query(
        `INSERT INTO delivery_note_items (delivery_note_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [result.rows[0].id, item.product_id, item.quantity]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Create Delivery Note Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= GET ALL DELIVERY NOTES =================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT dn.*, c.name AS customer_name, s.invoice_number
       FROM delivery_notes dn
       LEFT JOIN customers c ON dn.customer_id = c.id
       LEFT JOIN sales s ON dn.sale_id = s.id
       ORDER BY dn.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Fetch Delivery Notes Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= GET SINGLE DELIVERY NOTE =================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const dn = await pool.query(
      `SELECT dn.*, c.name AS customer_name, c.phone AS customer_phone,
              s.invoice_number, s.payment_method
       FROM delivery_notes dn
       LEFT JOIN customers c ON dn.customer_id = c.id
       LEFT JOIN sales s ON dn.sale_id = s.id
       WHERE dn.id = $1`,
      [id]
    );

    if (dn.rows.length === 0)
      return res.status(404).json({ error: "Delivery note not found" });

    const items = await pool.query(
      `SELECT dni.*, i.name AS product_name, i.size
       FROM delivery_note_items dni
       LEFT JOIN inventory i ON dni.product_id = i.id
       WHERE dni.delivery_note_id = $1`,
      [id]
    );

    res.json({ delivery_note: dn.rows[0], items: items.rows });
  } catch (err) {
    console.error("🔥 Fetch Single Delivery Note Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= UPDATE STATUS =================
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // pending, delivered, cancelled

    const result = await pool.query(
      `UPDATE delivery_notes SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Update Delivery Note Status Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;