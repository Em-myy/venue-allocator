import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface formType {
  email: string;
  password: string;
}

const AdminLogin = () => {
  const [formData, setFormData] = useState<formType>({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const loggedInUser = await login(formData.email, formData.password);
      if (loggedInUser.role !== "admin") {
        await logout();
        return;
      }
      console.log("admin logged in successfully");
      navigate("/adminDashboard");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h1>Admin Login</h1>
      <div>
        <form onSubmit={handleSubmit}>
          <div>
            <div>
              <label>E-Mail: </label>
              <input
                type="email"
                placeholder="Admin Mail"
                value={formData.email}
                name="email"
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Password: </label>
              <input
                type="password"
                value={formData.password}
                name="password"
                onChange={handleChange}
              />
            </div>
            <button>Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
