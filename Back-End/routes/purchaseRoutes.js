const express = require("express");
const router = express.Router();
const pool = require("../db");

// ================= CREATE PURCHASE =================
router.post("/", async (req, res) => {
  const { supplier_id, items } = req.body;

  if (!supplier_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Supplier and items are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Calculate total upfront
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    // Create purchase record
    const purchaseResult = await client.query(
      `INSERT INTO purchases (supplier_id, total_amount)
       VALUES ($1, $2)
       RETURNING *`,
      [supplier_id, totalAmount]
    );

    const purchaseId = purchaseResult.rows[0].id;

    // Loop through items
    for (let item of items) {
      const { product_id, quantity, price, size, expiry_date } = item;

      // Get the original product name and selling price
      const productRes = await client.query(
        `SELECT name, selling_price FROM inventory WHERE id = $1`,
        [product_id]
      );
      const productName = productRes.rows[0]?.name;
      const sellingPrice = productRes.rows[0]?.selling_price;

      if (expiry_date) {
        // Expiry date provided — ALWAYS create a new inventory row (new batch)
        const newProduct = await client.query(
          `INSERT INTO inventory (name, size, quantity, buying_price, selling_price, expiry_date)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [productName, size || "N/A", quantity, price, sellingPrice, expiry_date]
        );

        // Record stock movement (IN) for new batch
        await client.query(
          `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [newProduct.rows[0].id, "IN", quantity, purchaseId, "New batch added from supplier purchase"]
        );
      } else {
        // No expiry date — just update quantity and buying price on existing product
        await client.query(
          `UPDATE inventory SET quantity = quantity + $1, buying_price = $2 WHERE id = $3`,
          [quantity, price, product_id]
        );

        // Record stock movement (IN) for existing product
        await client.query(
          `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [product_id, "IN", quantity, purchaseId, "Stock added from supplier purchase"]
        );
      }

      // Insert purchase item record
      await client.query(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [purchaseId, product_id, quantity, price]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({
      message: "Purchase created successfully",
      purchase_id: purchaseId,
      total_amount: totalAmount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("🔥 Purchase Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to create purchase" });
  } finally {
    client.release();
  }
});

// ================= GET ALL PURCHASES =================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT purchases.*, suppliers.name AS supplier_name
       FROM purchases
       LEFT JOIN suppliers ON purchases.supplier_id = suppliers.id
       ORDER BY purchases.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("🔥 Fetch Purchases Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ================= GET SINGLE PURCHASE WITH ITEMS =================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await pool.query(
      `SELECT purchases.*, suppliers.name AS supplier_name
       FROM purchases
       LEFT JOIN suppliers ON purchases.supplier_id = suppliers.id
       WHERE purchases.id = $1`,
      [id]
    );

    if (purchase.rows.length === 0)
      return res.status(404).json({ error: "Purchase not found" });

    const items = await pool.query(
      `SELECT purchase_items.*, inventory.name AS product_name
       FROM purchase_items
       LEFT JOIN inventory ON purchase_items.product_id = inventory.id
       WHERE purchase_items.purchase_id = $1`,
      [id]
    );

    res.json({
      ...purchase.rows[0],
      items: items.rows,
    });
  } catch (error) {
    console.error("🔥 Fetch Purchase Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;