import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["admin", "lecturer"] },
});

userSchema.pre("save", async (next) => {
  if (!this.isModified("password")) return next;
  this.password = bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("User", userSchema);
