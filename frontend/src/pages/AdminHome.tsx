import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

const AdminHome = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Admin portal</h1>
          <p className="text-gray-500 mt-2">Secure Access Only</p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            to="/adminLogin"
            className="block w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg text-center transition duration-300 shadow-md"
          >
            Admin Login
          </Link>
        </div>

        <div className="mt-6">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition"
          >
            <FaArrowLeft />
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
