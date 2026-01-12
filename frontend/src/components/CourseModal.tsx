import { useState, useEffect } from "react";
import axiosClient from "../api/axios";

interface courseType {
  _id: string;
  code: string;
  title: string;
  expectedStudents: number | null;
  duration: number | null;
  requiredResources: string[] | null;
}

type Props = {
  courseDetails: courseType;
  closeModal: () => void;
};

const CourseModal: React.FC<Props> = ({ courseDetails, closeModal }) => {
  const [formData, setFormData] = useState<courseType>({
    _id: "",
    code: "",
    title: "",
    expectedStudents: null,
    duration: null,
    requiredResources: null,
  });

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

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    const courseId = courseDetails._id;

    try {
      await axiosClient.patch(
        `/api/authentication/editCourse/${courseId}`,
        formData
      );
      closeModal();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setFormData({
      _id: courseDetails._id,
      code: courseDetails.code,
      title: courseDetails.title,
      duration: courseDetails.duration,
      expectedStudents: courseDetails.expectedStudents,
      requiredResources: courseDetails.requiredResources,
    });
  }, [courseDetails]);
  return (
    <div>
      <h2>Edit Course</h2>
      <form onSubmit={handleSubmit}>
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
  );
};

export default CourseModal;
