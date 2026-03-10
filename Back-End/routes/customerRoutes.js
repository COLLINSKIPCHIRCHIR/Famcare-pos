const express = require("express");
const pool = require("../db");

const router = express.Router();

// Add Customer
router.post("/add", async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    const newCustomer = await pool.query(
      "INSERT INTO customers (name, phone, email) VALUES ($1, $2, $3) RETURNING *",
      [name, phone, email]
    );

    res.json(newCustomer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Customers
router.get("/list", async (req, res) => {
  try {
    const customers = await pool.query(
      "SELECT * FROM customers ORDER BY created_at DESC"
    );

    res.json(customers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;