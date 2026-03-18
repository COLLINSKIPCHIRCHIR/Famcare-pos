import useRole from "../utils/useRole";

export default function AdminOnly({ children }) {
  const { isAdmin } = useRole();
  if (!isAdmin) return null;
  return children;
}