import "./App.css";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import LecturerHome from "./pages/LecturerHome";
import AdminHome from "./pages/AdminHome";
import LecturerRegister from "./pages/LecturerRegister";
import LecturerLogin from "./pages/LecturerLogin";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lecturerHome" element={<LecturerHome />} />
      <Route path="/adminHome" element={<AdminHome />} />
      <Route path="/lecturerRegister" element={<LecturerRegister />} />
      <Route path="/lecturerLogin" element={<LecturerLogin />} />
    </Routes>
  );
}

export default App;
