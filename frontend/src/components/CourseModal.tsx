import { useState, useEffect } from "react";
import axiosClient from "../api/axios";

interface courseType {
  _id: string;
  code: string;
  title: string;
  expectedStudents: number | null;
  duration: number | null;
  requiredResources: string[] | null;
  venueType: "Laboratory" | "Lecture Hall";
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
    venueType: "Lecture Hall",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

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
    setIsLoading(true);
    const courseId = courseDetails._id;

    try {
      await axiosClient.patch(
        `/api/authentication/editCourse/${courseId}`,
        formData
      );
      setMsg("Course Updated Successfully");
      setTimeout(() => {
        closeModal();
      }, 3000);
    } catch (error) {
      setMsg("Error In Updating Course");
      setIsLoading(false);
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
      venueType: courseDetails.venueType,
    });
  }, [courseDetails]);

  const labelClass =
    "block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide";
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm";

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
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

          <div className="md:col-span-1">
            <label className={labelClass}>Course Title</label>
            <input
              type="text"
              placeholder="Introduction to..."
              value={formData.title}
              name="title"
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Expected Students</label>
            <input
              type="number"
              placeholder="0"
              value={formData.expectedStudents ?? ""}
              name="expectedStudents"
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Duration (Hrs)</label>
            <input
              type="number"
              placeholder="Duration of the course"
              value={formData.duration ?? ""}
              name="duration"
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Resources</label>
          <input
            type="text"
            placeholder="Projector, Whiteboard, Lab..."
            value={
              formData.requiredResources
                ? formData.requiredResources.join(",")
                : ""
            }
            name="requiredResources"
            onChange={handleResourcesChange}
            className={inputClass}
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Separate multiple items with commas.
          </p>
        </div>
        <div>
          <label className={labelClass}>Venue Type</label>
          <select
            name="venueType"
            value={formData.venueType}
            onChange={(e) =>
              setFormData({
                ...formData,
                venueType: e.target.value as "Laboratory" | "Lecture Hall",
              })
            }
            className={`cursor-pointer ${inputClass}`}
            required
          >
            <option value="Lecture Hall">Lecture Hall</option>
            <option value="Laboratory">Laboratory</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition
              ${
                isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
              }`}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
      {msg && (
        <div
          className={`mt-4 p-3 text-center rounded-lg text-sm font-medium border ${
            isLoading
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-red-100 text-red-700 border-red-200"
          } `}
        >
          {msg}
        </div>
      )}
    </div>
  );
};

export default CourseModal;
