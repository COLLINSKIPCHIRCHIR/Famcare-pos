const express = require("express");
const router  = express.Router();
const pool    = require("../db");

// ── CREATE ESTIMATE ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { customer_id, items, valid_until, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Items are required" });

    // Auto-generate estimate number
    const last = await pool.query(
      `SELECT estimate_number FROM estimates 
       WHERE estimate_number LIKE 'EST/%' 
       ORDER BY id DESC LIMIT 1`
    );
    let nextNum = 1;
    if (last.rows.length > 0) {
      const lastNum = parseInt(last.rows[0].estimate_number.split("/")[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const year = new Date().getFullYear();
    const estimate_number = `EST/${String(nextNum).padStart(4, "0")}/${year}`;

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const result = await pool.query(
      `INSERT INTO estimates 
        (customer_id, estimate_number, total_amount, valid_until, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'draft')
       RETURNING *`,
      [customer_id || null, estimate_number, totalAmount, valid_until || null, notes || null]
    );

    const estimateId = result.rows[0].id;

    for (let item of items) {
      await pool.query(
        `INSERT INTO estimate_items (estimate_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [estimateId, item.product_id, item.quantity, item.price]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Create Estimate Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET ALL ESTIMATES ───────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, c.name AS customer_name
       FROM estimates e
       LEFT JOIN customers c ON e.customer_id = c.id
       ORDER BY e.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET SINGLE ESTIMATE ─────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const estimate = await pool.query(
      `SELECT e.*, c.name AS customer_name, c.phone AS customer_phone
       FROM estimates e
       LEFT JOIN customers c ON e.customer_id = c.id
       WHERE e.id = $1`,
      [id]
    );

    if (estimate.rows.length === 0)
      return res.status(404).json({ error: "Estimate not found" });

    const items = await pool.query(
      `SELECT ei.*, i.name AS product_name, i.size
       FROM estimate_items ei
       LEFT JOIN inventory i ON ei.product_id = i.id
       WHERE ei.estimate_id = $1`,
      [id]
    );

    res.json({ estimate: estimate.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE STATUS ───────────────────────────────────────────────
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE estimates SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CONVERT ESTIMATE TO PROFORMA ────────────────────────────────
router.post("/:id/convert-to-proforma", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query("BEGIN");

    const estRes = await client.query(
      `SELECT * FROM estimates WHERE id = $1`, [id]
    );
    if (estRes.rows.length === 0)
      return res.status(404).json({ error: "Estimate not found" });

    const est = estRes.rows[0];

    if (est.status === "converted")
      return res.status(400).json({ error: "Already converted" });

    // Generate proforma number
    const last = await client.query(
      `SELECT proforma_number FROM proforma_invoices 
       WHERE proforma_number LIKE 'PRO/%' 
       ORDER BY id DESC LIMIT 1`
    );
    let nextNum = 1;
    if (last.rows.length > 0) {
      const lastNum = parseInt(last.rows[0].proforma_number.split("/")[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const year = new Date().getFullYear();
    const proforma_number = `PRO/${String(nextNum).padStart(4, "0")}/${year}`;

    // Create proforma
    const proformaRes = await client.query(
      `INSERT INTO proforma_invoices 
        (customer_id, proforma_number, total_amount, valid_until, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [est.customer_id, proforma_number, est.total_amount, est.valid_until, est.notes]
    );

    const proformaId = proformaRes.rows[0].id;

    // Copy estimate items to proforma items
    const estItems = await client.query(
      `SELECT * FROM estimate_items WHERE estimate_id = $1`, [id]
    );

    for (let item of estItems.rows) {
      await client.query(
        `INSERT INTO proforma_items (proforma_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [proformaId, item.product_id, item.quantity, item.price]
      );
    }

    // Mark estimate as converted
    await client.query(
      `UPDATE estimates SET status = 'converted' WHERE id = $1`, [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Estimate converted to proforma successfully",
      proforma_id: proformaId,
      proforma_number,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🔥 Convert Estimate Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;