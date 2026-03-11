import { useState, useEffect } from "react";
import axios from "axios";

export default function Customers() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", address: "", date_of_birth: "" });

  const fetchClients = async () => {
    const res = await axios.get("http://localhost:5003/clients");
    setClients(res.data);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5003/clients", form);
    setForm({ full_name: "", email: "", phone: "", address: "", date_of_birth: "" });
    fetchClients();
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5003/clients/${id}`);
    fetchClients();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Clients / Patients</h1>

      {/* Add client form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="border p-2 w-full" required />
        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border p-2 w-full" />
        <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border p-2 w-full" />
        <input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="border p-2 w-full" />
        <input type="date" placeholder="Date of Birth" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="border p-2 w-full" />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Add Client</button>
      </form>

      {/* Clients list */}
      <ul>
        {clients.map(c => (
          <li key={c.id} className="border p-2 mb-2 flex justify-between">
            <span>{c.full_name} - {c.phone}</span>
            <button onClick={() => handleDelete(c.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}