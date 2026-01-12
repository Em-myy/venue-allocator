import { useEffect, useState } from "react";
import axiosClient from "../api/axios";

interface preferencesType {
  preferredDays: string[];
  preferredTimes: string[];
}

type Props = {
  preferencesDetails: preferencesType;
  closeModal: () => void;
};

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

const PreferencesModal: React.FC<Props> = ({
  preferencesDetails,
  closeModal,
}) => {
  const [preferencesForm, setPreferencesForm] = useState<preferencesType>({
    preferredDays: [],
    preferredTimes: [],
  });

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
      await axiosClient.patch("/api/authentication/editPreferences", payload);
      closeModal();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setPreferencesForm({
      preferredDays: preferencesDetails.preferredDays || [],
      preferredTimes: preferencesDetails.preferredTimes || [],
    });
  }, [preferencesDetails]);
  return (
    <div>
      <h1>Edit Preferences</h1>
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
          <button type="submit">Edit Preferences</button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesModal;
