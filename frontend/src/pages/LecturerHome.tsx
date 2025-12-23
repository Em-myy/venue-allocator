import { Link } from "react-router-dom";

const LecturerHome = () => {
  return (
    <div>
      <div>
        <Link to="/lecturerRegister">Lecturer Register</Link>
      </div>
      <div>
        <Link to="/lecturerLogin">Lecturer Login</Link>
      </div>
    </div>
  );
};

export default LecturerHome;
