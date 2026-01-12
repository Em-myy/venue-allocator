import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";

interface formType {
  email: string;
  password: string;
}

const LecturerLogin = () => {
  const [formData, setFormData] = useState<formType>({
    email: "",
    password: "",
  });
  const [msg, setMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isShowing, setIsShowing] = useState<boolean>(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      setMsg("User successfully logged in");
      setTimeout(() => {
        navigate("/lecturerDashboard");
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
          <h1 className="text-2xl font-bold text-gray-800">Lecturer Login</h1>
          <p className="text-gray-500 text-sm mt-1">Access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              E-Mail
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                placeholder="Enter your password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
          >
            {isLoading ? "Logging in..." : "Login"}
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

        <div className="mt-6 flex flex-col gap-2 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/lecturerRegister"
              className="text-blue-600 hover:underline font-semibold"
            >
              Register here
            </Link>
          </p>
          <Link
            to="/lecturerHome"
            className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition mt-2 "
          >
            <FaArrowLeft /> <span>Back to menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
  {
    /*
    <div>
      <h1>Login</h1>
      <div>
        <form onSubmit={handleSubmit}>
          <div>
            <div>
              <label>E-mail</label>
              <input
                type="email"
                placeholder="Lecturer E-Mail"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Password</label>
              <input
                type="password"
                placeholder="Lecturer E-Mail"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <button>Submit</button>
          </div>
        </form>
      </div>
    </div> */
  }
};

export default LecturerLogin;
