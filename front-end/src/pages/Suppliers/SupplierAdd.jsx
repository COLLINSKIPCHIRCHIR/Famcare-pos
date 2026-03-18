// src/pages/suppliers/SupplierAdd.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../utils/api";

export default function SupplierAdd() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      API.get(`/suppliers/${id}`)
        .then((res) => setForm(res.data))
        .catch(() => setError("Failed to load supplier details."));
    }
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Supplier name is required.");
    
    setLoading(true);
    try {
      if (isEdit) {
        await API.put(`/suppliers/${id}`, form);
      } else {
        await API.post("/suppliers", form);
      }
      navigate("/suppliers");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save supplier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate("/suppliers")} 
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
          >
            <span className="text-lg">←</span>
          </button>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">
            {isEdit ? "Edit Supplier Info" : "Register New Supplier"}
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Supplier Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="e.g. Bidco Africa" 
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium" 
              required 
            />
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
            <input 
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              placeholder="e.g. 0712 345 678" 
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
            <input 
              name="email" 
              type="email" 
              value={form.email} 
              onChange={handleChange} 
              placeholder="e.g. contact@supplier.com" 
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
            />
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Physical Address</label>
            <textarea 
              name="address" 
              value={form.address} 
              onChange={handleChange} 
              placeholder="e.g. Industrial Area, Nairobi" 
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-24 resize-none" 
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
              loading 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
            }`}
          >
            {loading ? "Processing..." : isEdit ? "Update Supplier" : "Save Supplier"}
          </button>
        </form>
      </div>
    </div>
  );
}