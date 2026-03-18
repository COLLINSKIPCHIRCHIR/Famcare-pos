import { Navigate } from "react-router-dom";
import useRole from "../utils/useRole";

export default function AdminRoute({ children }) {
  const { isAdmin } = useRole();
  if (!isAdmin) return <Navigate to="/dashboard" />;
  return children;
}