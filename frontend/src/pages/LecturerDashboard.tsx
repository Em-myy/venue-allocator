import React, { useState } from "react";
import axiosClient from "../api/axios";

const LecturerDashboard = () => {
  const [reason, setReason] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const res = await axiosClient.post("/api/admin/request", { reason });
      setSubmitted(true);
      setMsg(res.data);
      setReason("");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div>
      <div>Lecturer dashboard</div>
      <div>
        <form onSubmit={handleSubmit}>
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
    </div>
  );
};

export default LecturerDashboard;
