import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import ReceiptsList from "./pages/sales/ReceiptsList";
import ReceiptPage from "./pages/sales/ReceiptPage";
import StockMovements from "./pages/Stock/StockMovements";
// ================= SALES PAGES =================
import NewSale from "./pages/sales/NewSale";
import SalesList from "./pages/sales/SalesList";
import InvoicesList from "./pages/sales/InvoicesList";
import InvoicePage from "./pages/sales/InvoicePage";

// ================= INVENTORY PAGES =================
import InventoryAdd from "./pages/inventory/InventoryAdd";
import InventoryList from "./pages/inventory/InventoryList";

// ================= CUSTOMER PAGES =================
import CustomerAdd from "./pages/customers/CustomerAdd";
import CustomerList from "./pages/customers/CustomerList";

// ================= SUPPLIER PAGES =================
import SupplierAdd from "./pages/Suppliers/SupplierAdd";
import SuppliersList from "./pages/Suppliers/SupplierList";

// ================= PURCHASE PAGES =================
import PurchaseAdd from "./pages/Purchases/PurchaseAdd";
import PurchaseList from "./pages/Purchases/PurchaseList";

// ================= USER PAGES =================
import CreateUser from "./pages/CreateUser";

// ================= AUTH PAGES =================
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/dashboard"
          element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>}
        />

        {/* ================= SALES ================= */}
        <Route path="/sales" element={<Navigate to="/sales/list" />} />

        <Route path="/sales/new" element={<ProtectedRoute><Layout><NewSale /></Layout></ProtectedRoute>} />
        <Route path="/sales/list" element={<ProtectedRoute><Layout><SalesList /></Layout></ProtectedRoute>} />
        <Route path="/sales/invoices" element={<ProtectedRoute><Layout><InvoicesList /></Layout></ProtectedRoute>} />
        <Route path="/sales/invoice/:id" element={<ProtectedRoute><Layout><InvoicePage /></Layout></ProtectedRoute>} />
        <Route path="/sales/receipts" element={<ProtectedRoute><Layout><ReceiptsList /></Layout></ProtectedRoute>} />
        <Route path="/sales/receipts/:id" element={<ProtectedRoute><Layout><ReceiptPage /></Layout></ProtectedRoute>} />

        {/* ================= CUSTOMERS ================= */}
        <Route path="/customers/add" element={<ProtectedRoute><Layout><CustomerAdd /></Layout></ProtectedRoute>} />
        <Route path="/customers/list" element={<ProtectedRoute><Layout><CustomerList /></Layout></ProtectedRoute>} />

        {/* ================= INVENTORY ================= */}
        <Route path="/inventory/add" element={<ProtectedRoute><Layout><InventoryAdd /></Layout></ProtectedRoute>} />
        <Route path="/inventory/list" element={<ProtectedRoute><Layout><InventoryList /></Layout></ProtectedRoute>} />

        {/* ================= SUPPLIERS ================= */}
        <Route path="/suppliers" element={<Navigate to="/suppliers/list" />} />
        <Route path="/suppliers/add" element={<ProtectedRoute><Layout><SupplierAdd /></Layout></ProtectedRoute>} />
        <Route path="/suppliers/list" element={<ProtectedRoute><Layout><SuppliersList /></Layout></ProtectedRoute>} />
        <Route path="/suppliers/edit/:id" element={<ProtectedRoute><Layout><SupplierAdd /></Layout></ProtectedRoute>} />

        {/* ================= PURCHASES ================= */}
        <Route path="/purchases" element={<Navigate to="/purchases/list" />} />
        <Route path="/purchases/new" element={<ProtectedRoute><Layout><PurchaseAdd /></Layout></ProtectedRoute>} />
        <Route path="/purchases/list" element={<ProtectedRoute><Layout><PurchaseList /></Layout></ProtectedRoute>} />

        {/* ================= STOCK MOVEMENTS ================= */}
        <Route
          path="/stock/stockMovements"
          element={
            <ProtectedRoute>
              <Layout>
                <StockMovements />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN ONLY ================= */}
        <Route
          path="/users/create"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <Layout>
                  <CreateUser />
                </Layout>
              </AdminRoute>
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;