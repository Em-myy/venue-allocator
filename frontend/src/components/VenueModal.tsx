import { useEffect, useState } from "react";
import axiosClient from "../api/axios";

interface venueType {
  _id: string;
  name: string;
  capacity: string;
  type: "Laboratory" | "Lecture Hall";
  resources: string[];
}

type Props = {
  venueDetails: venueType;
  closeModal: () => void;
};

const VenueModal: React.FC<Props> = ({ venueDetails, closeModal }) => {
  const [formData, setFormData] = useState<venueType>({
    _id: "",
    name: "",
    capacity: "",
    type: "Lecture Hall",
    resources: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

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

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const venueId = venueDetails._id;

    try {
      await axiosClient.patch(`/api/admin/editVenue/${venueId}`, formData);
      setMsg("Venue Updated Successfully");
      setTimeout(() => {
        closeModal();
      }, 3000);
    } catch (error) {
      setMsg("Error In Updating Venue");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setFormData({
      _id: venueDetails._id,
      name: venueDetails.name,
      capacity: venueDetails.capacity,
      type: venueDetails.type,
      resources: venueDetails.resources,
    });
  }, [venueDetails]);

  const labelClass =
    "block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide";
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition text-sm";

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Venue Name</label>
          <input
            type="text"
            placeholder="e.g. Lecture Hall 1"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            className={inputClass}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Capacity</label>
            <input
              type="text"
              placeholder="e.g. 100"
              name="capacity"
              value={formData.capacity}
              onChange={handleFormChange}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Venue Type</label>
            <select
              name="venueType"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "Laboratory" | "Lecture Hall",
                })
              }
              className={`cursor-pointer ${inputClass}`}
              required
            >
              <option value="Lecture Hall">Lecture Hall</option>
              <option value="Laboratory">Laboratory</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Resources</label>
          <input
            type="text"
            placeholder="Resources"
            name="resources"
            value={formData.resources.join(",")}
            onChange={handleResourcesChange}
            className={inputClass}
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Separate multiple resources with commas.
          </p>
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
            className={`px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-semibold shadow-sm transition
                ${
                  isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
                }`}
          >
            {isLoading ? "Saving..." : "Update Venue"}
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

export default VenueModal;
