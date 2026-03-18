// src/pages/customers/Customers.jsx
import { useState, useEffect } from "react";
import API from "../../utils/api";

export default function Customers() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ 
    full_name: "", 
    email: "", 
    phone: "", 
    address: "", 
    date_of_birth: "" 
  });

  const fetchClients = async () => {
    try {
      const res = await API.get("/clients");
      setClients(res.data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/clients", form);
      setForm({ full_name: "", email: "", phone: "", address: "", date_of_birth: "" });
      fetchClients();
    } catch (err) {
      console.error("Error adding client:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this client?")) {
      try {
        await API.delete(`/clients/${id}`);
        fetchClients();
      } catch (err) {
        console.error("Error deleting client:", err);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Clients & Patients</h1>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
          Total: {clients.length}
        </span>
      </div>

      {/* Add client form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Registration Form</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input 
            placeholder="Full Name" 
            value={form.full_name} 
            onChange={e => setForm({...form, full_name: e.target.value})} 
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            required 
          />
          <input 
            placeholder="Email Address" 
            type="email"
            value={form.email} 
            onChange={e => setForm({...form, email: e.target.value})} 
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          />
          <input 
            placeholder="Phone Number" 
            value={form.phone} 
            onChange={e => setForm({...form, phone: e.target.value})} 
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          />
          <input 
            placeholder="Physical Address" 
            value={form.address} 
            onChange={e => setForm({...form, address: e.target.value})} 
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          />
          <div className="flex flex-col">
            <input 
              type="date" 
              value={form.date_of_birth} 
              onChange={e => setForm({...form, date_of_birth: e.target.value})} 
              className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-500" 
            />
          </div>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm"
          >
            Register Client
          </button>
        </form>
      </div>

      {/* Clients list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Client Info</th>
              <th className="p-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Contact</th>
              <th className="p-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Address</th>
              <th className="p-4 text-[11px] font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="4" className="p-10 text-center text-gray-400 italic">Loading database...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan="4" className="p-10 text-center text-gray-400 italic">No clients registered in the system.</td></tr>
            ) : (
              clients.map(c => (
                <tr key={c.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{c.full_name}</div>
                    <div className="text-[10px] text-gray-400">DOB: {c.date_of_birth || 'N/A'}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-700">{c.phone || 'No Phone'}</div>
                    <div className="text-xs text-blue-500 underline">{c.email || ''}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 italic">
                    {c.address || 'No address provided'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(c.id)} 
                      className="text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-tighter transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}