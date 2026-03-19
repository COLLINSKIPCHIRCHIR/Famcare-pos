import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import useRole from "../utils/useRole";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useRole();

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [purchasesOpen, setPurchasesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
const [expensesOpen, setExpensesOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-blue-900 text-white p-5 space-y-4 z-30
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex md:flex-col
      `}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Famcare POS</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white text-2xl font-bold hover:text-red-300"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col space-y-3 flex-1 overflow-y-auto">

          {/* Dashboard */}
          <Link
            to="/dashboard"
            onClick={handleNavClick}
            className="hover:bg-blue-700 p-2 rounded"
          >
            🏠 Dashboard
          </Link>

          {/* Customers Dropdown */}
          <div>
            <button
              onClick={() => setCustomersOpen(!customersOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center"
            >
              👥 Customers
              <span>{customersOpen ? "▲" : "▼"}</span>
            </button>
            {customersOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/customers/add" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Add Customer</Link>
                <Link to="/customers/list" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Customer List</Link>
              </div>
            )}
          </div>

          {/* Inventory Dropdown */}
          <div>
            <button
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center"
            >
              📦 Inventory
              <span>{inventoryOpen ? "▲" : "▼"}</span>
            </button>
            {inventoryOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/inventory/add" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Add Inventory</Link>
                <Link to="/inventory/list" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Inventory List</Link>
                <Link to="/stock/stockMovements" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Stock Movements</Link>
              </div>
            )}
          </div>

          {/* Sales Dropdown */}
          <div>
            <button
              onClick={() => setSalesOpen(!salesOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center"
            >
              🧾 Sales
              <span>{salesOpen ? "▲" : "▼"}</span>
            </button>
            {salesOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/sales/new" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">New Sale</Link>
                <Link to="/sales/list" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Sales List</Link>
                <Link to="/sales/invoices" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Invoices</Link>
                <Link to="/sales/receipts" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Receipts</Link>
                <Link to="/proforma/list" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Proforma Invoices</Link>
                <Link to="/delivery-notes/list" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Delivery Notes</Link>
                <Link to="/credit-notes/list" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Credit Notes</Link>
              </div>
            )}
          </div>

          {/* Suppliers Dropdown */}
          <div>
            <button
              onClick={() => setSuppliersOpen(!suppliersOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center"
            >
              🏭 Suppliers
              <span>{suppliersOpen ? "▲" : "▼"}</span>
            </button>
            {suppliersOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/suppliers/add" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Add Supplier</Link>
                <Link to="/suppliers/list" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Supplier List</Link>
              </div>
            )}
          </div>

          {/* Purchases Dropdown */}
          <div>
            <button
              onClick={() => setPurchasesOpen(!purchasesOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center"
            >
              🛒 Purchases
              <span>{purchasesOpen ? "▲" : "▼"}</span>
            </button>
            {purchasesOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/purchases/new" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">New Purchase</Link>
                <Link to="/purchases/list" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Purchase List</Link>
              </div>
            )}
          </div>
          <div>
            <button onClick={() => setExpensesOpen(!expensesOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center">
              💸 Expenses <span>{expensesOpen ? "▲" : "▼"}</span>
            </button>
            {expensesOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/expenses/add" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Add Expense</Link>
                <Link to="/expenses/list" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Expense List</Link>
              </div>
            )}
          </div>

          <div>
            <button onClick={() => setReportsOpen(!reportsOpen)}
              className="hover:bg-blue-700 p-2 w-full text-left rounded flex justify-between items-center">
              📊 Reports <span>{reportsOpen ? "▲" : "▼"}</span>
            </button>
            {reportsOpen && (
              <div className="flex flex-col ml-2 mt-1 space-y-1">
                <Link to="/reports/pl" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">P&L Report</Link>
                <Link to="/reports/vat" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">VAT Report</Link>
                <Link to="/receivables" onClick={handleNavClick} className="hover:bg-blue-600 p-2 rounded">Accounts Receivable</Link>
              </div>
            )}
          </div>

          {/* Admin Only — Create User */}
          {isAdmin && (
            <Link
              to="/users/create"
              onClick={handleNavClick}
              className="hover:bg-blue-700 p-2 rounded"
            >
              👤 Create User
            </Link>
          )}

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
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile Top Bar */}
        <div className="md:hidden bg-blue-900 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-bold">Famcare POS</h2>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white text-2xl font-bold focus:outline-none"
          >
            ☰
          </button>
        </div>

        <div className="flex-1 p-4 md:p-6 bg-gray-100 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}