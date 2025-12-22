import jwt from "jsonwebtoken";
import User from "../models/User";

export const AuthMiddleware = async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) return res.status(401).json({ msg: "Invalid Credentials" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(401).json({ msg: "User no longer exists" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token has expired" });
  }
};
