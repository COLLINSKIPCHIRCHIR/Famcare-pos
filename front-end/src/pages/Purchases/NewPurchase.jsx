import { useEffect, useState } from "react";
import axios from "axios";

const SUPPLIER_API = "http://localhost:5003/api/suppliers";
const INVENTORY_API = "http://localhost:5003/api/inventory/list";
const PURCHASE_API = "http://localhost:5003/api/purchases";

export default function NewPurchase() {
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchSuppliers();
    fetchInventory();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(SUPPLIER_API);
      setSuppliers(res.data);
    } catch (err) {
      console.error("Error fetching suppliers:", err.message);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get(INVENTORY_API);
      setInventory(res.data);
    } catch (err) {
      console.error("Error fetching inventory:", err.message);
    }
  };

  const addItem = () => {
    setItems([...items, { inventory_id: "", quantity: 1, buying_price: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.buying_price, 0);
  };

  const handleSubmit = async () => {
    if (!supplierId || items.length === 0) {
      alert("Please select a supplier and add at least one item");
      return;
    }

    try {
      await axios.post(PURCHASE_API, {
        supplier_id: supplierId,
        items: items,
      });
      alert("Purchase created successfully!");
      setSupplierId("");
      setItems([]);
    } catch (error) {
      console.error(error);
      alert("Failed to create purchase: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">New Purchase</h2>

      {/* Supplier Selection */}
      <div className="mb-4">
        <label className="block font-bold mb-1">Supplier <span className="text-red-500">*</span></label>
        <select
          className="border p-2 rounded w-full"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <option value="">Select Supplier</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      {/* Items */}
      <div className="mb-4">
        <h3 className="font-bold mb-2">Items</h3>
        {items.length === 0 && (
          <p className="text-gray-400 text-sm border rounded p-4 text-center">No items added yet.</p>
        )}
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 mb-2 items-center">
            <select
              className="border p-2 rounded flex-1"
              value={item.inventory_id}
              onChange={(e) => handleItemChange(index, "inventory_id", e.target.value)}
            >
              <option value="">Select Product</option>
              {inventory.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Qty"
              className="border p-2 rounded w-20 text-center"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
            />

            <input
              type="number"
              placeholder="Buying Price"
              className="border p-2 rounded w-32"
              value={item.buying_price}
              onChange={(e) => handleItemChange(index, "buying_price", Number(e.target.value))}
            />

            <button
              onClick={() => removeItem(index)}
              className="text-red-500 hover:text-red-700 font-bold text-lg px-2"
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={addItem}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Item
        </button>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded border mt-4">
        <span className="text-lg font-bold">Total Amount</span>
        <span className="text-2xl font-bold text-green-600">
          KES {calculateTotal().toLocaleString()}
        </span>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="mt-5 w-full bg-green-600 text-white py-3 rounded font-bold text-lg hover:bg-green-700"
      >
        ✅ Complete Purchase
      </button>
    </div>
  );
}