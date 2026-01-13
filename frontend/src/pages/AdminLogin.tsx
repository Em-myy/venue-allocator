import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";

interface formType {
  email: string;
  password: string;
}

const AdminLogin = () => {
  const [formData, setFormData] = useState<formType>({
    email: "",
    password: "",
  });
  const [msg, setMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isShowing, setIsShowing] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const loggedInUser = await login(formData.email, formData.password);
      if (loggedInUser.role !== "admin") {
        await logout();
        return;
      }
      setMsg("Admin successfully logged in");
      setTimeout(() => {
        navigate("/adminDashboard");
      }, 3000);
    } catch (error) {
      setMsg("Error In registering user");
      setIsLoading(false);
    }
  };

  const handleVisibility = () => {
    setIsShowing((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-1">Secure Dashboard Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              E-Mail
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              name="email"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={isShowing ? "text" : "password"}
                placeholder="Enter admin password"
                value={formData.password}
                name="password"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition"
                required
              />
              <button
                onClick={handleVisibility}
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {isShowing ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
              </button>
            </div>
          </div>

          <button
            disabled={isLoading}
            className={`w-full font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md mt-2 text-white
              ${
                isLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gray-800 hover:bg-gray-900 cursor-pointer"
              }`}
          >
            {isLoading ? "Verifying Access..." : "Login"}
          </button>
        </form>

        {msg && (
          <div
            className={`mt-4 p-3 text-center rounded-lg text-sm font-medium border ${
              isLoading
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-red-100 text-red-700 border-red-200"
            } `}
          >
            {msg}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/adminHome"
            className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition"
          >
            <FaArrowLeft />
            <span>Back to Admin Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
