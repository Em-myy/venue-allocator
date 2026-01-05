import { createContext, useEffect, useState, type ReactNode } from "react";
import axiosClient from "../api/axios";

interface AuthContextType {
  user: any | null;
  logout: () => void;
  loading: boolean;
}

interface AuthProviderType {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderType) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await axiosClient.get("/api/authentication/profile");
        setUser(res.data);
      } catch {
        try {
          const res2 = await axiosClient.post("/api/authentication/refresh");
          setUser(res2.data);
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    if (isLoggedOut) return;
    verifyUser();
  }, [isLoggedOut]);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setIsLoggedOut(true);
    };

    window.addEventListener("logout", handleLogout);

    return () => {
      window.removeEventListener("logout", handleLogout);
    };
  }, []);
};
