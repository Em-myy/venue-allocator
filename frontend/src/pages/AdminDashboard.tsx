import { useEffect, useState } from "react";
import axiosClient from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

interface AdminRequestType {
  _id: string;
  email: string;
  role: "lecturer" | "admin";
  adminRequestReason: string;
  adminRequestStatus: "none" | "pending" | "approved" | "rejected";
}

interface courseType {
  _id: string;
  code: string;
  title: string;
  expectedStudents: number | null;
  duration: number | null;
  requiredResources: string[] | null;
  lecturer: {
    username: string;
  };
}

interface venueType {
  _id: string;
  name: string;
  capacity: string;
  type: string;
  resources: string[];
}

interface FormType {
  name: string;
  capacity: string;
  type: string;
  resources: string[];
}

interface timetableType {
  _id: string;
  day: string;
  startTime: number;
  endTime: number;
  course: {
    title: string;
    code: string;
  };
  venue: {
    name: string;
  };
}

const apiUrl: string = import.meta.env.VITE_BACKEND_URL;

const socket = io(apiUrl);

const AdminDashboard = () => {
  const [candidateData, setCandidateData] = useState<AdminRequestType[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [courseData, setCourseData] = useState<courseType[]>([]);
  const [formData, setFormData] = useState<FormType>({
    name: "",
    capacity: "",
    type: "",
    resources: [],
  });
  const [venueData, setVenueData] = useState<venueType[]>([]);
  const [timetableData, setTimetableData] = useState<timetableType[]>([]);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleApprove = async (id: string) => {
    try {
      const res = await axiosClient.patch(`/api/admin/approve/${id}`);
      setMsg(res.data.msg);
    } catch (error) {
      console.log(error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await axiosClient.patch(`/api/admin/reject/${id}`);
      setMsg(res.data.msg);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleResourcesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = event.target.value;

    if (val === "") {
      return setFormData({ ...formData, resources: [] });
    } else {
      const resourcesArray = val.split(",").map((t) => t.trim());
      setFormData({ ...formData, resources: resourcesArray });
    }
  };

  const handleFormSubmit = async (
    event: React.ChangeEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    try {
      const res = await axiosClient.post("/api/admin/createVenue", formData);
      console.log("Venue created successfully");
      console.log(res.data.msg);
    } catch (error) {
      console.log(error);
    }
  };

  const handleTimetable = async () => {
    try {
      const res = await axiosClient.get("/api/admin/generate");
      if (res.data.generated) {
        setTimetableData(res.data.generated);
      } else {
        const refresh = await axiosClient.get("/api/admin/getTimetable");
        setTimetableData(refresh.data.timetable);
      }
      console.log(res.data.timetable);
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = () => {
    logout();
    console.log("Admin logged out successfully");
    navigate("/adminHome");
  };

  useEffect(() => {
    const handleCandidates = async () => {
      try {
        const res = await axiosClient.get("/api/admin/request");
        setCandidateData(res.data.requests);
      } catch (error) {
        console.log(error);
      }
    };
    handleCandidates();
  }, []);

  useEffect(() => {
    const handleCourses = async () => {
      try {
        const res = await axiosClient.get("/api/admin/getCourses");
        setCourseData(res.data.courses);
      } catch (error) {
        console.log(error);
      }
    };
    handleCourses();

    const handleNewCourses = (newCourse: courseType) => {
      setCourseData((prevCourses) => [...prevCourses, newCourse]);
    };

    socket.on("courseAdded", handleNewCourses);

    return () => {
      socket.off("courseAdded", handleNewCourses);
    };
  }, []);

  useEffect(() => {
    const handleVenues = async () => {
      try {
        const res = await axiosClient.get("/api/admin/getVenues");
        setVenueData(res.data.venues);
      } catch (error) {
        console.log(error);
      }
    };
    handleVenues();

    const handleNewVenue = async (newVenues: venueType) => {
      setVenueData((prevVenues) => [...prevVenues, newVenues]);
    };

    socket.on("venueAdded", handleNewVenue);

    return () => {
      socket.off("venueAdded", handleNewVenue);
    };
  }, []);

  useEffect(() => {
    const handleTimetable = async () => {
      try {
        const res = await axiosClient.get("/api/admin/getTimetable");
        setTimetableData(res.data.timetable);
      } catch (error) {
        console.log(error);
      }
    };
    handleTimetable();

    const handleNewTimetable = async (newTimetable: timetableType) => {
      setTimetableData((prevTimetable) => [...prevTimetable, newTimetable]);
    };

    socket.on("timetableUpdated", handleNewTimetable);

    return () => {
      socket.off("timetableUpdated", handleNewTimetable);
    };
  }, []);

  return (
    <div>
      <div>Admin Dashboard</div>
      {candidateData.map((index) => (
        <div key={index._id}>
          <div>{index.email}</div>
          <div>{index.role}</div>
          <div>{index.adminRequestReason}</div>
          <div>{index.adminRequestStatus}</div>

          <button type="button" onClick={() => handleApprove(index._id)}>
            Approve
          </button>
          <button type="button" onClick={() => handleReject(index._id)}>
            Reject
          </button>
        </div>
      ))}

      <div>
        <form onSubmit={handleFormSubmit}>
          <div>
            <label>Name: </label>
            <input
              type="text"
              placeholder="Venue name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
            />
          </div>
          <div>
            <label>Capacity: </label>
            <input
              type="text"
              placeholder="Capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleFormChange}
            />
          </div>
          <div>
            <label>Type: </label>
            <input
              type="text"
              placeholder="Venue type"
              name="type"
              value={formData.type}
              onChange={handleFormChange}
            />
          </div>
          <div>
            <label>Resources: </label>
            <input
              type="text"
              placeholder="Resources"
              name="resources"
              value={formData.resources}
              onChange={handleResourcesChange}
            />
          </div>
          <button type="submit">Create Venue</button>
        </form>
      </div>

      <div>
        {courseData.map((index) => (
          <div key={index._id}>
            <div>{index.code}</div>
            <div>{index.duration}</div>
            <div>{index.expectedStudents}</div>
            <div>{index.title}</div>
            <div>{index.requiredResources}</div>
            <div>{index.lecturer.username}</div>
          </div>
        ))}
      </div>

      <div>
        {venueData.map((index) => (
          <div key={index._id}>
            <div>{index.name}</div>
            <div>{index.capacity}</div>
            <div>{index.type}</div>
            <div>{index.resources}</div>
          </div>
        ))}
      </div>

      <button onClick={handleTimetable}>Create Timetable</button>

      <div>
        {timetableData.map((index) => (
          <div key={index._id}>
            <div>{index.course.title}</div>
            <div>{index.course.code}</div>
            <div>{index.venue.name}</div>
            <div>{index.day}</div>
            <div>{index.startTime}</div>
            <div>{index.endTime}</div>
          </div>
        ))}
      </div>

      <div>{msg}</div>
      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default AdminDashboard;
