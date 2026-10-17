const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const SECRET_KEY = process.env.JWT_SECRET;

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// In-memory OTP store (use Redis in production)
const otpStore = {};

// ─── REGISTER NEW USER ───────────────────────────────────────────────
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

// ─── LOGIN USER ──────────────────────────────────────────────────────
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

// ─── STEP 1: SEND OTP ────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const result = await db.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(404).json({ message: "No account found with that email" });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore[email] = { otp, expiresAt };

    await transporter.sendMail({
      from: `"Your POS System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1a1a2e; margin-bottom: 8px;">Password Reset</h2>
          <p style="color: #555; margin-bottom: 24px;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #2563eb; text-align: center; padding: 20px; background: #f0f7ff; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #aaa; font-size: 12px; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// ─── STEP 2: VERIFY OTP ──────────────────────────────────────────────
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ message: "No OTP requested for this email" });
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }
  if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

  otpStore[email].verified = true;
  res.json({ message: "OTP verified" });
});

// ─── STEP 3: RESET PASSWORD ──────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ message: "Email and new password are required" });

  const record = otpStore[email];
  if (!record || !record.verified) return res.status(403).json({ message: "OTP not verified" });

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password=$1 WHERE email=$2", [hashed, email]);
    delete otpStore[email];
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;