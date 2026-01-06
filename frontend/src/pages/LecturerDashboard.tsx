import { useEffect, useState } from "react";
import axiosClient from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface courseType {
  code: string;
  title: string;
  expectedStudents: number | null;
  duration: number | null;
  requiredResources: string[] | null;
}

interface userType {
  name: string;
  email: string;
  role: string;
  adminRequestStatus: string;
  adminRequestReason: string;
  preferredDays: string[];
  preferredTime: string[];
}

interface preferencesType {
  preferredDays: string[];
  preferredTimes: string[];
}

const timeConverter = (timeStr: string): string => {
  const cleanStr = timeStr.trim().toLowerCase();

  const match = cleanStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return timeStr;

  let [_, hoursStr, minutesStr, modifier] = match;
  let hours = parseInt(hoursStr, 10);
  let minutes = minutesStr || "00";

  if (modifier) {
    if (modifier === "pm" && hours < 12) {
      hours += 12;
    } else if (modifier === "am" && hours === 12) {
      hours = 0;
    }
  }
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

const LecturerDashboard = () => {
  const [reason, setReason] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [formData, setFormData] = useState<courseType>({
    code: "",
    title: "",
    expectedStudents: null,
    duration: null,
    requiredResources: null,
  });
  const [userData, setUserData] = useState<userType>({
    name: "",
    email: "",
    role: "",
    adminRequestStatus: "",
    adminRequestReason: "",
    preferredDays: [],
    preferredTime: [],
  });
  const [preferencesForm, setPreferencesForm] = useState<preferencesType>({
    preferredDays: [],
    preferredTimes: [],
  });
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleRequestSubmit = async (
    event: React.ChangeEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    try {
      const res = await axiosClient.post("/api/admin/request", { reason });
      setMsg(res.data.msg);
      setReason("");
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? null : Number(value)) : value,
    }));
  };

  const handleResourcesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = event.target.value;

    if (val === "") {
      return setFormData({ ...formData, requiredResources: null });
    } else {
      setFormData({ ...formData, requiredResources: val.split(",") });
    }
  };

  const handleCoursesSubmit = async (
    event: React.ChangeEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      const cleanedData = {
        ...formData,
        requiredResources: formData.requiredResources
          ? formData.requiredResources.map((r) => r.trim())
          : null,
      };

      const res = await axiosClient.post(
        "/api/authentication/submitCourses",
        cleanedData
      );
      console.log("Courses submitted successfully");
      console.log(res.data.course);
    } catch (error) {
      console.log(error);
    }
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;

    if (val === "") {
      return setPreferencesForm({ ...preferencesForm, preferredTimes: [] });
    } else {
      const timeArray = val.split(",").map((t) => t.trim());
      setPreferencesForm({
        ...preferencesForm,
        preferredTimes: timeArray,
      });
    }
  };

  const handleDayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;

    if (val === "") {
      return setPreferencesForm({ ...preferencesForm, preferredDays: [] });
    } else {
      const dayArray = val.split(",").map((t) => t.trim());
      setPreferencesForm({ ...preferencesForm, preferredDays: dayArray });
    }
  };

  const handlePreferencesSubmit = async (
    event: React.ChangeEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formattedDays = preferencesForm.preferredDays.map((day) =>
      day.trim().toUpperCase()
    );

    const formattedTimes = preferencesForm.preferredTimes.map((time) =>
      timeConverter(time)
    );

    const payload = {
      preferredDays: formattedDays,
      preferredTimes: formattedTimes,
    };
    try {
      const res = await axiosClient.patch(
        "/api/authentication/submitPreferences",
        payload
      );
      console.log(res.data.msg);
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = () => {
    logout();
    console.log("User logged out successfully");
    navigate("/lecturerHome");
  };

  useEffect(() => {
    try {
      const getDetails = async () => {
        const res = await axiosClient.get("/api/authentication/profile");
        setUserData(res.data);
      };
      getDetails();
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect();

  return (
    <div>
      <div>Lecturer dashboard</div>
      {userData.adminRequestStatus === "pending" ||
      userData.adminRequestStatus === "approved" ? null : (
        <div>
          <form onSubmit={handleRequestSubmit}>
            <div>
              <label>Admin Reason</label>
              <input
                type="text"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setReason(event.target.value)
                }
                value={reason}
                name="reason"
              />
            </div>
            <button>Submit</button>
          </form>
        </div>
      )}
      <div>{msg}</div>
      <div>
        <form onSubmit={handleCoursesSubmit}>
          <div>
            <div>
              <label>Course code: </label>
              <input
                type="text"
                placeholder="course code"
                value={formData.code}
                name="code"
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Course title: </label>
              <input
                type="text"
                placeholder="course title"
                value={formData.title}
                name="title"
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Expected Students: </label>
              <input
                type="number"
                placeholder="number of students for the course"
                value={formData.expectedStudents ?? ""}
                name="expectedStudents"
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Duration: </label>
              <input
                type="number"
                placeholder="duration of the course"
                value={formData.duration ?? ""}
                name="duration"
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Resources: </label>
              <input
                type="text"
                placeholder="resources needed"
                value={
                  formData.requiredResources
                    ? formData.requiredResources.join(",")
                    : ""
                }
                name="requiredResources"
                onChange={handleResourcesChange}
              />
            </div>
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>

      <div>
        <h1>Submit Preferences</h1>
        <form onSubmit={handlePreferencesSubmit}>
          <div>
            <div>
              <label>Preferred Day</label>
              <input
                type="text"
                placeholder="Enter the day in full name"
                name="preferredDays"
                value={
                  preferencesForm.preferredDays
                    ? preferencesForm.preferredDays.join(",")
                    : ""
                }
                onChange={handleDayChange}
              />
            </div>
            <div>
              <label>Preferred Time</label>
              <input
                type="text"
                placeholder="Enter the time in digit"
                name="preferredTimes"
                value={
                  preferencesForm.preferredTimes
                    ? preferencesForm.preferredTimes.join(",")
                    : ""
                }
                onChange={handleTimeChange}
              />
            </div>
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
      <div>
        <div>{userData.name}</div>
        <div>{userData.role}</div>
        <div>{userData.adminRequestReason}</div>
        <div>{userData.adminRequestStatus}</div>
        <div>{userData.preferredDays.join(", ")}</div>
        <div>{userData.preferredTime.join(", ")}</div>
      </div>

      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default LecturerDashboard;
