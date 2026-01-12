import { useState } from "react";
import axiosClient from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

interface formType {
  username: string;
  email: string;
  password: string;
}

const LecturerRegister = () => {
  const [formData, setFormData] = useState<formType>({
    username: "",
    email: "",
    password: "",
  });
  const [msg, setMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const res = await axiosClient.post(
        "/api/authentication/register",
        formData
      );
      setMsg(res.data.msg);
      setTimeout(() => {
        navigate("/lecturerDashboard");
      }, 3000);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Lecturer Registration
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create your new account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              name="username"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              E-Mail
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              name="email"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              value={formData.password}
              name="password"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
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
            {isLoading ? "Success! Redirecting..." : "Register"}
          </button>
        </form>

        {msg && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 text-center rounded-lg text-sm font-medium border border-green-200">
            {msg}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/lecturerLogin"
              className="text-blue-600 hover:underline font-semibold"
            >
              Login here
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
};

export default LecturerRegister;
