import { useState, useEffect } from "react";

export default function useRole() {
  const [role, setRole] = useState("staff");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setRole(user?.role || "staff");
    setIsAdmin(user?.role === "admin");
  }, []);

  return { role, isAdmin };
}