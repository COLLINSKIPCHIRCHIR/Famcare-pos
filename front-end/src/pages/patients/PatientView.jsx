// front-end/src/pages/patients/PatientView.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../../utils/api";

const input = "w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20";
const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
const toDate = (d) => { if (!d) return ""; const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
const toDateTime = (d) => { if (!d) return ""; const x = new Date(d); return `${toDate(d)}T${pad(x.getHours())}:${pad(x.getMinutes())}`; };

const TABS = ["Visits", "Medical History", "Medications"];
const PATH = { Visits: "visits", "Medical History": "history", Medications: "medications" };

// type: text | date | datetime | number | textarea | select | checkbox ; span: 2 = full width
const PATIENT_FIELDS = [
  { k: "full_name", label: "Full name *", required: true },
  { k: "date_of_birth", label: "Date of birth", type: "date" },
  { k: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
  { k: "phone", label: "Phone" }, { k: "email", label: "Email" }, { k: "occupation", label: "Occupation" },
  { k: "address", label: "Address" }, { k: "referring_doctor", label: "Referring doctor" }, { k: "referral_source", label: "Referral source" },
  { k: "next_of_kin_name", label: "Next of kin name" }, { k: "next_of_kin_phone", label: "Next of kin phone" },
  { k: "next_of_kin_relationship", label: "Relationship" },
  { k: "insurance_provider", label: "Insurance provider" }, { k: "insurance_member_no", label: "Insurance member no." },
  { k: "notes", label: "Notes", type: "textarea", span: 3 },
];
const VISIT_FIELDS = [
  { k: "therapist", label: "Therapist" }, { k: "visit_date", label: "Visit date/time", type: "datetime" },
  { k: "chief_complaint", label: "Chief complaint", type: "textarea", span: 2 },
  { k: "assessment", label: "Assessment findings", type: "textarea" }, { k: "diagnosis", label: "Diagnosis", type: "textarea" },
  { k: "treatment_given", label: "Treatment given", type: "textarea", span: 2 },
  { k: "pain_score_before", label: "Pain before (0-10)", type: "number" }, { k: "pain_score_after", label: "Pain after (0-10)", type: "number" },
  { k: "home_exercise_plan", label: "Home exercise plan", type: "textarea", span: 2 },
  { k: "next_visit_date", label: "Next visit", type: "date" },
];
const HISTORY_FIELDS = [
  { k: "category", label: "Category *", type: "select", required: true,
    options: ["condition", "surgery", "allergy", "injury", "family_history", "lifestyle"] },
  { k: "date_noted", label: "Date", type: "date" },
  { k: "description", label: "Description *", type: "textarea", span: 2, required: true },
  { k: "is_ongoing", label: "Ongoing", type: "checkbox" },
];
const MED_FIELDS = [
  { k: "medication_name", label: "Medication name *", required: true }, { k: "dosage", label: "Dosage (e.g. 500mg)" },
  { k: "frequency", label: "Frequency (e.g. twice daily)" }, { k: "route", label: "Route (oral, topical...)" },
  { k: "start_date", label: "Start date", type: "date" }, { k: "end_date", label: "End date", type: "date" },
  { k: "prescribed_by", label: "Prescribed by" }, { k: "notes", label: "Notes" },
];
const FIELDS = { Visits: VISIT_FIELDS, "Medical History": HISTORY_FIELDS, Medications: MED_FIELDS };

// Convert a DB record into form values (dates formatted for inputs)
const toForm = (fields, rec) => {
  const out = {};
  fields.forEach(({ k, type }) => {
    const v = rec[k];
    out[k] = type === "date" ? toDate(v) : type === "datetime" ? toDateTime(v) : v ?? (type === "checkbox" ? false : "");
  });
  return out;
};

function Fields({ fields, form, setForm, cols }) {
  return (
    <div className={`grid grid-cols-1 gap-3 ${cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
      {fields.map((f) => {
        const common = {
          className: input, required: f.required,
          value: form[f.k] ?? "",
          onChange: (e) => setForm({ ...form, [f.k]: e.target.value }),
        };
        const span = f.span === 3 ? "md:col-span-3" : f.span === 2 ? "md:col-span-2" : "";
        return (
          <label key={f.k} className={`text-xs text-gray-500 ${span}`}>
            {f.type !== "checkbox" && f.label}
            {f.type === "textarea" ? <textarea rows="2" {...common} />
              : f.type === "select" ? (
                <select {...common}><option value="">Select</option>
                  {f.options.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}</select>)
              : f.type === "checkbox" ? (
                <span className="flex items-center gap-2 text-sm mt-6">
                  <input type="checkbox" checked={!!form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.checked })} /> {f.label}
                </span>)
              : <input type={f.type === "datetime" ? "datetime-local" : f.type || "text"}
                  {...(f.type === "number" ? { min: 0, max: 10 } : {})} {...common} />}
          </label>
        );
      })}
    </div>
  );
}

export default function PatientView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("Visits");
  const [error, setError] = useState("");

  const [editingPatient, setEditingPatient] = useState(false);
  const [patientForm, setPatientForm] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null); // null = adding, number = editing that record
  const [form, setForm] = useState({});

  const load = async () => {
    try {
      const res = await API.get(`/patients/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load patient");
    }
  };
  useEffect(() => { load(); }, [id]);

  const switchTab = (t) => { setTab(t); setShowForm(false); setEditId(null); setForm({}); setError(""); };

  // ----- Patient edit / delete -----
  const startPatientEdit = () => { setPatientForm(toForm(PATIENT_FIELDS, data.patient)); setEditingPatient(true); };
  const savePatient = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/patients/${id}`, patientForm);
      setEditingPatient(false);
      load();
    } catch (err) { setError(err.response?.data?.message || "Failed to update patient"); }
  };
  const deletePatient = async () => {
    if (!window.confirm(`Archive ${data.patient.full_name}? They will be removed from the patient list.`)) return;
    try {
      await API.delete(`/patients/${id}`);
      navigate("/patients/list");
    } catch (err) { setError(err.response?.data?.message || "Failed to delete patient"); }
  };

  // ----- Record add / edit / delete -----
  const startAdd = () => { setEditId(null); setForm({}); setShowForm(!showForm); };
  const startEdit = (rec) => { setEditId(rec.id); setForm(toForm(FIELDS[tab], rec)); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editId) await API.put(`/patients/${PATH[tab]}/${editId}`, form);
      else await API.post(`/patients/${id}/${PATH[tab]}`, form);
      setForm({}); setEditId(null); setShowForm(false); setError("");
      load();
    } catch (err) { setError(err.response?.data?.message || "Failed to save"); }
  };
  const remove = async (rec) => {
    if (!window.confirm("Delete this record?")) return;
    try { await API.delete(`/patients/${PATH[tab]}/${rec.id}`); load(); }
    catch (err) { setError(err.response?.data?.message || "Failed to delete"); }
  };

  if (error && !data) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-gray-400">Loading...</p>;
  const { patient: p, visits, history, medications } = data;

  const Actions = ({ rec }) => (
    <div className="flex gap-3 shrink-0 text-xs">
      <button onClick={() => startEdit(rec)} className="text-blue-600 font-bold">Edit</button>
      <button onClick={() => remove(rec)} className="text-red-500 font-bold">Delete</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link to="/patients/list" className="text-sm text-blue-600">← Back to patients</Link>

      {/* Summary */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-2xl font-bold text-gray-800">{p.full_name} <span className="text-sm text-gray-400">{p.patient_no}</span></h2>
          {!editingPatient && (
            <div className="flex gap-2">
              <button onClick={startPatientEdit} className="px-3 py-1.5 text-sm font-bold rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50">Edit Patient</button>
              <button onClick={deletePatient} className="px-3 py-1.5 text-sm font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
            </div>
          )}
        </div>

        {error && <p className="p-2 bg-red-50 text-red-600 text-sm rounded mt-3">{error}</p>}

        {editingPatient ? (
          <form onSubmit={savePatient} className="mt-4 space-y-3">
            <Fields fields={PATIENT_FIELDS} form={patientForm} setForm={setPatientForm} cols={3} />
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold text-sm">Save Changes</button>
              <button type="button" onClick={() => setEditingPatient(false)} className="px-5 py-2 rounded-lg border text-sm">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div><p className="text-gray-400 text-xs">DOB</p>{fmt(p.date_of_birth)}</div>
            <div><p className="text-gray-400 text-xs">Gender</p>{p.gender || "—"}</div>
            <div><p className="text-gray-400 text-xs">Phone</p>{p.phone || "—"}</div>
            <div><p className="text-gray-400 text-xs">Occupation</p>{p.occupation || "—"}</div>
            <div><p className="text-gray-400 text-xs">Next of kin</p>{p.next_of_kin_name || "—"} {p.next_of_kin_phone}</div>
            <div><p className="text-gray-400 text-xs">Insurance</p>{p.insurance_provider || "—"} {p.insurance_member_no}</div>
            <div><p className="text-gray-400 text-xs">Referred by</p>{p.referring_doctor || "—"}</div>
            <div><p className="text-gray-400 text-xs">Allergies</p>
              {history.filter((h) => h.category === "allergy").map((h) => h.description).join(", ") || "None recorded"}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex gap-2 mb-4 border-b pb-2 flex-wrap">
          {TABS.map((t) => (
            <button key={t} onClick={() => switchTab(t)}
              className={`px-4 py-2 text-sm font-bold rounded-lg ${tab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              {t}
            </button>
          ))}
          <button onClick={startAdd} className="ml-auto text-sm font-bold text-green-600">
            {showForm && !editId ? "Cancel" : "+ Add"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="mb-6 p-4 bg-gray-50 rounded-xl space-y-3">
            <p className="text-sm font-bold text-gray-600">{editId ? "Edit record" : "New record"}</p>
            <Fields fields={FIELDS[tab]} form={form} setForm={setForm} />
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold text-sm">{editId ? "Update" : "Save"}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm({}); }} className="px-5 py-2 rounded-lg border text-sm">Cancel</button>
            </div>
          </form>
        )}

        {tab === "Visits" && (visits.length === 0 ? <p className="text-gray-400 italic">No visits yet.</p> :
          visits.map((v) => (
            <div key={v.id} className="border-b py-3 text-sm flex justify-between gap-4">
              <div>
                <p className="font-bold">{fmt(v.visit_date)} <span className="font-normal text-gray-400">· {v.therapist || "—"}</span></p>
                <p><b>Complaint:</b> {v.chief_complaint || "—"}</p>
                <p><b>Diagnosis:</b> {v.diagnosis || "—"}</p>
                <p><b>Treatment:</b> {v.treatment_given || "—"}</p>
                <p><b>Pain:</b> {v.pain_score_before ?? "—"} → {v.pain_score_after ?? "—"}</p>
                {v.next_visit_date && <p><b>Next visit:</b> {fmt(v.next_visit_date)}</p>}
              </div>
              <Actions rec={v} />
            </div>
          )))}

        {tab === "Medical History" && (history.length === 0 ? <p className="text-gray-400 italic">Nothing recorded.</p> :
          history.map((h) => (
            <div key={h.id} className="border-b py-3 text-sm flex justify-between gap-4">
              <div>
                <span className="uppercase text-xs font-bold text-blue-600">{h.category.replace("_", " ")}</span>{" "}
                {h.is_ongoing && <span className="text-xs text-orange-500">(ongoing)</span>}
                <p>{h.description}</p><p className="text-gray-400 text-xs">{fmt(h.date_noted)}</p>
              </div>
              <Actions rec={h} />
            </div>
          )))}

        {tab === "Medications" && (medications.length === 0 ? <p className="text-gray-400 italic">No medications recorded.</p> :
          medications.map((m) => (
            <div key={m.id} className="border-b py-3 text-sm flex justify-between gap-4">
              <div>
                <p className="font-bold">{m.medication_name} <span className="font-normal text-gray-500">{m.dosage} {m.frequency} {m.route && `· ${m.route}`}</span></p>
                <p className="text-gray-400 text-xs">{fmt(m.start_date)} → {m.end_date ? fmt(m.end_date) : "ongoing"} · {m.prescribed_by || "—"}</p>
                {m.notes && <p>{m.notes}</p>}
              </div>
              <Actions rec={m} />
            </div>
          )))}
      </div>
    </div>
  );
}