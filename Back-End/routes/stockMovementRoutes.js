// backend/routes/stockMovementRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all stock movements (calculated from purchases + sales)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `-- Stock IN from purchases
       SELECT 
         inventory.name AS product_name,
         'IN' AS movement_type,
         purchase_items.quantity,
         CONCAT('Purchased from ', suppliers.name) AS notes,
         purchases.created_at
       FROM purchase_items
       LEFT JOIN inventory ON purchase_items.product_id = inventory.id
       LEFT JOIN purchases ON purchase_items.purchase_id = purchases.id
       LEFT JOIN suppliers ON purchases.supplier_id = suppliers.id

       UNION ALL

       -- Stock OUT from sales
       SELECT 
         inventory.name AS product_name,
         'OUT' AS movement_type,
         sales_items.quantity,
         CONCAT('Sold - Invoice ', sales.invoice_number) AS notes,
         sales.created_at
       FROM sales_items
       LEFT JOIN inventory ON sales_items.product_id = inventory.id
       LEFT JOIN sales ON sales_items.sale_id = sales.id

       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Stock Movements Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;