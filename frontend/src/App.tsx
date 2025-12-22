import "./App.css";
import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import LecturerHome from "../pages/LecturerHome";
import AdminHome from "../pages/AdminHome";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lecturerHome" element={<LecturerHome />} />
      <Route path="/adminHome" element={<AdminHome />} />
    </Routes>
  );
}

export default App;
