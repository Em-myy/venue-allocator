import express from "express";
import jwt from "jsonwebtoken";
import { AuthMiddleware } from "../middleware/authMiddleware.js";
import { GenerateTimetable } from "../controller/allocationController.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Course from "../models/Course.js";
import Venue from "../models/Venue.js";
import Timetable from "../models/Timetable.js";

const router = express.Router();

const createAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
};

const createRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

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

    req.io.emit("adminApproved", {
      userId: user._id,
      username: user.username,
      role: "admin",
    });

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

    req.io.emit("adminRejected", {
      userId: user._id,
      username: user.username,
      role: "lecturer",
    });

    res.status(201).json({ msg: "Rejected" });
  } catch (error) {
    res.status(404).json({ msg: "User not approved" });
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

router.get("/getCourses", async (req, res) => {
  try {
    const courses = await Course.find().populate("lecturer", "username");

    res.status(200).json({ courses });
  } catch (error) {
    console.log(error);
  }
});

router.post("/createVenue", AuthMiddleware, async (req, res) => {
  try {
    const { name, capacity, type, resources } = req.body;

    const existingVenue = await Venue.findOne({ name });

    if (existingVenue) {
      return res.status(401).json({ msg: "Venue already exists" });
    }

    const venue = new Venue({ name, capacity, type, resources });
    await venue.save();

    req.io.emit("venueAdded", venue);

    res.status(201).json({ venue });
  } catch (error) {
    console.log(error);
  }
});

router.get("/getVenues", AuthMiddleware, async (req, res) => {
  try {
    const venues = await Venue.find();
    res.status(201).json({ venues });
  } catch (error) {
    console.log(error);
  }
});

router.get("/venueDetails/:id", AuthMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const venue = await Venue.findById(id);

    res.status(201).json({ venue });
  } catch (error) {
    console.log(error);
    res.status(404).json({ msg: "Venue not found" });
  }
});

router.patch("/editVenue/:id", AuthMiddleware, async (req, res) => {
  const id = req.params.id;

  try {
    const updatedVenue = await Venue.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    req.io.emit("venueUpdated", updatedVenue);

    res.status(200).json({ msg: "Venue updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ msg: "Error updating venue" });
  }
});

router.delete("/deleteVenue/:id", AuthMiddleware, async (req, res) => {
  const id = req.params.id;

  try {
    const venue = await Venue.findByIdAndDelete(id);

    if (!venue) {
      return res.status(404).json({ msg: "Venue not found" });
    }

    req.io.emit("venueDeleted", venue);

    res.status(201).json({ msg: "Venue deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ msg: "Error deleting venue" });
  }
});

router.delete("/deleteCourse/:id", AuthMiddleware, async (req, res) => {
  const id = req.params.id;

  try {
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({ msg: "COurse not found" });
    }

    req.io.emit("adminCourseDeleted", course);

    res.status(201).json({ msg: "Course deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ msg: "Error deleting venue" });
  }
});

router.get("/generate", async (req, res) => {
  try {
    const result = await GenerateTimetable();

    req.io.emit("timetableUpdated", {
      timetable: result.generated,
      unallocated: result.unallocated,
    });

    res.status(200).json({
      msg: "Timetable created",
      timetable: result.generated,
      unallocated: result.unallocated,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Failed to create timetables" });
  }
});

router.get("/getTimetable", async (req, res) => {
  try {
    const timetable = await Timetable.find()
      .populate("course", "title code")
      .populate("venue", "name");
    res.status(200).json({ timetable });
  } catch (error) {
    console.log(error);
  }
});

export default router;
