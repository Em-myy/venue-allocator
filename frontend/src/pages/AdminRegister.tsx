import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axios";

interface formType {
  username: string;
  email: string;
  password: string;
}

const AdminRegister = () => {
  const [formData, setFormData] = useState<formType>({
    username: "",
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
      const res = await axiosClient.post("/api/admin/register", formData);
      setMsg(res.data.msg);
      navigate("/adminLogin");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <div>AdminRegister</div>
      <div>
        <form onSubmit={handleSubmit}>
          <div>
            <div>
              <label>Username: </label>
              <input
                type="text"
                placeholder="Admin Username"
                value={formData.username}
                name="username"
                onChange={handleChange}
              />
            </div>
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

export default AdminRegister;
