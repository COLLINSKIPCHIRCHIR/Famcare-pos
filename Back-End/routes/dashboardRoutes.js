const express = require("express");
const router = express.Router();
const pool = require("../db");

// ================= SUMMARY =================
router.get("/summary", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Today's sales
    const salesRes = await pool.query(
      `SELECT COUNT(*) AS total_sales, COALESCE(SUM(total_amount), 0) AS revenue
       FROM sales
       WHERE DATE(created_at) = $1`,
      [today]
    );

    // Today's purchases
    const purchasesRes = await pool.query(
      `SELECT COUNT(*) AS total_purchases, COALESCE(SUM(total_amount), 0) AS purchase_amount
       FROM purchases
       WHERE DATE(created_at) = $1`,
      [today]
    );

    // Stock movement today
    const stockRes = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END), 0) AS stock_in,
        COALESCE(SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END), 0) AS stock_out
       FROM stock_movements
       WHERE DATE(created_at) = $1`,
      [today]
    );

    // Low stock products (quantity < 5)
    const lowStockRes = await pool.query(
      `SELECT id, name, size, quantity FROM inventory
       WHERE quantity < 5
       ORDER BY quantity ASC`
    );

    // Expired products
    const expiredRes = await pool.query(
      `SELECT id, name, size, expiry_date FROM inventory
       WHERE expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE
       ORDER BY expiry_date ASC`
    );

    // Expiring within 30 days
    const expiringSoonRes = await pool.query(
      `SELECT id, name, size, expiry_date,
        CEIL(expiry_date - CURRENT_DATE) AS days_left
       FROM inventory
       WHERE expiry_date IS NOT NULL
         AND expiry_date >= CURRENT_DATE
         AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
       ORDER BY expiry_date ASC`
    );

    res.json({
      today: {
        total_sales: parseInt(salesRes.rows[0].total_sales),
        revenue: parseFloat(salesRes.rows[0].revenue),
        total_purchases: parseInt(purchasesRes.rows[0].total_purchases),
        purchase_amount: parseFloat(purchasesRes.rows[0].purchase_amount),
      },
      stock_movement: {
        stock_in: parseInt(stockRes.rows[0].stock_in),
        stock_out: parseInt(stockRes.rows[0].stock_out),
      },
      alerts: {
        low_stock: lowStockRes.rows,
        expired: expiredRes.rows,
        expiring_soon: expiringSoonRes.rows,
      },
    });
  } catch (err) {
    console.error("🔥 Dashboard Summary Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= TOP SELLING PRODUCTS =================
router.get("/top-products", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        inventory.name AS product_name,
        inventory.size,
        SUM(sales_items.quantity) AS total_sold
       FROM sales_items
       LEFT JOIN inventory ON sales_items.product_id = inventory.id
       GROUP BY inventory.id, inventory.name, inventory.size
       ORDER BY total_sold DESC
       LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Top Products Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= SALES TREND (last 7 days) =================
router.get("/sales-trend", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS total_sales,
        COALESCE(SUM(total_amount), 0) AS revenue
       FROM sales
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Sales Trend Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= RECENT SALES =================
router.get("/recent-sales", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sales.id, sales.invoice_number, sales.total_amount,
              sales.payment_method, sales.created_at,
              customers.name AS customer_name
       FROM sales
       LEFT JOIN customers ON sales.customer_id = customers.id
       ORDER BY sales.created_at DESC
       LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Recent Sales Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= RECENT PURCHASES =================
router.get("/recent-purchases", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT purchases.id, purchases.total_amount, purchases.created_at,
              suppliers.name AS supplier_name
       FROM purchases
       LEFT JOIN suppliers ON purchases.supplier_id = suppliers.id
       ORDER BY purchases.created_at DESC
       LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Recent Purchases Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;