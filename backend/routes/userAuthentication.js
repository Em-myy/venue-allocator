import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";

const router = express.Router();

const createAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
};

const createRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

router.post("/register", async (req, res) => {
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
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.json({ msg: "User not registered..... Please go and register" });

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
  });

  res.status(200).json({ msg: "Login Successful" });
});

router.post("/profile", (req, res) => {
  res.json({ user: req.user });
});
