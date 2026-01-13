import "./App.css";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoutes from "./components/ProtectedRoutes";
import Home from "./pages/Home";
import LecturerHome from "./pages/LecturerHome";
import AdminHome from "./pages/AdminHome";
import LecturerRegister from "./pages/LecturerRegister";
import LecturerLogin from "./pages/LecturerLogin";
import LecturerDashboard from "./pages/LecturerDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lecturerHome" element={<LecturerHome />} />
        <Route path="/adminHome" element={<AdminHome />} />
        <Route path="/lecturerRegister" element={<LecturerRegister />} />
        <Route path="/lecturerLogin" element={<LecturerLogin />} />
        <Route
          path="/lecturerDashboard"
          element={
            <ProtectedRoutes>
              <LecturerDashboard />
            </ProtectedRoutes>
          }
        />
        <Route path="/adminLogin" element={<AdminLogin />} />
        <Route path="/adminRegister" element={<AdminRegister />} />
        <Route
          path="/adminDashboard"
          element={
            <ProtectedRoutes>
              <AdminDashboard />
            </ProtectedRoutes>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
