import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface formType {
  email: string;
  password: string;
}

const LecturerLogin = () => {
  const [formData, setFormData] = useState<formType>({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await login(formData.email, formData.password);
      console.log("User Logged in successfully");
      navigate("/lecturerDashboard");
    } catch (error) {
      console.log(error);
    }
  };
  return (
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
    </div>
  );
};

export default LecturerLogin;
