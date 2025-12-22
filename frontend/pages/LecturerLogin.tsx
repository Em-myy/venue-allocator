import { useState } from "react";
interface formType {
  email: string;
  password: string;
}

const LecturerLogin = () => {
  const [formData, setFormData] = useState<formType>({
    email: "",
    password: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };
  return (
    <div>
      <h1>Login</h1>
      <div>
        <form>
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
            <button type="button">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LecturerLogin;
