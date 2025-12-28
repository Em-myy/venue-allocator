import { useState } from "react";
import axiosClient from "../api/axios";

interface courseType {
  code: string;
  title: string;
  expectedStudents: number | null;
  duration: number | null;
  requiredResources: string[] | null;
}

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

  const handleRequestSubmit = async (
    event: React.ChangeEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    try {
      const res = await axiosClient.post("/api/admin/request", { reason });
      setMsg(res.data);
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

  return (
    <div>
      <div>Lecturer dashboard</div>
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
    </div>
  );
};

export default LecturerDashboard;
