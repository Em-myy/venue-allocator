import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const AuthMiddleware = async (req, res, next) => {
  let token = req.cookies.accessToken;

  // If cookie is missing, check the Authorization header (Bearer token)
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Format is "Bearer <token>"
    token = req.headers.authorization.split(" ")[1];
  }

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
