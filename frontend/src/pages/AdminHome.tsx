import { Link } from "react-router-dom";

const AdminHome = () => {
  return (
    <div>
      <h1>Admin Home</h1>
      <div>
        <div>
          <Link to="/adminRegister">Admin Register</Link>
        </div>
        <div>
          <Link to="/adminLogin">Admin Login</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
