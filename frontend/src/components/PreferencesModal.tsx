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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

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
    setIsLoading(true);

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
      setMsg("Preference Updated Successfully");
      setTimeout(() => {
        closeModal();
      }, 3000);
    } catch (error) {
      setMsg("Error In Updating Preference");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPreferencesForm({
      preferredDays: preferencesDetails.preferredDays || [],
      preferredTimes: preferencesDetails.preferredTimes || [],
    });
  }, [preferencesDetails]);

  const labelClass =
    "block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide";
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm";

  return (
    <div>
      <form onSubmit={handlePreferencesSubmit} className="space-y-6">
        <div>
          <label className={labelClass}>Preferred Day</label>
          <input
            type="text"
            placeholder="Monday, Wednesday, Friday"
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
            Enter days separated by commas (e.g., Mon, Tue).
          </p>
        </div>

        <div>
          <label className={labelClass}>Preferred Time</label>
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
            className={inputClass}
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Enter start times separated by commas (e.g., 9am, 2pm).
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
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
            {isLoading ? "Saving..." : "Save Preferences"}
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

export default PreferencesModal;
