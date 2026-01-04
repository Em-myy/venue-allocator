import type { ReactNode } from "react";

interface AuthContextType {
  user: any | null;
  logout: () => void;
  loading: boolean;
}
aaaaaaa
interface AuthProviderType {
  children: ReactNode;
}
