import pool from "../config/db.js";

export const completeSale = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cart, payment_method } = req.body;

    await client.query("BEGIN");

    // Calculate total
    const total = cart.reduce(
      (sum, item) => sum + item.quantity * item.selling_price,
      0
    );

    // 1️⃣ Insert into sales table
    const saleResult = await client.query(
      `INSERT INTO sales (total, payment_method)
       VALUES ($1, $2)
       RETURNING id`,
      [total, payment_method]
    );

    const saleId = saleResult.rows[0].id;

    // 2️⃣ Insert into sales_items + reduce inventory
    for (const item of cart) {
      // Insert item
      await client.query(
        `INSERT INTO sales_items (sale_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [saleId, item.id, item.quantity, item.selling_price]
      );

      // Reduce stock
      await client.query(
        `UPDATE inventory
         SET quantity = quantity - $1
         WHERE id = $2`,
        [item.quantity, item.id]
      );
    }

    await client.query("COMMIT");

    res.json({ message: "Sale completed successfully", saleId });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Sale failed" });
  } finally {
    client.release();
  }
};