const express = require("express");
const router  = express.Router();
const pool    = require("../db");

// ── GET ALL OUTSTANDING BALANCES ────────────────────────────────
router.get("/outstanding", async (req, res) => {
  try {
    // Credit notes now reduce what the customer owes, so this page agrees with
    // the Customer Statement report. Correlated subqueries (not extra JOINs) are
    // used so a sale with several payments AND credit notes isn't double-counted.
    const result = await pool.query(`
      SELECT * FROM (
        SELECT
          s.id AS sale_id,
          s.invoice_number,
          s.total_amount,
          s.created_at,
          s.payment_method,
          c.id AS customer_id,
          c.name AS customer_name,
          c.phone AS customer_phone,
          COALESCE((SELECT SUM(cp.amount_paid) FROM customer_payments cp WHERE cp.sale_id = s.id), 0) AS total_paid,
          COALESCE((SELECT SUM(cn.total_amount) FROM credit_notes cn
                    WHERE cn.sale_id = s.id AND COALESCE(cn.status, 'issued') <> 'cancelled'), 0) AS total_credited,
          s.total_amount
            - COALESCE((SELECT SUM(cp.amount_paid) FROM customer_payments cp WHERE cp.sale_id = s.id), 0)
            - COALESCE((SELECT SUM(cn.total_amount) FROM credit_notes cn
                        WHERE cn.sale_id = s.id AND COALESCE(cn.status, 'issued') <> 'cancelled'), 0) AS balance
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.payment_method IN ('credit', 'insurance')
      ) t
      WHERE t.balance > 0
      ORDER BY t.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET PAYMENT HISTORY FOR A SALE ─────────────────────────────
router.get("/payments/:sale_id", async (req, res) => {
  try {
    const { sale_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM customer_payments WHERE sale_id = $1 ORDER BY payment_date DESC`,
      [sale_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── RECORD A PAYMENT ────────────────────────────────────────────
router.post("/payments", async (req, res) => {
  try {
    const { customer_id, sale_id, amount_paid, payment_method, payment_date, notes } = req.body;

    if (!sale_id || !amount_paid)
      return res.status(400).json({ error: "Sale and amount are required" });

    // Check balance remaining
    const balanceRes = await pool.query(`
      SELECT s.total_amount
             - COALESCE((SELECT SUM(cp.amount_paid) FROM customer_payments cp WHERE cp.sale_id = s.id), 0)
             - COALESCE((SELECT SUM(cn.total_amount) FROM credit_notes cn
                         WHERE cn.sale_id = s.id AND COALESCE(cn.status, 'issued') <> 'cancelled'), 0) AS balance
      FROM sales s
      WHERE s.id = $1
    `, [sale_id]);

    const balance = parseFloat(balanceRes.rows[0]?.balance || 0);
    if (amount_paid > balance)
      return res.status(400).json({ error: `Amount exceeds balance of KES ${balance.toLocaleString()}` });

    const result = await pool.query(
      `INSERT INTO customer_payments 
        (customer_id, sale_id, amount_paid, payment_method, payment_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [customer_id, sale_id, amount_paid, payment_method || "cash", payment_date, notes || null]
    );

    // If fully paid, update sale payment method to cash
    if (amount_paid >= balance) {
      await pool.query(
        `UPDATE sales SET payment_method = 'cash' WHERE id = $1`, [sale_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;