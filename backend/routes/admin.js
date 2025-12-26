import express from "express";
import jwt from "jsonwebtoken";
import { AuthMiddleware } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/request", AuthMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    if (req.user.role === "admin") {
      return res.status(400).json({ msg: "You are already an admin" });
    }

    req.user.adminRequestStatus = "pending";
    req.user.adminRequestReason = reason;

    await req.user.save();

    res.status(202).json({ msg: "Request submitted successfully" });
  } catch (error) {
    res.status(400).json({ msg: "Error submitting request" });
  }
});

router.get("/request", AuthMiddleware, async (req, res) => {
  const requests = await User.find({ adminRequestStatus: "pending" }).select(
    "-password"
  );

  res.status(202).json({ requests });
});

router.patch("/approve/edit/:id", AuthMiddleware, async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ msg: "User not found" });

    user.role = "admin";
    user.adminRequestStatus = "approved";

    await user.save();

    res.status(201).json({ msg: "Approval successful" });
  } catch (error) {
    res.status(404).json({ msg: "User not approved" });
  }
});

router.patch("/reject/edit/:id", AuthMiddleware, async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ msg: "User not found" });

    user.adminRequestStatus = "rejected";

    await user.save();

    res.status(201).json({ msg: "Rejected" });
  } catch (error) {
    res.status(404).json({ msg: "User not approved" });
  }
});

export default router;
