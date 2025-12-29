import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Course from "../models/Course.js";
import { AuthMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const createAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
};

const createRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res
        .status(401)
        .json({ msg: "User already exists...... Please try again" });

    const user = new User({ username, email, password });
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

    res.status(200).json({ msg: "Registered Successful" });
  } catch (error) {
    console.log(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.json({
        msg: "User not registered..... Please go and register",
      });

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

    res.status(200).json({ msg: "Login Successful" });
  } catch (error) {
    console.log(error);
  }
});

router.post("/profile", (req, res) => {
  res.json({ user: req.user });
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

    res.json({ user });
  } catch (error) {
    console.log(error);
    res.status(403).json({ msg: "Invalid refresh token" });
  }
});

router.post("/submitCourses", AuthMiddleware, async (req, res) => {
  try {
    const { code, title, expectedStudents, duration, requiredResources } =
      req.body;

    const existingCourse = await Course.findOne({ code });

    if (existingCourse) {
      return res.status(401).json({ msg: "Course already exists" });
    }

    const lecturerId = req.user._id;

    const course = new Course({
      code,
      title,
      expectedStudents,
      duration,
      requiredResources,
      lecturer: lecturerId,
    });
    await course.save();

    res.status(201).json({ course });
  } catch (error) {
    console.log(error);
  }
});

router.get("/request", AuthMiddleware, async (req, res) => {});

export default router;
