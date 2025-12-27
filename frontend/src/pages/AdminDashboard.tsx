import { useEffect, useState } from "react";
import axiosClient from "../api/axios";

interface AdminRequestType {
  _id: string;
  email: string;
  role: "lecturer" | "admin";
  adminRequestReason: string;
  adminRequestStatus: "none" | "pending" | "approved" | "rejected";
}

const AdminDashboard = () => {
  const [candidateData, setCandidateData] = useState<AdminRequestType[]>([]);
  const [msg, setMsg] = useState<string>("");

  const handleApprove = async (id: string) => {
    try {
      const res = await axiosClient.patch(`/api/admin/approve/${id}`);
      setMsg(res.data.msg);
    } catch (error) {
      console.log(error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await axiosClient.patch(`/api/admin/reject/${id}`);
      setMsg(res.data.msg);
    } catch (error) {
      console.log(error);
    }
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
  }, []);
  return (
    <div>
      <div>Admin Dashboard</div>
      {candidateData.map((index) => (
        <div key={index._id}>
          <div>{index.email}</div>
          <div>{index.role}</div>
          <div>{index.adminRequestReason}</div>
          <div>{index.adminRequestStatus}</div>

          <button type="button" onClick={() => handleApprove(index._id)}>
            Approve
          </button>
          <button type="button" onClick={() => handleReject(index._id)}>
            Reject
          </button>
        </div>
      ))}
      <div>{msg}</div>
    </div>
  );
};

export default AdminDashboard;
