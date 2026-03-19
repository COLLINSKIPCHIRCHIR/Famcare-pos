const express = require("express");
const router = express.Router();
const pool = require("../db");

// ================= CREATE PROFORMA INVOICE =================
router.post("/", async (req, res) => {
  try {
    const { customer_id, items, valid_until, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Items are required" });

    // Auto-generate proforma number
    const last = await pool.query(
      `SELECT proforma_number FROM proforma_invoices 
       WHERE proforma_number LIKE 'PRO/%' 
       ORDER BY id DESC LIMIT 1`
    );
    let nextNum = 1;
    if (last.rows.length > 0) {
      const lastNum = parseInt(last.rows[0].proforma_number.split("/")[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const year = new Date().getFullYear();
    const proforma_number = `PRO/${String(nextNum).padStart(4, "0")}/${year}`;

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const result = await pool.query(
      `INSERT INTO proforma_invoices 
        (customer_id, proforma_number, total_amount, valid_until, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [customer_id, proforma_number, totalAmount, valid_until || null, notes || null]
    );

    const proformaId = result.rows[0].id;

    for (let item of items) {
      await pool.query(
        `INSERT INTO proforma_items (proforma_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [proformaId, item.product_id, item.quantity, item.price]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Create Proforma Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= GET ALL PROFORMA INVOICES =================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pi.*, c.name AS customer_name
       FROM proforma_invoices pi
       LEFT JOIN customers c ON pi.customer_id = c.id
       ORDER BY pi.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Fetch Proformas Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= GET SINGLE PROFORMA =================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const proforma = await pool.query(
      `SELECT pi.*, c.name AS customer_name, c.phone AS customer_phone
       FROM proforma_invoices pi
       LEFT JOIN customers c ON pi.customer_id = c.id
       WHERE pi.id = $1`,
      [id]
    );

    if (proforma.rows.length === 0)
      return res.status(404).json({ error: "Proforma not found" });

    const items = await pool.query(
      `SELECT pti.*, i.name AS product_name, i.size
       FROM proforma_items pti
       LEFT JOIN inventory i ON pti.product_id = i.id
       WHERE pti.proforma_id = $1`,
      [id]
    );

    res.json({ proforma: proforma.rows[0], items: items.rows });
  } catch (err) {
    console.error("🔥 Fetch Proforma Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= CONVERT PROFORMA TO SALE =================
router.post("/:id/convert", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { payment_method } = req.body;

    await client.query("BEGIN");

    const proformaRes = await client.query(
      `SELECT * FROM proforma_invoices WHERE id = $1`, [id]
    );
    if (proformaRes.rows.length === 0)
      return res.status(404).json({ error: "Proforma not found" });

    const proforma = proformaRes.rows[0];

    if (proforma.status === "converted")
      return res.status(400).json({ error: "Already converted to a sale" });

    // Generate invoice number
    const lastInvoice = await client.query(
      `SELECT invoice_number FROM sales 
       WHERE invoice_number LIKE 'FCR/%' 
       ORDER BY id DESC LIMIT 1`
    );
    let nextNum = 1;
    if (lastInvoice.rows.length > 0) {
      const lastNum = parseInt(lastInvoice.rows[0].invoice_number.split("/")[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const year = new Date().getFullYear();
    const invoiceNumber = `FCR/${String(nextNum).padStart(4, "0")}/${year}`;

    // Create the sale
    const saleResult = await client.query(
      `INSERT INTO sales (customer_id, total_amount, payment_method, invoice_number)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [proforma.customer_id, proforma.total_amount, payment_method || "credit", invoiceNumber]
    );

    const sale_id = saleResult.rows[0].id;

    // Copy proforma items to sale items + update inventory
    const proformaItems = await client.query(
      `SELECT * FROM proforma_items WHERE proforma_id = $1`, [id]
    );

    for (let item of proformaItems.rows) {
      await client.query(
        `INSERT INTO sales_items (sale_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [sale_id, item.product_id, item.quantity, item.price]
      );

      await client.query(
        `UPDATE inventory SET quantity = quantity - $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );

      await client.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes)
         VALUES ($1, 'OUT', $2, $3, $4)`,
        [item.product_id, item.quantity, sale_id, `Converted from Proforma ${proforma.proforma_number}`]
      );
    }

    // Mark proforma as converted
    await client.query(
      `UPDATE proforma_invoices SET status = 'converted' WHERE id = $1`, [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Proforma converted to sale successfully",
      sale_id,
      invoice_number: invoiceNumber,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🔥 Convert Proforma Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;