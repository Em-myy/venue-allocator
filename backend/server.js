import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import userRoutes from "./routes/userAuthentication.js";
import adminRoutes from "./routes/admin.js";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();
const server = express();

server.use(express.json());
server.use(cookieParser());
server.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

server.use("/api/authentication", userRoutes);
server.use("/api/admin", adminRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    server.listen(3000, () => {
      console.log("Server is listening on port 3000");
    });
  })
  .catch((error) => {
    console.log(error);
  });
