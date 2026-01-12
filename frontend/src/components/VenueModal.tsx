import { useEffect, useState } from "react";
import axiosClient from "../api/axios";

interface venueType {
  _id: string;
  name: string;
  capacity: string;
  type: string;
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
    type: "",
    resources: [],
  });

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
    const venueId = venueDetails._id;

    try {
      await axiosClient.patch(`/api/admin/editVenue/${venueId}`, formData);
      closeModal();
    } catch (error) {
      console.log(error);
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
  return (
    <div>
      <h2>Venue Edition section</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Edit Venue</button>
      </form>
    </div>
  );
};

export default VenueModal;
