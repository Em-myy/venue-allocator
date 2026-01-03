interface AuthContextType {
  user: any | null;
  logout: () => void;
  loading: boolean;
}
