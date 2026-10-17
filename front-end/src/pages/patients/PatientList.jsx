// front-end/src/pages/patients/PatientList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../utils/api";

const empty = {
  full_name: "", date_of_birth: "", gender: "", phone: "", email: "", address: "", occupation: "",
  next_of_kin_name: "", next_of_kin_phone: "", next_of_kin_relationship: "",
  insurance_provider: "", insurance_member_no: "", referring_doctor: "", referral_source: "", notes: "",
};

const field = "w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/patients/list");
      setPatients(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await API.post("/patients", form);
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save patient");
    } finally {
      setSaving(false);
    }
  };

  const q = search.toLowerCase();
  const filtered = patients.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.patient_no?.toLowerCase().includes(q)
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Patients</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
          {showForm ? "Close" : "+ New Patient"}
        </button>
      </div>

      {error && <p className="p-3 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <input className={field} placeholder="Full name *" value={form.full_name} onChange={set("full_name")} required />
          <input className={field} type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
          <select className={field} value={form.gender} onChange={set("gender")}>
            <option value="">Gender</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
          <input className={field} placeholder="Phone" value={form.phone} onChange={set("phone")} />
          <input className={field} placeholder="Email" value={form.email} onChange={set("email")} />
          <input className={field} placeholder="Occupation" value={form.occupation} onChange={set("occupation")} />
          <input className={field} placeholder="Address" value={form.address} onChange={set("address")} />
          <input className={field} placeholder="Referring doctor" value={form.referring_doctor} onChange={set("referring_doctor")} />
          <input className={field} placeholder="Referral source" value={form.referral_source} onChange={set("referral_source")} />
          <input className={field} placeholder="Next of kin name" value={form.next_of_kin_name} onChange={set("next_of_kin_name")} />
          <input className={field} placeholder="Next of kin phone" value={form.next_of_kin_phone} onChange={set("next_of_kin_phone")} />
          <input className={field} placeholder="Relationship" value={form.next_of_kin_relationship} onChange={set("next_of_kin_relationship")} />
          <input className={field} placeholder="Insurance provider" value={form.insurance_provider} onChange={set("insurance_provider")} />
          <input className={field} placeholder="Insurance member no." value={form.insurance_member_no} onChange={set("insurance_member_no")} />
          <textarea className={field + " md:col-span-3"} placeholder="Notes" rows="2" value={form.notes} onChange={set("notes")} />
          <button disabled={saving} className="md:col-span-3 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Patient"}
          </button>
        </form>
      )}

      <input
        className={field + " max-w-sm mb-4"}
        placeholder="Search by name, phone or patient no..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-center py-10 text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="p-4">Patient No</th><th className="p-4">Name</th>
                <th className="p-4">Phone</th><th className="p-4">Gender</th><th className="p-4">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">No patients found.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/20">
                    <td className="p-4 text-sm text-gray-500">{p.patient_no}</td>
                    <td className="p-4 font-bold">
                      <Link to={`/patients/${p.id}`} className="text-blue-600 hover:underline">{p.full_name}</Link>
                    </td>
                    <td className="p-4 text-sm">{p.phone || "—"}</td>
                    <td className="p-4 text-sm">{p.gender || "—"}</td>
                    <td className="p-4 text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString("en-GB")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}