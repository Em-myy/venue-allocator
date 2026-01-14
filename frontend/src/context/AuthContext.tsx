import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import axiosClient from "../api/axios";

interface userType {
  name: string;
  email: string;
  role: string;
  adminRequestStatus: string;
  adminRequestReason: string;
  preferredDays: string[];
  preferredTime: string[];
}

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<userType>;
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
          // Try refreshing with the token from localStorage (for mobile)
          const refreshToken = localStorage.getItem("refreshToken");
          const res2 = await axiosClient.post("/api/authentication/refresh", {
            refreshToken,
          });

          localStorage.setItem("accessToken", res2.data.accessToken);
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

  const login = async (email: string, password: string): Promise<userType> => {
    const res = await axiosClient.post("/api/authentication/login", {
      email,
      password,
    });

    // 1. Save tokens to LocalStorage
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);

    const userRes = await axiosClient.get("/api/authentication/profile");

    setUser(userRes.data);
    setIsLoggedOut(false);

    return userRes.data;
  };

  const logout = async () => {
    await axiosClient.post("/api/authentication/logout");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
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
