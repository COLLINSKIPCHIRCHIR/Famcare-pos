import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Layout({ children }) {
  const navigate = useNavigate();
  
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [purchasesOpen, setPurchasesOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">

      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white p-5 space-y-4">

        <h2 className="text-2xl font-bold mb-6">Famcare POS</h2>

        <nav className="flex flex-col space-y-3">

          {/* Dashboard */}
          <Link to="/dashboard" className="hover:bg-blue-700 p-2 rounded">
            Dashboard
          </Link>

          {/* Customers Dropdown */}
          <div>
            <button
              onClick={() => setCustomersOpen(!customersOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center"
            >
              Customers
              <span>{customersOpen ? "▲" : "▼"}</span>
            </button>
            {customersOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/customers/add" className="hover:bg-blue-600 p-2 rounded">Add Customer</Link>
                <Link to="/customers/list" className="hover:bg-blue-600 p-2 rounded">Customer List</Link>
              </div>
            )}
          </div>

          {/* Inventory Dropdown */}
          <div>
            <button
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center"
            >
              Inventory
              <span>{inventoryOpen ? "▲" : "▼"}</span>
            </button>
            {inventoryOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/inventory/add" className="hover:bg-blue-600 p-2 rounded">Add Inventory</Link>
                <Link to="/inventory/list" className="hover:bg-blue-600 p-2 rounded">Inventory List</Link>
                <Link to="/stock/stockMovements" className="hover:bg-blue-600 p-2 rounded">Stock Movements</Link>
              </div>
            )}
          </div>

          {/* Sales Dropdown */}
          <div>
            <button
              onClick={() => setSalesOpen(!salesOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center"
            >
              Sales
              <span>{salesOpen ? "▲" : "▼"}</span>
            </button>
            {salesOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/sales/new" className="hover:bg-blue-600 p-2 rounded">New Sale</Link>
                <Link to="/sales/list" className="hover:bg-blue-600 p-2 rounded">Sales List</Link>
                <Link to="/sales/invoices" className="hover:bg-blue-600 p-2 rounded">Invoices</Link>
                <Link to="/sales/receipts" className="hover:bg-blue-600 p-2 rounded">Receipts</Link>
              </div>
            )}
          </div>

          {/* Suppliers Dropdown */}
          <div>
            <button
              onClick={() => setSuppliersOpen(!suppliersOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center"
            >
              Suppliers
              <span>{suppliersOpen ? "▲" : "▼"}</span>
            </button>
            {suppliersOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/suppliers/add" className="hover:bg-blue-600 p-2 rounded">Add Supplier</Link>
                <Link to="/suppliers/list" className="hover:bg-blue-600 p-2 rounded">Supplier List</Link>
              </div>
            )}
          </div>

          {/* Purchases Dropdown */}
          <div>
            <button
              onClick={() => setPurchasesOpen(!purchasesOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center"
            >
              Purchases
              <span>{purchasesOpen ? "▲" : "▼"}</span>
            </button>
            {purchasesOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/purchases/new" className="hover:bg-blue-600 p-2 rounded">New Purchase</Link>
                <Link to="/purchases/list" className="hover:bg-blue-600 p-2 rounded">Purchase List</Link>
              </div>
            )}
          </div>

        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-10 bg-red-500 w-full py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        {children}
      </div>
    </div>
  );
}