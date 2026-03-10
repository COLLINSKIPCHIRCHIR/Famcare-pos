const express = require("express");
const pool = require("../db");
const router = express.Router();

// Add inventory item
router.post("/add", async (req, res) => {
  try {
    const { name, size, quantity, buying_price, selling_price, expiry_date } = req.body;
    const newItem = await pool.query(
      `INSERT INTO inventory (name, size, quantity, buying_price, selling_price, expiry_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, size || "N/A", quantity, buying_price, selling_price, expiry_date || null]
    );
    res.json(newItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get inventory list (used by InventoryList.jsx)
router.get("/list", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, size, quantity, buying_price, selling_price, expiry_date
       FROM inventory ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// GET all inventory items (used by PurchaseAdd)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, size, quantity, buying_price, selling_price, expiry_date
       FROM inventory ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// DELETE any product permanently (keeps all history)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await pool.query(
      `SELECT * FROM inventory WHERE id = $1`, [id]
    );

    if (product.rows.length === 0)
      return res.status(404).json({ error: "Product not found" });

    // Unlink from all related tables to preserve history
    await pool.query(`UPDATE stock_movements SET product_id = NULL WHERE product_id = $1`, [id]);
    await pool.query(`UPDATE sales_items SET product_id = NULL WHERE product_id = $1`, [id]);
    await pool.query(`UPDATE purchase_items SET product_id = NULL WHERE product_id = $1`, [id]);

    // Now delete the product
    await pool.query(`DELETE FROM inventory WHERE id = $1`, [id]);

    res.json({ message: `${product.rows[0].name} has been permanently deleted from inventory` });

  } catch (err) {
    console.error("🔥 Delete Inventory Error:", err.message);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;