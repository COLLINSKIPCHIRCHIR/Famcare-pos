import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CustomerAdd() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.name || !form.phone || !form.email) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5003/api/customers/add",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate("/customers/list");

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Add Customer</h2>

      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          name="name"
          placeholder="Customer Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? "Saving..." : "Add Customer"}
        </button>

      </form>
    </div>
  );
}