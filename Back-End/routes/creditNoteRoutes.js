const express = require("express");
const router = express.Router();
const pool = require("../db");

// ================= CREATE CREDIT NOTE =================
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const { sale_id, customer_id, reason, items } = req.body;

    if (!sale_id || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "sale_id and items are required" });

    await client.query("BEGIN");

    // Auto-generate credit note number
    const last = await client.query(
      `SELECT credit_number FROM credit_notes 
       WHERE credit_number LIKE 'CN/%' 
       ORDER BY id DESC LIMIT 1`
    );
    let nextNum = 1;
    if (last.rows.length > 0) {
      const lastNum = parseInt(last.rows[0].credit_number.split("/")[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const year = new Date().getFullYear();
    const credit_number = `CN/${String(nextNum).padStart(4, "0")}/${year}`;

    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

    const result = await client.query(
      `INSERT INTO credit_notes (sale_id, customer_id, credit_number, reason, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, 'issued')
       RETURNING *`,
      [sale_id, customer_id, credit_number, reason || null, totalAmount]
    );

    const creditNoteId = result.rows[0].id;

    for (let item of items) {
      await client.query(
        `INSERT INTO credit_note_items (credit_note_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [creditNoteId, item.product_id, item.quantity, item.price]
      );

      // Return stock back to inventory
      await client.query(
        `UPDATE inventory SET quantity = quantity + $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );

      // Record stock movement IN (returned)
      await client.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes)
         VALUES ($1, 'IN', $2, $3, $4)`,
        [item.product_id, item.quantity, creditNoteId, `Return - Credit Note ${credit_number}`]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🔥 Create Credit Note Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ================= GET ALL CREDIT NOTES =================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cn.*, c.name AS customer_name, s.invoice_number
       FROM credit_notes cn
       LEFT JOIN customers c ON cn.customer_id = c.id
       LEFT JOIN sales s ON cn.sale_id = s.id
       ORDER BY cn.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Fetch Credit Notes Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= GET SINGLE CREDIT NOTE =================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const cn = await pool.query(
      `SELECT cn.*, c.name AS customer_name, c.phone AS customer_phone,
              s.invoice_number
       FROM credit_notes cn
       LEFT JOIN customers c ON cn.customer_id = c.id
       LEFT JOIN sales s ON cn.sale_id = s.id
       WHERE cn.id = $1`,
      [id]
    );

    if (cn.rows.length === 0)
      return res.status(404).json({ error: "Credit note not found" });

    const items = await pool.query(
      `SELECT cni.*, i.name AS product_name, i.size
       FROM credit_note_items cni
       LEFT JOIN inventory i ON cni.product_id = i.id
       WHERE cni.credit_note_id = $1`,
      [id]
    );

    res.json({ credit_note: cn.rows[0], items: items.rows });
  } catch (err) {
    console.error("🔥 Fetch Credit Note Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;