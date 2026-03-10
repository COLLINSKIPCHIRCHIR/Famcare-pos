import { Link, Outlet } from "react-router-dom";
import { useState } from "react";

export default function DashboardLayout() {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);
  // Add state at top
const [salesOpen, setSalesOpen] = useState(false);

  return (
    <div className="flex min-h-screen">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-6">
        <h1 className="text-2xl font-bold mb-6">Famcare POS</h1>

        <nav className="flex flex-col gap-2">

          {/* Dashboard */}
          <Link to="/dashboard" className="hover:bg-gray-700 px-3 py-2 rounded">
            Dashboard
          </Link>

          {/* Customers Dropdown */}
          <div>
            <button
              onClick={() => setCustomersOpen(!customersOpen)}
              className="hover:bg-gray-700 px-3 py-2 w-full text-left rounded flex justify-between items-center"
            >
              Customers
              <span>{customersOpen ? "▲" : "▼"}</span>
            </button>

            {customersOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/customers/add" className="hover:bg-gray-600 px-3 py-2 rounded">
                  Add Customer
                </Link>
                <Link to="/customers/list" className="hover:bg-gray-600 px-3 py-2 rounded">
                  Customers List
                </Link>
              </div>
            )}
          </div>

          {/* Inventory Dropdown */}
          <div>
            <button
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className="hover:bg-gray-700 px-3 py-2 w-full text-left rounded flex justify-between items-center"
            >
              Inventory
              <span>{inventoryOpen ? "▲" : "▼"}</span>
            </button>

            {inventoryOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/inventory/add" className="hover:bg-gray-600 px-3 py-2 rounded">
                  Add Inventory
                </Link>
                <Link to="/inventory/list" className="hover:bg-gray-600 px-3 py-2 rounded">
                  Inventory List
                </Link>
              </div>
            )}
          </div>

{/* Sales Dropdown */}
<div>
  <button
    onClick={() => setSalesOpen(!salesOpen)}
    className="hover:bg-gray-700 px-3 py-2 w-full text-left rounded flex justify-between items-center"
  >
    Sales
    <span>{salesOpen ? "▲" : "▼"}</span>
  </button>

  {salesOpen && (
    <div className="flex flex-col ml-2 mt-1 space-y-1">
      <Link to="/sales/new" className="hover:bg-gray-600 px-3 py-2 rounded">
        New Sale
      </Link>
      <Link to="/sales/list" className="hover:bg-gray-600 px-3 py-2 rounded">
        Sales List
      </Link>
      <Link to="/sales/invoices" className="hover:bg-gray-600 px-3 py-2 rounded">
        Invoices
      </Link>
      <Link to="/sales/receipts" className="hover:bg-gray-600 px-3 py-2 rounded">
        Receipts
      </Link>
    </div>
  )}
</div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-100 p-6">
        <Outlet />
      </main>
    </div>
  );
}