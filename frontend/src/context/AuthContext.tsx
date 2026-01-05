import type { ReactNode } from "react";

interface AuthContextType {
  user: any | null;
  logout: () => void;
  loading: boolean;
}

interface AuthProviderType {
  children: ReactNode;
}
