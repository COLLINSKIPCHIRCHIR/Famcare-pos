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

// ================= PROFORMA =================
import ProformaList   from "./pages/proforma/ProformaList";
import ProformaCreate from "./pages/proforma/ProformaCreate";
import ProformaView   from "./pages/proforma/ProformaView";

// ================= DELIVERY NOTES =================
import DeliveryNoteList from "./pages/deliveryNotes/DeliveryNoteList";
import DeliveryNoteView from "./pages/deliveryNotes/DeliveryNoteView";
import DeliveryNoteCreate from "./pages/deliveryNotes/DeliveryNoteCreate";


// ================= CREDIT NOTES =================
import CreditNoteList   from "./pages/creditNotes/CreditNoteList";
import CreditNoteCreate from "./pages/creditNotes/CreditNoteCreate";
import CreditNoteView   from "./pages/creditNotes/CreditNoteView";

// ================= CUSTOMER PAGES =================
import CustomerAdd from "./pages/customers/CustomerAdd";
import CustomerList from "./pages/customers/CustomerList";

// ================= SUPPLIER PAGES =================
import SupplierAdd from "./pages/Suppliers/SupplierAdd";
import SuppliersList from "./pages/Suppliers/SupplierList";

// ================= PURCHASE PAGES =================
import PurchaseAdd from "./pages/Purchases/PurchaseAdd";
import PurchaseList from "./pages/Purchases/PurchaseList";

import ExpenseList    from "./pages/expenses/ExpenseList";
import ExpenseAdd     from "./pages/expenses/ExpenseAdd";
import OutstandingList from "./pages/receivables/OutstandingList";
import PLReport       from "./pages/reports/PLReport";
import VATReport      from "./pages/reports/VATReport";


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

        {/* ================= PROFORMA ================= */}
        <Route path="/proforma/list" element={<ProtectedRoute><Layout><ProformaList /></Layout></ProtectedRoute>} />
        <Route path="/proforma/new" element={<ProtectedRoute><Layout><ProformaCreate /></Layout></ProtectedRoute>} />
        <Route path="/proforma/:id" element={<ProtectedRoute><Layout><ProformaView /></Layout></ProtectedRoute>} />

        {/* ================= DELIVERY NOTES ================= */}
        <Route path="/delivery-notes/list" element={<ProtectedRoute><Layout><DeliveryNoteList /></Layout></ProtectedRoute>} />
        <Route path="/delivery-notes/:id" element={<ProtectedRoute><Layout><DeliveryNoteView /></Layout></ProtectedRoute>} />
        <Route path="/delivery-notes/new" element={<ProtectedRoute><Layout><DeliveryNoteCreate /></Layout></ProtectedRoute>} />

        {/* ================= CREDIT NOTES ================= */}
        <Route path="/credit-notes/list" element={<ProtectedRoute><Layout><CreditNoteList /></Layout></ProtectedRoute>} />
        <Route path="/credit-notes/new" element={<ProtectedRoute><Layout><CreditNoteCreate /></Layout></ProtectedRoute>} />
        <Route path="/credit-notes/:id" element={<ProtectedRoute><Layout><CreditNoteView /></Layout></ProtectedRoute>} />

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

        <Route path="/expenses/list" element={<ProtectedRoute><Layout><ExpenseList /></Layout></ProtectedRoute>} />
        <Route path="/expenses/add"  element={<ProtectedRoute><Layout><ExpenseAdd /></Layout></ProtectedRoute>} />
        <Route path="/receivables"   element={<ProtectedRoute><Layout><OutstandingList /></Layout></ProtectedRoute>} />
        <Route path="/reports/pl"    element={<ProtectedRoute><Layout><PLReport /></Layout></ProtectedRoute>} />
        <Route path="/reports/vat"   element={<ProtectedRoute><Layout><VATReport /></Layout></ProtectedRoute>} />

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