const express = require("express");
const router  = express.Router();
const pool    = require("../db");

// ── GET ALL CATEGORIES ──────────────────────────────────────────
router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM expense_categories ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CREATE EXPENSE ──────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { category_id, description, amount, payment_method, expense_date, created_by } = req.body;

    if (!amount || !expense_date)
      return res.status(400).json({ error: "Amount and date are required" });

    const result = await pool.query(
      `INSERT INTO expenses (category_id, description, amount, payment_method, expense_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [category_id, description, amount, payment_method || "cash", expense_date, created_by || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET ALL EXPENSES ────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query;

    let query = `
      SELECT e.*, ec.name AS category_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
    `;
    const params = [];

    if (from && to) {
      query += ` WHERE e.expense_date BETWEEN $1 AND $2`;
      params.push(from, to);
    }

    query += ` ORDER BY e.expense_date DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE EXPENSE ──────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM expenses WHERE id = $1`, [id]);
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;