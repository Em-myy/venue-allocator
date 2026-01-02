import { useEffect, useState } from "react";
import axiosClient from "../api/axios";

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
  name: string;
  capacity: string;
  type: string;
  resources: string[];
}

const AdminDashboard = () => {
  const [candidateData, setCandidateData] = useState<AdminRequestType[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [courseData, setCourseData] = useState<courseType[]>([]);
  const [formData, setFormData] = useState<venueType>({
    name: "",
    capacity: "",
    type: "",
    resources: [],
  });

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
      console.log(res.data.msg);
    } catch (error) {
      console.log(error);
    }
  };

  const handleTimetable = async () => {
    try {
      const res = await axiosClient.get("/api/admin/generate");
      console.log(res.data.timetable);
    } catch (error) {
      console.log(error);
    }
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
        <form>
          <div>
            <label>Name: </label>
            <input type="text" />
          </div>
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

      <button onClick={handleTimetable}>Create Timetable</button>

      <div>{msg}</div>
    </div>
  );
};

export default AdminDashboard;
