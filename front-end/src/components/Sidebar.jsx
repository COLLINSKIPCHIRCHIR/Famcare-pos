import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);

  return (
    <div className="h-screen w-64 bg-gray-800 text-white flex flex-col p-4">
      <h1 className="text-xl font-bold mb-6">Famcare POS</h1>

      <nav className="flex flex-col space-y-2">

        {/* Dashboard */}
        <Link
          className="hover:bg-gray-700 px-3 py-2 rounded"
          to="/dashboard"
        >
          Dashboard
        </Link>

        {/* ================= CUSTOMERS DROPDOWN ================= */}
        <button
          className="hover:bg-gray-700 px-3 py-2 rounded text-left flex justify-between items-center"
          onClick={() => setCustomersOpen(!customersOpen)}
        >
          Customers
          <span>{customersOpen ? "▲" : "▼"}</span>
        </button>
        {customersOpen && (
          <div className="pl-4 flex flex-col space-y-1">
            <Link
              className="hover:bg-gray-600 px-3 py-1 rounded"
              to="/customers/add"
            >
              Add Customer
            </Link>
            <Link
              className="hover:bg-gray-600 px-3 py-1 rounded"
              to="/customers/list"
            >
              Customer List
            </Link>
          </div>
        )}

        {/* ================= INVENTORY DROPDOWN ================= */}
        <button
          className="hover:bg-gray-700 px-3 py-2 rounded text-left flex justify-between items-center"
          onClick={() => setInventoryOpen(!inventoryOpen)}
        >
          Inventory
          <span>{inventoryOpen ? "▲" : "▼"}</span>
        </button>
        {inventoryOpen && (
          <div className="pl-4 flex flex-col space-y-1">
            <Link
              className="hover:bg-gray-600 px-3 py-1 rounded"
              to="/inventory/add"
            >
              Add Inventory
            </Link>
            <Link
              className="hover:bg-gray-600 px-3 py-1 rounded"
              to="/inventory/list"
            >
              Inventory List
            </Link>
          </div>
        )}

        {/* ================= SALES DROPDOWN ================= */}
<button
  className="hover:bg-gray-700 px-3 py-2 rounded text-left flex justify-between items-center"
  onClick={() => setSalesOpen(!salesOpen)}
>
  Sales
  <span>{salesOpen ? "▲" : "▼"}</span>
</button>

{salesOpen && (
  <div className="pl-4 flex flex-col space-y-1">
    <Link className="hover:bg-gray-600 px-3 py-1 rounded" to="/sales/new">
      New Sale
    </Link>
    <Link className="hover:bg-gray-600 px-3 py-1 rounded" to="/sales/list">
      Sales List
    </Link>
    <Link className="hover:bg-gray-600 px-3 py-1 rounded" to="/sales/invoices">
      Invoices
    </Link>
    <Link className="hover:bg-gray-600 px-3 py-1 rounded" to="/sales/receipts">
      Receipts
    </Link>
  </div>
)}

        {/* Logout */}
        <Link
          className="hover:bg-red-600 px-3 py-2 rounded mt-4"
          to="/login"
          onClick={() => localStorage.clear()}
        >
          Logout
        </Link>
      </nav>
    </div>
  );
}