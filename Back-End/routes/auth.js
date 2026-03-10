const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET_KEY = "your_secret_key"; // later move to .env

// REGISTER NEW USER
router.post("/register", async (req, res) => {
    try {
        const { full_name, email, password, role } = req.body;

        const userExist = await db.query("SELECT * FROM users WHERE email=$1", [email]);
        if (userExist.rows.length > 0) return res.status(400).json({ msg: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            "INSERT INTO users (full_name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING *",
            [full_name, email, hashedPassword, role]
        );

        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// LOGIN USER
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await db.query("SELECT * FROM users WHERE email=$1", [email]);
        if (user.rows.length === 0) return res.status(400).json({ msg: "Invalid Credentials" });

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) return res.status(400).json({ msg: "Invalid Credentials" });

        const token = jwt.sign({ id: user.rows[0].id }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ token, user: { id: user.rows[0].id, full_name: user.rows[0].full_name, email: user.rows[0].email, role: user.rows[0].role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;