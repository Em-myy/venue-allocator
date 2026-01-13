import { useEffect, useState } from "react";
import axiosClient from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import VenueModal from "../components/VenueModal";
import {
  FaBuilding,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaCheck,
  FaEdit,
  FaPlus,
  FaSignOutAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

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
  const [venueEditDetails, setVenueEditDetails] = useState<venueType>({
    _id: "",
    name: "",
    capacity: "",
    type: "",
    resources: [],
  });

  const [editShowMenu, setEditShowMenu] = useState<boolean>(false);
  const [venueLoading, setVenueLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [venueButtonLoading, setVenueButtonLoading] = useState<boolean>(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleApprove = async (id: string) => {
    try {
      const res = await axiosClient.patch(`/api/admin/approve/${id}`);
      setMsg(res.data.msg);
    } catch (error) {
      setMsg("Error in approving candidate");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await axiosClient.patch(`/api/admin/reject/${id}`);
      setMsg(res.data.msg);
    } catch (error) {
      setMsg("Error in rejecting candidate");
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
    setVenueButtonLoading(true);
    try {
      await axiosClient.post("/api/admin/createVenue", formData);

      setFormData({
        name: "",
        capacity: "",
        type: "",
        resources: [],
      });
      setVenueButtonLoading(false);
    } catch (error) {
      setMsg("Error in adding venue");
      setVenueButtonLoading(false);
    }
  };

  const handleTimetable = async () => {
    setIsGenerating(true);
    try {
      const res = await axiosClient.get("/api/admin/generate");
      if (res.data.generated) {
        setTimetableData(res.data.generated);
      } else {
        const refresh = await axiosClient.get("/api/admin/getTimetable");
        setTimetableData(refresh.data.timetable);
      }
    } catch (error) {
      setMsg("Error in creating timetable");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const clickedButton = event.currentTarget;

    const venueId = clickedButton.dataset.id;

    try {
      const res = await axiosClient.get(`/api/admin/venueDetails/${venueId}`);

      setVenueEditDetails({
        _id: res.data.venue._id,
        name: res.data.venue.name,
        capacity: res.data.venue.capacity,
        type: res.data.venue.type,
        resources: res.data.venue.resources,
      });
      setEditShowMenu(true);
    } catch (error) {
      setMsg("Error in editing venues");
    }
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const clickedButton = event.currentTarget;

    const venueId = clickedButton.dataset.id;

    if (!window.confirm("Delete this venue?")) return;

    try {
      await axiosClient.delete(`/api/admin/deleteVenue/${venueId}`);

      setVenueData((prev) => prev.filter((venue) => venue._id !== venueId));
    } catch (error) {
      setMsg("Error in deleting venue");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      await axiosClient.delete(`/api/admin/deleteCourse/${id}`);

      setCourseData((prev) => prev.filter((course) => course._id !== id));
    } catch (error) {
      setMsg("Error in deleting course");
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

    socket.on("newAdminRequest", (newRequest) => {
      setCandidateData((prev) => [...prev, newRequest]);
    });

    socket.on("adminApproved", (updatedData) => {
      setCandidateData((prev) =>
        prev.filter((req) => req._id !== updatedData.userId)
      );
    });

    socket.on("adminRejected", (deletedData) => {
      setCandidateData((prev) =>
        prev.filter((req) => req._id !== deletedData.userId)
      );
    });

    return () => {
      socket.off("newAdminRequest");
      socket.off("adminApproved");
      socket.off("adminRejected");
    };
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

    const handleUpdatedCourse = (updatedCourse: courseType) => {
      setCourseData((prevCourses) =>
        prevCourses.map((c) =>
          c._id === updatedCourse._id ? updatedCourse : c
        )
      );
    };

    const handleDeletedCourse = (deletedCourse: courseType) => {
      if (deletedCourse && deletedCourse._id) {
        setCourseData((prev) =>
          prev.filter((req) => req._id !== deletedCourse._id)
        );
      }
    };

    socket.on("courseAdded", handleNewCourses);
    socket.on("courseUpdated", handleUpdatedCourse);
    socket.on("courseDeleted", handleDeletedCourse);
    socket.on("adminCourseDeleted", handleDeleteCourse);

    return () => {
      socket.off("courseAdded", handleNewCourses);
      socket.off("courseUpdated", handleUpdatedCourse);
      socket.off("courseDeleted", handleDeletedCourse);
      socket.off("adminCourseDeleted", handleDeleteCourse);
    };
  }, []);

  useEffect(() => {
    const handleVenues = async () => {
      try {
        setVenueLoading(true);
        const res = await axiosClient.get("/api/admin/getVenues");
        setVenueData(res.data.venues);
      } catch (error) {
        console.log(error);
      } finally {
        setVenueLoading(false);
      }
    };
    handleVenues();

    const handleNewVenue = async (newVenues: venueType) => {
      setVenueData((prevVenues) => [...prevVenues, newVenues]);
    };

    const handleUpdatedVenue = (updatedVenue: venueType) => {
      setVenueData((prevVenues) =>
        prevVenues.map((v) => (v._id === updatedVenue._id ? updatedVenue : v))
      );
    };

    const handleDeletedVenue = (deletedVenue: venueType) => {
      if (deletedVenue && deletedVenue._id) {
        setVenueData((prev) =>
          prev.filter((req) => req._id !== deletedVenue._id)
        );
      }
    };

    socket.on("venueAdded", handleNewVenue);
    socket.on("venueUpdated", handleUpdatedVenue);
    socket.on("venueDeleted", handleDeletedVenue);

    return () => {
      socket.off("venueAdded", handleNewVenue);
      socket.off("venueUpdated", handleUpdatedVenue);
      socket.off("venueDeleted", handleDeletedVenue);
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

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const cardClass = "bg-white shadow-md rounded-xl p-6 border border-gray-200";
  const headerClass =
    "text-xl font-bold text-gray-800 mb-4 flex items-center gap-2";
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 text-sm";
  const labelClass =
    "block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <nav className="bg-gray-800 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="bg-gray-700 p-2 rounded-lg">
                <FaBuilding />
              </span>
              <h1 className="text-xl font-bold tracking-wider">ADMIN PORTAL</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <span>Logout</span>
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {candidateData.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-yellow-800">
                Pending Admin Requests ({candidateData.length})
              </h2>
              {msg && (
                <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                  {msg}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidateData.map((req) => (
                <div
                  key={req._id}
                  className="bg-white p-3 rounded-lg shadow-sm border border-yellow-200 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {req.email}
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      "{req.adminRequestReason}"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req._id)}
                      className="bg-green-100 text-green-600 p-2 rounded hover:bg-green-200 transition cursor-pointer"
                    >
                      <FaCheck size={14} />
                    </button>
                    <button
                      onClick={() => handleReject(req._id)}
                      className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200 transition cursor-pointer"
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className={cardClass}>
              <h2 className={headerClass}>
                <FaPlus className="text-gray-500" /> Add Venue
              </h2>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div>
                  <label className={labelClass}>Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Hall A"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Capacity</label>
                    <input
                      type="number"
                      placeholder="100"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleFormChange}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Type</label>
                    <input
                      type="text"
                      placeholder="Lab/Hall"
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Resources</label>
                  <input
                    type="text"
                    placeholder="Projector, AC..."
                    name="resources"
                    value={formData.resources}
                    onChange={handleResourcesChange}
                    className={inputClass}
                  />
                </div>

                <button
                  disabled={venueButtonLoading}
                  className={`w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 rounded-lg transition shadow-md
              ${
                venueButtonLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
                >
                  {venueButtonLoading
                    ? "Success! Creating Venue"
                    : "Create Venue"}
                </button>
              </form>
            </div>

            <div className={cardClass}>
              <h2 className={headerClass}>
                <FaBuilding className="text-gray-500" /> Venues (
                {venueData.length})
              </h2>
              <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {venueLoading ? (
                  <p>Loading...</p>
                ) : (
                  <ul className="space-y-3">
                    {venueData.map((venue) => (
                      <li
                        key={venue._id}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center group"
                      >
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {venue.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {venue.type} • Cap: {venue.capacity}
                          </p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            data-id={venue._id}
                            onClick={handleEdit}
                            className="text-blue-500 hover:text-blue-700 cursor-pointer"
                          >
                            <FaEdit />
                          </button>
                          <button
                            data-id={venue._id}
                            onClick={handleDelete}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className={`${cardClass} h-full`}>
              <h2 className={headerClass}>
                <FaChalkboardTeacher className="text-gray-500" /> Submitted
                Courses
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50 text-gray-600 font-bold">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Students</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Lecturer</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {courseData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-4 text-gray-400"
                        >
                          No courses submitted yet
                        </td>
                      </tr>
                    ) : (
                      courseData.map((course) => (
                        <tr
                          key={course._id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3 font-semibold text-blue-600">
                            {course.code}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {course.title}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {course.expectedStudents}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {course.duration} hrs
                          </td>
                          <td className="px-4 py-3 text-gray-500 italic">
                            {course.lecturer?.username}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteCourse(course._id)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition duration-200 cursor-pointer"
                              title="Delete Course"
                            >
                              <FaTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaCalendarAlt className="text-blue-600" /> Master Timetable
            </h2>
            <button
              onClick={handleTimetable}
              disabled={isGenerating}
              className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition 
                        ${
                          isGenerating
                            ? "bg-gray-400 cursor-wait"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
            >
              {isGenerating ? "Processing..." : "Generate Timetable"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px] grid grid-cols-5 gap-4">
              {daysOfWeek.map((day) => {
                const daysEvents = timetableData
                  .filter((t) => t.day.toLowerCase() === day.toLowerCase())
                  .sort((a, b) => a.startTime - b.startTime);

                return (
                  <div key={day} className="flex flex-col">
                    <div className="bg-gray-800 text-white text-center py-2 rounded-t-lg font-bold uppercase text-sm tracking-wider">
                      {day}
                    </div>

                    <div className="bg-gray-50 border border-gray-200 border-t-0 rounded-b-lg min-h-[300px] p-2 space-y-2">
                      {daysEvents.length === 0 ? (
                        <div className="text-center text-gray-300 text-sm mt-10 italic">
                          No classes
                        </div>
                      ) : (
                        daysEvents.map((event) => (
                          <div
                            key={event._id}
                            className="bg-white border-l-4 border-blue-500 shadow-sm rounded p-2 hover:shadow-md transition"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-gray-500">
                                {event.startTime}:00 - {event.endTime}:00
                              </span>
                              <span className="text-[10px] bg-gray-200 text-gray-700 px-1 rounded">
                                {event.venue.name}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-800 text-sm mt-1 leading-tight">
                              {event.course.title}
                            </h4>
                            <p className="text-xs text-blue-600 font-semibold">
                              {event.course.code}
                            </p>
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

      {editShowMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
          onClick={() => setEditShowMenu(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Edit Venue</h3>
              <button onClick={() => setEditShowMenu(false)}>
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <VenueModal
                venueDetails={venueEditDetails}
                closeModal={() => setEditShowMenu(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
