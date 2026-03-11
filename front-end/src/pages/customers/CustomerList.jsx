import { useEffect, useState } from "react";
import axios from "axios";

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5003/api/customers/list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers by name or phone
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Customers List</h2>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-4 py-2 rounded w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="ml-2 text-sm text-gray-400 hover:text-red-500"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {loading && <p>Loading customers...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && customers.length === 0 && (
        <p>No customers found. Add some first.</p>
      )}

      {!loading && customers.length > 0 && filtered.length === 0 && (
        <p className="text-gray-500">No customers match "<strong>{search}</strong>".</p>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">#</th>
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Phone</th>
                <th className="border px-4 py-2 text-left">Email</th>
                <th className="border px-4 py-2 text-left">Date Added</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((customer, index) => (
                <tr key={customer.id}>
                  <td className="border px-4 py-2">{index + 1}</td>
                  <td className="border px-4 py-2">{customer.name}</td>
                  <td className="border px-4 py-2">{customer.phone}</td>
                  <td className="border px-4 py-2">{customer.email}</td>
                  <td className="border px-4 py-2">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-gray-400 mt-2">
            Showing {filtered.length} of {customers.length} customers
          </p>
        </div>
      )}
    </div>
  );
}