import { useEffect, useState } from "react";
import axiosClient from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import CourseModal from "../components/CourseModal";
import PreferencesModal from "../components/PreferencesModal";
import ConfirmModal from "../components/ConfirmModal";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaExclamationCircle,
  FaPlus,
  FaSignOutAlt,
  FaTimes,
  FaTrash,
  FaUserTie,
} from "react-icons/fa";

interface timetableType {
  _id: string;
  day: string;
  startTime: number;
  endTime: number;
  course: {
    title: string;
    code: string;
  } | null;
  venue: {
    name: string;
  } | null;
}

interface courseType {
  code: string;
  title: string;
  expectedStudents: number | null;
  duration: number | null;
  requiredResources: string[] | null;
}

interface courseDetails {
  _id: string;
  code: string;
  title: string;
  expectedStudents: number | null;
  duration: number | null;
  requiredResources: string[] | null;
}

interface courseDetail {
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

interface userType {
  _id: string;
  name: string;
  email: string;
  role: string;
  adminRequestStatus: string;
  adminRequestReason: string;
  preferredDays: string[];
  preferredTimes: string[];
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

const apiUrl: string = import.meta.env.VITE_BACKEND_URL;

const socket = io(apiUrl);

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
    _id: "",
    name: "",
    email: "",
    role: "",
    adminRequestStatus: "",
    adminRequestReason: "",
    preferredDays: [],
    preferredTimes: [],
  });
  const [preferencesForm, setPreferencesForm] = useState<preferencesType>({
    preferredDays: [],
    preferredTimes: [],
  });
  const [preferencesEditDetails, setPreferencesEditDetails] =
    useState<preferencesType>({ preferredDays: [], preferredTimes: [] });
  const [courseData, setCourseData] = useState<courseDetail[]>([]);
  const [courseEditDetails, setCourseEditDetails] = useState<courseDetails>({
    _id: "",
    code: "",
    title: "",
    expectedStudents: null,
    duration: null,
    requiredResources: null,
  });
  const [editShowMenu, setEditShowMenu] = useState<boolean>(false);
  const [preferenceEditShowMenu, setPreferenceEditShowMenu] =
    useState<boolean>(false);
  const [courseLoading, setCourseLoading] = useState<boolean>(true);
  const [timetableData, setTimetableData] = useState<timetableType[]>([]);
  const [courseButtonLoading, setCourseButtonLoading] =
    useState<boolean>(false);
  const [preferenceButtonLoading, setpreferenceButtonLoading] =
    useState<boolean>(false);
  const [requestButtonLoading, setRequestButtonLoading] =
    useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null | undefined>(
    null
  );
  const [deleteType, setDeleteType] = useState<"venue" | "course" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleRequestSubmit = async (
    event: React.ChangeEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setRequestButtonLoading(true);
    try {
      const res = await axiosClient.post("/api/authentication/request", {
        reason,
      });
      setMsg(res.data.msg);
      setReason("");

      setUserData((prev) => ({
        ...prev,
        adminRequestStatus: "pending",
        adminRequestReason: reason,
      }));
      setRequestButtonLoading(false);
    } catch (error) {
      console.log(error);
      setRequestButtonLoading(false);
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
    setCourseButtonLoading(true);

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

      if (res.data.course) {
        const refreshRes = await axiosClient.get(
          "/api/authentication/getCourses"
        );
        setCourseData(refreshRes.data.courses);
      }

      setFormData({
        code: "",
        title: "",
        expectedStudents: null,
        duration: null,
        requiredResources: null,
      });

      setCourseButtonLoading(false);
    } catch (error) {
      setCourseButtonLoading(false);
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
    setpreferenceButtonLoading(true);

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

      if (res.data.data) {
        setUserData((prev) => ({
          ...prev,
          preferredDays: res.data.preferredDays,
          preferredTimes: res.data.preferredTimes,
        }));
      }

      setPreferencesForm({ preferredDays: [], preferredTimes: [] });
      setpreferenceButtonLoading(false);
    } catch (error) {
      console.log(error);
      setpreferenceButtonLoading(false);
    }
  };

  const handleEdit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const clickedButton = event.currentTarget;

    const courseId = clickedButton.dataset.id;

    try {
      const res = await axiosClient.get(
        `/api/authentication/courseDetails/${courseId}`
      );

      setCourseEditDetails({
        _id: res.data.course._id,
        code: res.data.course.code,
        title: res.data.course.title,
        expectedStudents: res.data.course.expectedStudents,
        duration: res.data.course.duration,
        requiredResources: res.data.course.requiredResources,
      });
      setEditShowMenu(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePreferencesEdit = async () => {
    try {
      const res = await axiosClient.get("/api/authentication/profile");

      setPreferencesEditDetails({
        preferredDays: res.data.preferredDays,
        preferredTimes: res.data.preferredTimes,
      });
      setPreferenceEditShowMenu(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const clickedButton = event.currentTarget;

    const courseId: string | null | undefined = clickedButton.dataset.id;

    setItemToDelete(courseId);
    setDeleteType("course");
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !deleteType) return;

    setIsDeleting(true);
    try {
      if (deleteType === "course") {
        await axiosClient.delete(
          `/api/authentication/deleteCourse/${itemToDelete}`
        );
        setCourseData((prev) => prev.filter((c) => c._id !== itemToDelete));
      }

      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setDeleteType(null);
    } catch (error) {
      console.log("Delete failed", error);
    } finally {
      setIsDeleting(false);
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

      socket.on("newAdminRequest", (newRequest) => {
        setUserData(newRequest);
      });

      socket.on("preferenceCreated", (updatedData) => {
        setUserData((prev) => ({
          ...prev,
          preferredDays: updatedData.preferredDays,
          preferredTimes: updatedData.preferredTimes,
        }));
      });

      socket.on("preferenceUpdated", (updatedData) => {
        setUserData((prev) => ({
          ...prev,
          preferredDays: updatedData.preferredDays,
          preferredTimes: updatedData.preferredTimes,
        }));
      });

      return () => {
        socket.off("newAdminRequest");
        socket.off("preferenceCreated");
        socket.off("preferenceUpdated");
      };
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    const handleApproval = (data: any) => {
      if (data.userId === userData._id) {
        setUserData((prev) => ({
          ...prev,
          adminRequestStatus: "approved",
          role: "admin",
        }));
      }
    };

    const handleRejection = (data: any) => {
      if (data.userId === userData._id) {
        setUserData((prev) => ({
          ...prev,
          adminRequestStatus: "rejected",
          role: "lecturer",
        }));
      }
    };

    socket.on("adminApproved", handleApproval);
    socket.on("adminRejected", handleRejection);

    return () => {
      socket.off("adminApproved", handleApproval);
      socket.off("adminRejected", handleRejection);
    };
  }, [userData._id]);

  useEffect(() => {
    const getCourses = async () => {
      try {
        setCourseLoading(true);
        const res = await axiosClient.get("/api/authentication/getCourses");
        setCourseData(res.data.courses || []);
      } catch (error) {
        console.log(error);
      } finally {
        setCourseLoading(false);
      }
    };
    getCourses();

    const handleNewCourses = (newCourse: courseDetail) => {
      setCourseData((prevCourses) => [...prevCourses, newCourse]);
    };

    const handleUpdatedCourse = (updatedCourse: courseDetail) => {
      setCourseData((prevCourses) =>
        prevCourses.map((c) =>
          c._id === updatedCourse._id ? updatedCourse : c
        )
      );
    };

    const handleDeletedCourse = (deletedCourse: courseDetail) => {
      if (deletedCourse && deletedCourse._id) {
        setCourseData((prev) =>
          prev.filter((req) => req._id !== deletedCourse._id)
        );
      }
    };

    socket.on("courseAdded", handleNewCourses);
    socket.on("courseUpdated", handleUpdatedCourse);
    socket.on("courseDeleted", handleDeletedCourse);
    socket.on("adminCourseDeleted", handleDeletedCourse);

    return () => {
      socket.off("courseAdded", handleNewCourses);
      socket.off("courseUpdated", handleUpdatedCourse);
      socket.off("courseDeleted", handleDeletedCourse);
      socket.off("adminCourseDeleted", handleDeletedCourse);
    };
  }, []);

  useEffect(() => {
    const getTimetable = async () => {
      try {
        const res = await axiosClient.get("/api/authentication/getTimetable");
        setTimetableData(res.data.timetable || []);
      } catch (error) {
        console.log("Error fetching timetable", error);
      }
    };
    getTimetable();

    const handleNewTimetable = (data: any) => {
      if (Array.isArray(data)) {
        setTimetableData(data);
      } else if (data.timetable && Array.isArray(data.timetable)) {
        setTimetableData(data.timetable);
      } else {
        setTimetableData((prev) => [...prev, data]);
      }
    };

    const handleDeallocatedCourse = (data: any) => {
      setTimetableData((prev) => prev.filter((t) => t._id !== data._id));
    };

    socket.on("timetableUpdated", handleNewTimetable);
    socket.on("timetableDeallocated", handleDeallocatedCourse);

    return () => {
      socket.off("timetableUpdated", handleNewTimetable);
      socket.off("timetableDeallocated", handleDeallocatedCourse);
    };
  }, []);

  const myTimetable = timetableData.filter((entry) => {
    if (!entry.course) return false;
    const course = entry.course;
    return courseData.some((myCourse) => myCourse.code === course.code);
  });

  const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

  const isExpanded =
    userData.adminRequestStatus === "pending" ||
    userData.adminRequestStatus === "approved" ||
    userData.role === "admin";

  const inputClass =
    "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm";
  const labelClass =
    "block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide";
  const cardClass = "bg-white shadow-md rounded-xl p-6 border border-gray-100";
  const buttonPrimary =
    "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 shadow-sm text-sm cursor-pointer";

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <FaUserTie />
              </div>
              <h1 className="text-xl font-bold text-gray-800">
                Lecturer Dashboard
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-medium transition cursor-pointer"
            >
              <span>Logout</span> <FaSignOutAlt />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8 lg:col-span-1">
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                My Profile
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Name:</span>
                  <span className="font-semibold text-gray-800">
                    {userData.name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Role:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-xs uppercase ${
                      userData.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {userData.role}
                  </span>
                </div>

                {userData.adminRequestStatus && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">
                      Admin Request:
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-xs uppercase 
                          ${
                            userData.adminRequestStatus === "approved"
                              ? "bg-green-100 text-green-700"
                              : userData.adminRequestStatus === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                    >
                      {userData.adminRequestStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={cardClass}>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-gray-800 ">
                  Availability
                </h2>
                <button
                  onClick={() => handlePreferencesEdit()}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 cursor-pointer"
                >
                  <FaEdit /> Edit
                </button>
              </div>

              {!userData ? (
                <p className="text-gray-400 text-sm">Loading...</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                      <FaBookOpen size={10} /> Days
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(userData?.preferredDays || []).length > 0 ? (
                        userData.preferredDays.map((day, i) => (
                          <span
                            key={i}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium border"
                          >
                            {day}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No days set
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                      <FaClock size={10} /> Times
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(userData?.preferredTimes || []).length > 0 ? (
                        userData.preferredTimes.map((time, i) => (
                          <span
                            key={i}
                            className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium border border-blue-100"
                          >
                            {time}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No times set
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cardClass}>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                    <FaPlus size={12} />
                  </span>{" "}
                  Add Course
                </h2>
                <form onSubmit={handleCoursesSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Code</label>
                      <input
                        type="text"
                        placeholder="e.g. CSC101"
                        value={formData.code}
                        name="code"
                        onChange={handleChange}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Duration (Hrs)</label>
                      <input
                        type="number"
                        placeholder="2"
                        value={formData.duration ?? ""}
                        name="duration"
                        onChange={handleChange}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Course Title</label>
                    <input
                      type="text"
                      placeholder="Intro to Computer Science"
                      value={formData.title}
                      name="title"
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Expected Students</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={formData.expectedStudents ?? ""}
                      name="expectedStudents"
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Resources (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Projector, HDMI..."
                      value={
                        formData.requiredResources
                          ? formData.requiredResources.join(",")
                          : ""
                      }
                      name="requiredResources"
                      onChange={handleResourcesChange}
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={courseButtonLoading}
                    className={`${buttonPrimary}
              ${
                courseButtonLoading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
                  >
                    {courseButtonLoading
                      ? "Success! Adding Course"
                      : "Add Course"}
                  </button>
                </form>
              </div>

              <div className={cardClass}>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="bg-green-100 text-green-600 p-1.5 rounded-lg">
                    <FaClock size={12} />
                  </span>{" "}
                  Set Preferences
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Update your availability for scheduling.
                </p>
                <form onSubmit={handlePreferencesSubmit} className="space-y-4">
                  <div>
                    <label className={labelClass}>Preferred Days</label>
                    <input
                      type="text"
                      placeholder="Monday, Wednesday..."
                      name="preferredDays"
                      value={
                        preferencesForm.preferredDays
                          ? preferencesForm.preferredDays.join(",")
                          : ""
                      }
                      onChange={handleDayChange}
                      className={inputClass}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Separate days with commas
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Preferred Times</label>
                    <input
                      type="text"
                      placeholder="9am, 2pm..."
                      name="preferredTimes"
                      value={
                        preferencesForm.preferredTimes
                          ? preferencesForm.preferredTimes.join(",")
                          : ""
                      }
                      onChange={handleTimeChange}
                      className={inputClass}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Separate times with commas
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={preferenceButtonLoading}
                    className={`${buttonPrimary} bg-green-600 hover:bg-green-700
              ${
                preferenceButtonLoading
                  ? "bg-green-300 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
                  >
                    {preferenceButtonLoading
                      ? "Success! Updating Preference"
                      : "Update Preference"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-span-full w-full bg-white shadow-md rounded-xl p-6 border border-gray-100">
            {!isExpanded ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-yellow-800 flex items-center gap-2">
                    <span className="bg-yellow-100 p-2 rounded-lg">
                      <FaUserTie />
                    </span>{" "}
                    Request Admin Access
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Submit a request to become an administrator.
                  </p>
                </div>
                <form
                  onSubmit={handleRequestSubmit}
                  className="flex-1 w-full flex gap-3"
                >
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="Reason for request..."
                    onChange={(e) => setReason(e.target.value)}
                    value={reason}
                    required
                  />

                  <button
                    type="submit"
                    disabled={requestButtonLoading}
                    className={`bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-700 transition cursor-pointer
              ${
                requestButtonLoading
                  ? "bg-yellow-300 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
                  >
                    {requestButtonLoading
                      ? "Success! Submitting Request"
                      : "Submit Request"}
                  </button>
                </form>
                {msg && <p className="text-green-600 font-semibold">{msg}</p>}
              </div>
            ) : (
              <div
                className={`flex items-center gap-4 p-4 rounded-lg border-l-4 
                      ${
                        userData.adminRequestStatus === "pending"
                          ? "bg-yellow-50 border-yellow-400"
                          : userData.adminRequestStatus === "approved"
                          ? "bg-green-50 border-green-500"
                          : "bg-red-50 border-red-500"
                      }`}
              >
                <div className="text-2xl">
                  {userData.adminRequestStatus === "pending" && (
                    <FaExclamationCircle className="text-yellow-500" />
                  )}
                  {userData.adminRequestStatus === "approved" && (
                    <FaCheckCircle className="text-green-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 uppercase tracking-wide">
                    Admin Request: {userData.adminRequestStatus}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Reason: "{userData.adminRequestReason}"
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-full w-full bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-bold text-gray-800">My Courses</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                {courseData.length} Courses
              </span>
            </div>

            {courseLoading && (
              <div className="text-center py-8 text-gray-500">
                Loading courses...
              </div>
            )}
            {!courseLoading && courseData.length === 0 && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-400">
                <p>No courses added yet.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {courseData.map((course) => (
                <div
                  key={course._id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition duration-200 relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                        {course.code}
                      </span>
                      <h3 className="text-lg font-bold text-gray-800 mt-2 leading-tight">
                        {course.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="block text-xl font-bold text-gray-700">
                        {course.expectedStudents}
                      </span>
                      <span className="text-xs text-gray-400">Students</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-3 space-y-1">
                    <p>
                      <strong className="text-gray-700">Duration:</strong>{" "}
                      {course.duration} hours
                    </p>
                    <p>
                      <strong className="text-gray-700">Resources:</strong>{" "}
                      {course.requiredResources?.join(", ") || "None"}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                    <button
                      data-id={course._id}
                      onClick={handleEdit}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      data-id={course._id}
                      onClick={handleDelete}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 col-span-full bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <FaCalendarAlt className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">
                My Teaching Schedule
              </h2>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[800px] grid grid-cols-5 gap-4">
                {daysOfWeek.map((day) => {
                  const daysEvents = myTimetable
                    .filter((t) => t.day.toLowerCase() === day.toLowerCase())
                    .sort((a, b) => a.startTime - b.startTime);

                  return (
                    <div key={day} className="flex flex-col">
                      <div className="bg-blue-600 text-white text-center py-2 rounded-t-lg font-bold uppercase text-sm tracking-wider">
                        {day}
                      </div>

                      <div className="bg-blue-50 border border-blue-100 border-t-0 rounded-b-lg min-h-[250px] p-2 space-y-2">
                        {daysEvents.length === 0 ? (
                          <div className="text-center text-gray-400 text-xs mt-10 italic">
                            No classes
                          </div>
                        ) : (
                          daysEvents.map((event) => (
                            <div
                              key={event._id}
                              className="bg-white border-l-4 border-indigo-500 shadow-sm rounded p-3 hover:shadow-md transition"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1 rounded">
                                  {event.startTime}:00 - {event.endTime}:00
                                </span>
                              </div>
                              {event.course && (
                                <h4 className="font-bold text-gray-800 text-sm leading-tight">
                                  {event.course.title}
                                </h4>
                              )}
                              <div className="flex justify-between items-center mt-2">
                                {event.course && (
                                  <span className="text-xs text-indigo-600 font-semibold">
                                    {event.course.code}
                                  </span>
                                )}
                                {event.venue && (
                                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                                    {event.venue.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editShowMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
          onClick={() => setEditShowMenu(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Edit Course</h3>
              <button
                onClick={() => setEditShowMenu(false)}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6">
              <CourseModal
                courseDetails={courseEditDetails}
                closeModal={() => setEditShowMenu(false)}
              />
            </div>
          </div>
        </div>
      )}

      {preferenceEditShowMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
          onClick={() => setPreferenceEditShowMenu(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Edit Preferences</h3>
              <button
                onClick={() => setPreferenceEditShowMenu(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6">
              <PreferencesModal
                preferencesDetails={preferencesEditDetails}
                closeModal={() => setPreferenceEditShowMenu(false)}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title={deleteType === "venue" ? "Delete Venue?" : "Delete Course?"}
        message={`Are you sure you want to remove this ${deleteType}? This action cannot be undone.`}
      />
    </div>
  );
};

export default LecturerDashboard;
