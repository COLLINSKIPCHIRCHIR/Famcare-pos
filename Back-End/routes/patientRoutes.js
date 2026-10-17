// Back-End/routes/patientRoutes.js
const express = require("express");
const router = express.Router();

// ⚠️ Match these two lines to what customerRoutes.js uses
const pool = require("../db");                       // your pg Pool
const auth = require("../middleware/authMiddleware"); // your JWT middleware

router.use(auth); // patient records must never be public

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ---------- Patients ----------
router.get("/list", wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, patient_no, full_name, phone, gender, date_of_birth, created_at
       FROM patients WHERE is_active = TRUE ORDER BY created_at DESC`
  );
  res.json(rows);
}));

router.post("/", wrap(async (req, res) => {
  const b = req.body;
  if (!b.full_name) return res.status(400).json({ message: "Full name is required" });

  // Generate FC-00001 style number
  const { rows: seq } = await pool.query(`SELECT COALESCE(MAX(id),0)+1 AS next FROM patients`);
  const patientNo = "FC-" + String(seq[0].next).padStart(5, "0");

  const { rows } = await pool.query(
    `INSERT INTO patients
      (patient_no, full_name, date_of_birth, gender, phone, email, address, occupation,
       next_of_kin_name, next_of_kin_phone, next_of_kin_relationship,
       insurance_provider, insurance_member_no, referring_doctor, referral_source, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [patientNo, b.full_name, b.date_of_birth || null, b.gender || null, b.phone || null,
     b.email || null, b.address || null, b.occupation || null,
     b.next_of_kin_name || null, b.next_of_kin_phone || null, b.next_of_kin_relationship || null,
     b.insurance_provider || null, b.insurance_member_no || null,
     b.referring_doctor || null, b.referral_source || null, b.notes || null]
  );
  res.status(201).json(rows[0]);
}));

// Full patient record in one call
router.get("/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const [p, history, visits, meds] = await Promise.all([
    pool.query(`SELECT * FROM patients WHERE id=$1`, [id]),
    pool.query(`SELECT * FROM patient_medical_history WHERE patient_id=$1 ORDER BY date_noted DESC NULLS LAST, id DESC`, [id]),
    pool.query(`SELECT * FROM patient_visits WHERE patient_id=$1 ORDER BY visit_date DESC`, [id]),
    pool.query(`SELECT * FROM patient_medications WHERE patient_id=$1 ORDER BY start_date DESC NULLS LAST, id DESC`, [id]),
  ]);
  if (!p.rows.length) return res.status(404).json({ message: "Patient not found" });
  res.json({ patient: p.rows[0], history: history.rows, visits: visits.rows, medications: meds.rows });
}));

router.put("/:id", wrap(async (req, res) => {
  const b = req.body;
  const { rows } = await pool.query(
    `UPDATE patients SET full_name=$1, date_of_birth=$2, gender=$3, phone=$4, email=$5, address=$6,
       occupation=$7, next_of_kin_name=$8, next_of_kin_phone=$9, next_of_kin_relationship=$10,
       insurance_provider=$11, insurance_member_no=$12, referring_doctor=$13, referral_source=$14, notes=$15
     WHERE id=$16 RETURNING *`,
    [b.full_name, b.date_of_birth || null, b.gender || null, b.phone || null, b.email || null,
     b.address || null, b.occupation || null, b.next_of_kin_name || null, b.next_of_kin_phone || null,
     b.next_of_kin_relationship || null, b.insurance_provider || null, b.insurance_member_no || null,
     b.referring_doctor || null, b.referral_source || null, b.notes || null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: "Patient not found" });
  res.json(rows[0]);
}));

// ---------- Medical history ----------
router.post("/:id/history", wrap(async (req, res) => {
  const { category, description, date_noted, is_ongoing } = req.body;
  if (!category || !description) return res.status(400).json({ message: "Category and description required" });
  const { rows } = await pool.query(
    `INSERT INTO patient_medical_history (patient_id, category, description, date_noted, is_ongoing)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.id, category, description, date_noted || null, !!is_ongoing]
  );
  res.status(201).json(rows[0]);
}));

router.delete("/history/:historyId", wrap(async (req, res) => {
  await pool.query(`DELETE FROM patient_medical_history WHERE id=$1`, [req.params.historyId]);
  res.json({ message: "Deleted" });
}));

// ---------- Visits ----------
router.post("/:id/visits", wrap(async (req, res) => {
  const b = req.body;
  const { rows } = await pool.query(
    `INSERT INTO patient_visits
      (patient_id, visit_date, therapist, chief_complaint, assessment, diagnosis, treatment_given,
       pain_score_before, pain_score_after, home_exercise_plan, next_visit_date, notes)
     VALUES ($1, COALESCE($2, NOW()), $3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [req.params.id, b.visit_date || null, b.therapist || null, b.chief_complaint || null,
     b.assessment || null, b.diagnosis || null, b.treatment_given || null,
     b.pain_score_before ?? null, b.pain_score_after ?? null,
     b.home_exercise_plan || null, b.next_visit_date || null, b.notes || null]
  );
  res.status(201).json(rows[0]);
}));

// ---------- Medications ----------
router.post("/:id/medications", wrap(async (req, res) => {
  const b = req.body;
  if (!b.medication_name) return res.status(400).json({ message: "Medication name required" });
  const { rows } = await pool.query(
    `INSERT INTO patient_medications
      (patient_id, visit_id, medication_name, dosage, frequency, route, start_date, end_date, prescribed_by, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.params.id, b.visit_id || null, b.medication_name, b.dosage || null, b.frequency || null,
     b.route || null, b.start_date || null, b.end_date || null, b.prescribed_by || null, b.notes || null]
  );
  res.status(201).json(rows[0]);
}));

router.delete("/medications/:medId", wrap(async (req, res) => {
  await pool.query(`DELETE FROM patient_medications WHERE id=$1`, [req.params.medId]);
  res.json({ message: "Deleted" });
}));

// ---------- Delete patient (soft delete: record is archived, not destroyed) ----------
router.delete("/:id", wrap(async (req, res) => {
  const { rowCount } = await pool.query(`UPDATE patients SET is_active = FALSE WHERE id=$1`, [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: "Patient not found" });
  res.json({ message: "Patient archived" });
}));

// ---------- Edit / delete visits ----------
router.put("/visits/:visitId", wrap(async (req, res) => {
  const b = req.body;
  const { rows } = await pool.query(
    `UPDATE patient_visits SET visit_date=COALESCE($1, visit_date), therapist=$2, chief_complaint=$3,
       assessment=$4, diagnosis=$5, treatment_given=$6, pain_score_before=$7, pain_score_after=$8,
       home_exercise_plan=$9, next_visit_date=$10, notes=$11
     WHERE id=$12 RETURNING *`,
    [b.visit_date || null, b.therapist || null, b.chief_complaint || null, b.assessment || null,
     b.diagnosis || null, b.treatment_given || null,
     b.pain_score_before === "" ? null : b.pain_score_before ?? null,
     b.pain_score_after === "" ? null : b.pain_score_after ?? null,
     b.home_exercise_plan || null, b.next_visit_date || null, b.notes || null, req.params.visitId]
  );
  if (!rows.length) return res.status(404).json({ message: "Visit not found" });
  res.json(rows[0]);
}));

router.delete("/visits/:visitId", wrap(async (req, res) => {
  await pool.query(`DELETE FROM patient_visits WHERE id=$1`, [req.params.visitId]);
  res.json({ message: "Deleted" });
}));

// ---------- Edit history ----------
router.put("/history/:historyId", wrap(async (req, res) => {
  const { category, description, date_noted, is_ongoing } = req.body;
  if (!category || !description) return res.status(400).json({ message: "Category and description required" });
  const { rows } = await pool.query(
    `UPDATE patient_medical_history SET category=$1, description=$2, date_noted=$3, is_ongoing=$4
     WHERE id=$5 RETURNING *`,
    [category, description, date_noted || null, !!is_ongoing, req.params.historyId]
  );
  if (!rows.length) return res.status(404).json({ message: "Record not found" });
  res.json(rows[0]);
}));

// ---------- Edit medications ----------
router.put("/medications/:medId", wrap(async (req, res) => {
  const b = req.body;
  if (!b.medication_name) return res.status(400).json({ message: "Medication name required" });
  const { rows } = await pool.query(
    `UPDATE patient_medications SET medication_name=$1, dosage=$2, frequency=$3, route=$4,
       start_date=$5, end_date=$6, prescribed_by=$7, notes=$8
     WHERE id=$9 RETURNING *`,
    [b.medication_name, b.dosage || null, b.frequency || null, b.route || null,
     b.start_date || null, b.end_date || null, b.prescribed_by || null, b.notes || null, req.params.medId]
  );
  if (!rows.length) return res.status(404).json({ message: "Medication not found" });
  res.json(rows[0]);
}));

module.exports = router;