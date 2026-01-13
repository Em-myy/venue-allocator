import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Timetable from "../models/Timetable.js";
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

    res.status(200).json({ msg: "Registration Successful" });
  } catch (error) {
    res.status(404).json({ msg: "Error registering user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({
        msg: "User not registered..... Please go and register",
      });

    const isMatch = await bcrypt.compare(password, user.password);

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
    res.status(404).json({ msg: "Error Logging in" });
  }
});

router.get("/profile", AuthMiddleware, async (req, res) => {
  const lecturerId = req.user._id;

  const user = await User.findById(lecturerId);

  res.status(200).json({
    _id: user._id,
    name: user.username,
    role: user.role,
    adminRequestStatus: user.adminRequestStatus,
    adminRequestReason: user.adminRequestReason,
    preferredDays: user.preferences?.preferredDays || [],
    preferredTimes: user.preferences?.preferredTimes || [],
  });
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.status(401).json({ msg: "Logged out" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ msg: "User not found" });

    const newAccessToken = createAccessToken(user._id);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.json({
      _id: user._id,
      name: user.username,
      role: user.role,
      adminRequestStatus: user.adminRequestStatus,
      adminRequestReason: user.adminRequestReason,
      preferredDays: user.preferences?.preferredDays || [],
      preferredTimes: user.preferences?.preferredTimes || [],
    });
  } catch (error) {
    console.log(error);
    res.status(403).json({ msg: "Invalid refresh token" });
  }
});

router.post("/request", AuthMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    if (req.user.role === "admin") {
      return res.status(400).json({ msg: "You are already an admin" });
    }

    req.user.adminRequestStatus = "pending";
    req.user.adminRequestReason = reason;

    await req.user.save();

    req.io.emit("newAdminRequest", {
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      adminRequestReason: reason,
      adminRequestStatus: "pending",
      preferredDays: req.user.preferences.preferredDays,
      preferredTimes: req.user.preferences.preferredTimes,
    });

    res.status(202).json({ msg: "Request submitted successfully" });
  } catch (error) {
    res.status(400).json({ msg: "Error submitting request" });
  }
});

router.patch("/submitPreferences", AuthMiddleware, async (req, res) => {
  const { preferredTimes, preferredDays } = req.body;
  try {
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          "preferences.preferredDays": { $each: preferredDays },
          "preferences.preferredTimes": { $each: preferredTimes },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    const formattedUser = {
      _id: updatedUser._id,
      name: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      adminRequestStatus: updatedUser.adminRequestStatus,
      adminRequestReason: updatedUser.adminRequestReason,
      preferredDays: updatedUser.preferences.preferredDays,
      preferredTimes: updatedUser.preferences.preferredTimes,
    };

    req.io.emit("preferenceCreated", formattedUser);

    res.status(202).json({ msg: "Preferences submitted successfully" });
  } catch (error) {
    console.log(error);
  }
});

router.patch("/editPreferences", AuthMiddleware, async (req, res) => {
  const preferredTimes = req.body.preferredTimes || [];
  const preferredDays = req.body.preferredDays || [];

  try {
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,

      {
        $set: {
          "preferences.preferredDays": preferredDays,
          "preferences.preferredTimes": preferredTimes,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    const formattedUser = {
      _id: updatedUser._id,
      name: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      adminRequestStatus: updatedUser.adminRequestStatus,
      adminRequestReason: updatedUser.adminRequestReason,
      preferredDays: updatedUser.preferences.preferredDays,
      preferredTimes: updatedUser.preferences.preferredTimes,
    };

    req.io.emit("preferenceUpdated", formattedUser);

    res.status(202).json({ msg: "Preferences submitted successfully" });
  } catch (error) {
    console.log(error);
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

    await course.populate("lecturer", "username");

    req.io.emit("courseAdded", course);

    res.status(201).json({ course });
  } catch (error) {
    console.log(error);
  }
});

router.get("/getCourses", AuthMiddleware, async (req, res) => {
  const lecturerId = req.user._id;

  try {
    const courses = await Course.find({ lecturer: lecturerId }).populate(
      "lecturer",
      "username"
    );
    res.status(200).json({ courses });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error fetching courses" });
  }
});

router.get("/courseDetails/:id", AuthMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const course = await Course.findById(id).populate("lecturer", "username");

    res.status(200).json({ course });
  } catch (error) {
    console.log(error);
    res.status(404).json({ msg: "Course not found" });
  }
});

router.patch("/editCourse/:id", AuthMiddleware, async (req, res) => {
  const id = req.params.id;

  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    req.io.emit("courseUpdated", updatedCourse);

    res.status(200).json({ msg: "Course updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ msg: "Error updating course" });
  }
});

router.delete("/deleteCourse/:id", AuthMiddleware, async (req, res) => {
  const id = req.params.id;

  try {
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }

    req.io.emit("courseDeleted", course);

    res.status(201).json({ msg: "Course deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ msg: "Error deleting course" });
  }
});

router.get("/getTimetable", AuthMiddleware, async (req, res) => {
  try {
    const lecturerId = req.user._id;

    const courses = await Course.find({ lecturer: lecturerId });
    const courseIds = courses.map((c) => c._id);

    const timetable = await Timetable.find({ course: { $in: courseIds } })
      .populate("course", "title code")
      .populate("venue", "name");

    res.status(200).json({ timetable });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error fetching timetable" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  res.json({ msg: "Logged out successfully" });
});

export default router;
