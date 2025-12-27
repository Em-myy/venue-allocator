import { useState } from "react";
import axiosClient from "../api/axios";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const res = await axiosClient.post("/api/admin/login", formData);
      setMsg(res.data.msg);
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
      <div>{msg}</div>
    </div>
  );
};

export default AdminLogin;
