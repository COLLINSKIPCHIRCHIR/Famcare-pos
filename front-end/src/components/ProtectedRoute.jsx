import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    // If no token OR no user, redirect to login
    if (!token || !user) {
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (err) {
    // If something goes wrong parsing user, redirect
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;