import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      <h1>Welcome</h1>
      <div>
        <Link to="/lecturerHome">Lecturer</Link>
      </div>
      <div>
        <Link to="/adminHome">Admin</Link>
      </div>
    </div>
  );
};

export default Home;
