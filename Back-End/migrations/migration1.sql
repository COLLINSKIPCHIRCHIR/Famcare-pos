-- Patients module (separate from customers)

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  patient_no VARCHAR(20) UNIQUE NOT NULL,          -- e.g. FC-00001
  full_name VARCHAR(150) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(10),
  phone VARCHAR(30),
  email VARCHAR(120),
  address TEXT,
  occupation VARCHAR(100),
  next_of_kin_name VARCHAR(150),
  next_of_kin_phone VARCHAR(30),
  next_of_kin_relationship VARCHAR(50),
  insurance_provider VARCHAR(100),
  insurance_member_no VARCHAR(60),
  referring_doctor VARCHAR(150),
  referral_source VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Past conditions, surgeries, allergies, family history, etc.
CREATE TABLE IF NOT EXISTS patient_medical_history (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL,   -- condition | surgery | allergy | injury | family_history | lifestyle
  description TEXT NOT NULL,
  date_noted DATE,
  is_ongoing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- One row per treatment session / consultation
CREATE TABLE IF NOT EXISTS patient_visits (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_date TIMESTAMP NOT NULL DEFAULT NOW(),
  therapist VARCHAR(120),
  chief_complaint TEXT,
  assessment TEXT,                 -- findings: posture, ROM, strength, etc.
  diagnosis TEXT,
  treatment_given TEXT,            -- modalities: manual therapy, ultrasound, TENS, exercises...
  pain_score_before SMALLINT CHECK (pain_score_before BETWEEN 0 AND 10),
  pain_score_after  SMALLINT CHECK (pain_score_after  BETWEEN 0 AND 10),
  home_exercise_plan TEXT,
  next_visit_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Medications the patient uses / was prescribed
CREATE TABLE IF NOT EXISTS patient_medications (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id INT REFERENCES patient_visits(id) ON DELETE SET NULL,
  medication_name VARCHAR(150) NOT NULL,
  dosage VARCHAR(60),
  frequency VARCHAR(60),
  route VARCHAR(30),               -- oral, topical, injection...
  start_date DATE,
  end_date DATE,
  prescribed_by VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pmh_patient ON patient_medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_pv_patient  ON patient_visits(patient_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_pm_patient  ON patient_medications(patient_id);