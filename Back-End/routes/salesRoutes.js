// backend/routes/salesRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// ================= COMPLETE SALE =================
router.post("/complete", async (req, res) => {
  const { cart, payment_method, total, customer_id } = req.body;

  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Cart is empty or invalid" });
  }

  // Basic shape validation up front — fail fast before touching the DB.
  for (const item of cart) {
    if (!item.product_id || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({ error: "Invalid item in cart" });
    }
  }

  // Use a single client for the whole operation so it can be wrapped in
  // one real transaction: either everything commits, or nothing does.
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the invoice-number lookup + insert together so two concurrent
    // sales can't read the same "last" number and generate a duplicate.
    // SELECT ... FOR UPDATE holds a row lock until COMMIT/ROLLBACK, so the
    // second concurrent request simply waits its turn here.
    const lastInvoice = await client.query(
      `SELECT invoice_number FROM sales
       WHERE invoice_number LIKE 'FCR/%'
       ORDER BY id DESC LIMIT 1
       FOR UPDATE`
    );

    let nextNumber = 1;
    if (lastInvoice.rows.length > 0) {
      const lastNum = parseInt(lastInvoice.rows[0].invoice_number.split("/")[1]);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    const year = new Date().getFullYear();
    const invoiceNumber = `FCR/${String(nextNumber).padStart(4, "0")}/${year}`;

    const saleResult = await client.query(
      `INSERT INTO sales (customer_id, total_amount, payment_method, invoice_number)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [customer_id, total, payment_method, invoiceNumber]
    );

    const sale_id = saleResult.rows[0].id;

    for (const item of cart) {
      // Atomic, race-safe stock decrement: the WHERE clause only matches
      // (and only decrements) if there's still enough stock RIGHT NOW,
      // per Postgres's own row-level guarantees. If a concurrent sale
      // already took the stock, this matches zero rows and we bail out
      // and roll back the whole transaction instead of going negative.
      const stockUpdate = await client.query(
        `UPDATE inventory
         SET quantity = quantity - $1
         WHERE id = $2 AND quantity >= $1
         RETURNING quantity, name`,
        [item.quantity, item.product_id]
      );

      if (stockUpdate.rowCount === 0) {
        // Either the product doesn't exist, or there isn't enough stock.
        const check = await client.query(
          `SELECT name, quantity FROM inventory WHERE id = $1`,
          [item.product_id]
        );
        await client.query("ROLLBACK");

        if (check.rows.length === 0) {
          return res.status(404).json({ error: `Product not found (id ${item.product_id})` });
        }
        return res.status(409).json({
          error: `Not enough stock for "${check.rows[0].name}". Only ${check.rows[0].quantity} unit(s) available.`,
        });
      }

      await client.query(
        `INSERT INTO sales_items (sale_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [sale_id, item.product_id, item.quantity, item.price]
      );

      await client.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [item.product_id, "OUT", item.quantity, sale_id, `Sold - Invoice ${invoiceNumber}`]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Sale completed successfully",
      invoice_number: invoiceNumber,
      sale_id,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("🔥 Complete Sale Error:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// ================= GET ALL SALES =================
router.get("/list", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sales.*, customers.name AS customer_name
       FROM sales
       LEFT JOIN customers ON sales.customer_id = customers.id
       ORDER BY sales.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("🔥 Fetch Sales Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ================= GET SINGLE SALE / INVOICE / RECEIPT =================
router.get("/receipt/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const saleRes = await pool.query(
      `SELECT sales.*, customers.name AS customer_name, customers.phone AS customer_phone
       FROM sales
       LEFT JOIN customers ON sales.customer_id = customers.id
       WHERE sales.id = $1`,
      [id]
    );

    if (!saleRes.rows[0]) {
      return res.status(404).json({ error: "Sale not found" });
    }

    const itemsRes = await pool.query(
      `SELECT sales_items.id, sales_items.quantity, sales_items.price,
              inventory.name AS product_name
       FROM sales_items
       LEFT JOIN inventory ON sales_items.product_id = inventory.id
       WHERE sales_items.sale_id = $1`,
      [id]
    );

    res.json({ sale: saleRes.rows[0], items: itemsRes.rows });

  } catch (error) {
    console.error("🔥 Fetch Receipt Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ================= CONVERT TO RECEIPT =================
router.post("/:id/convert-to-receipt", async (req, res) => {
  const saleId = req.params.id;

  try {
    const saleResult = await pool.query(
      "SELECT * FROM sales WHERE id = $1", [saleId]
    );

    if (!saleResult.rows[0]) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const sale = saleResult.rows[0];

    const allowedMethods = ["cash", "mpesa", "card"];
    if (!allowedMethods.includes(sale.payment_method.toLowerCase())) {
      return res.status(400).json({ message: "Receipt cannot be generated for this payment method" });
    }

    const existingReceipt = await pool.query(
      "SELECT * FROM receipts WHERE sale_id = $1", [saleId]
    );

    if (existingReceipt.rows.length > 0) {
      return res.status(400).json({ message: "Receipt already exists" });
    }

    const receiptResult = await pool.query(
      `INSERT INTO receipts (sale_id, customer_id, total_amount, payment_method)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sale.id, sale.customer_id, sale.total_amount, sale.payment_method]
    );

    res.json({ message: "Receipt generated successfully", receipt: receiptResult.rows[0] });

  } catch (err) {
    console.error("🔥 Convert to Receipt Error:", err.message);
    res.status(500).json({ message: "Error creating receipt" });
  }
});

// ================= GET ALL RECEIPTS =================
router.get("/receipts", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT receipts.*, customers.name AS customer_name
       FROM receipts
       LEFT JOIN customers ON receipts.customer_id = customers.id
       ORDER BY receipts.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Fetch Receipts Error:", err.message);
    res.status(500).json({ message: "Error fetching receipts" });
  }
});

module.exports = router;