import express from "express";
import jwt from "jsonwebtoken";
import { AuthMiddleware } from "../middleware/authMiddleware.js";
import { GenerateTimetable } from "../controller/allocationController.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

const createAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
};

const createRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

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

router.patch("/approve/:id", AuthMiddleware, async (req, res) => {
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

router.patch("/reject/:id", AuthMiddleware, async (req, res) => {
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

router.post("/login", AuthMiddleware, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user.role !== "admin") {
      return res.status(401).json({ msg: "Not an admin" });
    }

    const isMatch = bcrypt.compare(password, user.password);

    if (isMatch === false) {
      return res.status(401).json({ msg: "Invalid password" });
    }

    const accessToken = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({ msg: "Admin logged in successfully" });
  } catch (error) {
    console.log(error);
  }
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(401).json({ msg: "User already exists" });

    const user = new User({
      username: username,
      email: email,
      password: password,
      role: "admin",
    });
    await user.save();

    const accessToken = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(201).json({ msg: "Admin registration successful" });
  } catch (error) {
    console.log(error);
  }
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.status(401).json({ msg: "Logged out" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ msg: "User not found" });

    const newAccessToken = createAccessToken(decoded.id);
    res.cookie("newAccessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.status(201).json({ user });
  } catch (error) {
    console.log(error);
    res.status(403).json({ msg: "Invalid refresh token" });
  }
});

router.post("/generate", AuthMiddleware, async (req, res) => {
  const timetable = await GenerateTimetable();
  res.json(timetable);
});

export default router;
