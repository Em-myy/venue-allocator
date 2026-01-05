import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

interface protectedType {
  children: ReactNode;
}

const ProtectedRoutes = ({ children }: protectedType) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>"Loading..."</div>;
  }

  return user ? children : <Navigate to="/" />;
};
export default ProtectedRoutes;
