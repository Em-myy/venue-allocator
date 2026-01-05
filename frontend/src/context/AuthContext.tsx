import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import axiosClient from "../api/axios";

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => void;
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
      if (isLoggedOut) {
        setLoading(false);
        return;
      }

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

  const login = async (email: string, password: string): Promise<void> => {
    await axiosClient.post("/api/authentication/login", { email, password });
    const userRes = await axiosClient.get("/api/authentication/profile");

    setUser(userRes.data);
    setIsLoggedOut(false);
  };

  const logout = async () => {
    await axiosClient.post("/api/authentication/logout");
    setUser(null);
    setIsLoggedOut(true);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("Error occurred in AuthContext");
  }

  return context;
};
