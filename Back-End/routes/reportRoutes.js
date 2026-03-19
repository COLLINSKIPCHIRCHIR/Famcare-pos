const express = require("express");
const router  = express.Router();
const pool    = require("../db");

// ── PROFIT & LOSS REPORT ────────────────────────────────────────
router.get("/pl", async (req, res) => {
  try {
    const { from, to } = req.query;
    const start = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const end   = to   || new Date().toISOString().split("T")[0];

    // Revenue — all completed sales
    const revenueRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS revenue
      FROM sales
      WHERE DATE(created_at) BETWEEN $1 AND $2
    `, [start, end]);

    // COGS — cost of goods sold
    const cogsRes = await pool.query(`
      SELECT COALESCE(SUM(si.quantity * i.buying_price), 0) AS cogs
      FROM sales_items si
      LEFT JOIN inventory i ON si.product_id = i.id
      LEFT JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) BETWEEN $1 AND $2
    `, [start, end]);

    // Expenses
    const expensesRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_expenses
      FROM expenses
      WHERE expense_date BETWEEN $1 AND $2
    `, [start, end]);

    // Expenses by category
    const expByCatRes = await pool.query(`
      SELECT ec.name AS category, COALESCE(SUM(e.amount), 0) AS amount
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.expense_date BETWEEN $1 AND $2
      GROUP BY ec.name
      ORDER BY amount DESC
    `, [start, end]);

    // Purchases total
    const purchasesRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total_purchases
      FROM purchases
      WHERE DATE(created_at) BETWEEN $1 AND $2
    `, [start, end]);

    const revenue        = parseFloat(revenueRes.rows[0].revenue);
    const cogs           = parseFloat(cogsRes.rows[0].cogs);
    const totalExpenses  = parseFloat(expensesRes.rows[0].total_expenses);
    const grossProfit    = revenue - cogs;
    const netProfit      = grossProfit - totalExpenses;

    res.json({
      period: { from: start, to: end },
      revenue,
      cogs,
      gross_profit:    grossProfit,
      total_expenses:  totalExpenses,
      net_profit:      netProfit,
      total_purchases: parseFloat(purchasesRes.rows[0].total_purchases),
      expenses_by_category: expByCatRes.rows,
    });
  } catch (err) {
    console.error("🔥 P&L Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── VAT REPORT ──────────────────────────────────────────────────
router.get("/vat", async (req, res) => {
  try {
    const { from, to } = req.query;
    const start = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const end   = to   || new Date().toISOString().split("T")[0];

    // Output VAT — collected from customers
    const outputRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS gross_sales
      FROM sales
      WHERE DATE(created_at) BETWEEN $1 AND $2
    `, [start, end]);

    // Input VAT — paid to suppliers on purchases
    const inputRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS gross_purchases
      FROM purchases
      WHERE DATE(created_at) BETWEEN $1 AND $2
    `, [start, end]);

    const grossSales     = parseFloat(outputRes.rows[0].gross_sales);
    const grossPurchases = parseFloat(inputRes.rows[0].gross_purchases);

    const vatRate        = 0.16;
    const outputVat      = parseFloat((grossSales * vatRate / (1 + vatRate)).toFixed(2));
    const inputVat       = parseFloat((grossPurchases * vatRate / (1 + vatRate)).toFixed(2));
    const vatPayable     = parseFloat((outputVat - inputVat).toFixed(2));

    res.json({
      period:           { from: start, to: end },
      gross_sales:      grossSales,
      taxable_sales:    parseFloat((grossSales / 1.16).toFixed(2)),
      output_vat:       outputVat,
      gross_purchases:  grossPurchases,
      taxable_purchases: parseFloat((grossPurchases / 1.16).toFixed(2)),
      input_vat:        inputVat,
      vat_payable:      vatPayable,
    });
  } catch (err) {
    console.error("🔥 VAT Report Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;