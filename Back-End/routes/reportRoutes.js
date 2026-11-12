const express = require("express");
const router  = express.Router();
const pool    = require("../db");
const auth    = require("../middleware/authMiddleware"); // same JWT middleware patientRoutes uses

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

// ── CUSTOMER STATEMENT ──────────────────────────────────────────
// GET /api/reports/customer-statement?customer_id=12&from=2026-10-01&to=2026-10-31&include_paid=false
//
// Debit  = invoices on account (customer owes us)
// Credit = payments received + credit notes (customer owes us less)
// Balance > 0 means the customer owes us. Balance < 0 means they are in credit.
//
// A sale counts as an "account sale" if its payment_method is credit/insurance
// OR it has any customer_payments row (a fully paid credit sale gets flipped to
// 'cash' by receivableRoutes, so payment_method alone can't be trusted).
// include_paid=true also lists cash/mpesa/card sales: a debit plus an equal
// credit, so the running balance never moves because of them.
const STATEMENT_TX_SQL = `
  WITH acct AS (
    SELECT s.id
    FROM sales s
    WHERE s.customer_id = $1
      AND (
        s.payment_method IN ('credit', 'insurance')
        OR EXISTS (SELECT 1 FROM customer_payments cp WHERE cp.sale_id = s.id)
      )
  ),
  tx AS (
    -- Invoices (debit)
    SELECT DATE(s.created_at) AS tx_date, 1 AS ord, s.id AS ref_id,
           'INVOICE' AS type, s.invoice_number AS reference,
           'Sale' AS description,
           s.total_amount AS debit, 0::numeric AS credit
    FROM sales s
    WHERE s.customer_id = $1
      AND ($2::boolean OR s.id IN (SELECT id FROM acct))

    UNION ALL
    -- Paid-at-counter sales (credit) — only when include_paid is on
    SELECT DATE(s.created_at), 2, s.id,
           'PAID', s.invoice_number,
           'Paid at sale (' || COALESCE(s.payment_method, 'cash') || ')',
           0::numeric, s.total_amount
    FROM sales s
    WHERE s.customer_id = $1
      AND $2::boolean
      AND s.id NOT IN (SELECT id FROM acct)

    UNION ALL
    -- Payments received against account sales (credit)
    SELECT cp.payment_date::date, 2, cp.id,
           'PAYMENT', s.invoice_number,
           'Payment (' || COALESCE(cp.payment_method, 'cash') || ')'
             || COALESCE(' - ' || NULLIF(cp.notes, ''), ''),
           0::numeric, cp.amount_paid
    FROM customer_payments cp
    JOIN sales s ON s.id = cp.sale_id
    WHERE s.customer_id = $1

    UNION ALL
    -- Credit notes (credit). Only against account sales unless include_paid is on,
    -- because a credit note on a cash sale is a refund, not a reduction of what's owed.
    SELECT DATE(cn.created_at), 3, cn.id,
           'CREDIT NOTE', cn.credit_number,
           COALESCE('Return - ' || NULLIF(cn.reason, ''), 'Return'),
           0::numeric, cn.total_amount
    FROM credit_notes cn
    JOIN sales s ON s.id = cn.sale_id
    WHERE s.customer_id = $1
      AND COALESCE(cn.status, 'issued') <> 'cancelled'
      AND ($2::boolean OR cn.sale_id IN (SELECT id FROM acct))
  )
`;

router.get("/customer-statement", auth, async (req, res) => {
  try {
    const { customer_id, from, to } = req.query;
    const includePaid = String(req.query.include_paid) === "true";

    if (!customer_id || isNaN(parseInt(customer_id)))
      return res.status(400).json({ error: "customer_id is required" });

    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    const today = new Date().toISOString().split("T")[0];
    const start = from && isoDate.test(from) ? from : today.slice(0, 8) + "01";
    const end   = to   && isoDate.test(to)   ? to   : today;
    if (start > end)
      return res.status(400).json({ error: "'From' date must be before 'To' date" });

    const custRes = await pool.query(
      `SELECT id, name, phone, email FROM customers WHERE id = $1`, [customer_id]
    );
    if (!custRes.rows.length)
      return res.status(404).json({ error: "Customer not found" });

    const params = [customer_id, includePaid];

    // Everything before 'from' collapses into one opening balance
    const openingRes = await pool.query(
      `${STATEMENT_TX_SQL}
       SELECT COALESCE(SUM(debit - credit), 0) AS opening FROM tx WHERE tx_date < $3::date`,
      [...params, start]
    );

    const txRes = await pool.query(
      `${STATEMENT_TX_SQL}
       SELECT TO_CHAR(tx_date, 'YYYY-MM-DD') AS date, type, reference, description, debit, credit
       FROM tx
       WHERE tx_date BETWEEN $3::date AND $4::date
       ORDER BY tx_date, ord, ref_id`,
      [...params, start, end]
    );

    const opening = parseFloat(openingRes.rows[0].opening);
    let running = opening, totalDebit = 0, totalCredit = 0;

    const rows = txRes.rows.map((r) => {
      const debit  = parseFloat(r.debit);
      const credit = parseFloat(r.credit);
      running     += debit - credit;
      totalDebit  += debit;
      totalCredit += credit;
      return {
        date: r.date, type: r.type, reference: r.reference, description: r.description,
        debit, credit, balance: Math.round(running * 100) / 100,
      };
    });

    res.json({
      customer: custRes.rows[0],
      period: { from: start, to: end },
      include_paid: includePaid,
      opening_balance: opening,
      rows,
      total_debit: totalDebit,
      total_credit: totalCredit,
      closing_balance: Math.round(running * 100) / 100,
    });
  } catch (err) {
    console.error("🔥 Customer Statement Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;