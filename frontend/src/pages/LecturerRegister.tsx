import { useState } from "react";
import axiosClient from "../api/axios";

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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const res = await axiosClient.post(
        "/api/authentication/register",
        formData
      );
      setMsg(res.data.msg);
      console.log("User created successfully");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h1>Lecturer Register</h1>
      <div>
        <form onSubmit={handleSubmit}>
          <div>
            <div>
              <label>Username: </label>
              <input
                type="text"
                placeholder="Lecturer Username"
                value={formData.username}
                name="username"
                onChange={handleChange}
              />
            </div>
            <div>
              <label>E-Mail: </label>
              <input
                type="email"
                placeholder="Lecturer E-Mail"
                value={formData.email}
                name="email"
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Password: </label>
              <input
                type="password"
                placeholder="Lecturer Password"
                value={formData.password}
                name="password"
                onChange={handleChange}
              />
            </div>
          </div>
          <button>Submit</button>
        </form>
      </div>
      <div>{msg}</div>
    </div>
  );
};

export default LecturerRegister;
