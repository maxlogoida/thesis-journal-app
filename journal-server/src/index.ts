import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { User } from "./models/User";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";

const app = express();
app.use(cors());
app.use(express.json());

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI!);
  isConnected = true;
  console.log("MongoDB connected");

  const exists = await User.findOne({ role: "super_admin" });
  if (!exists) {
    await User.create({
      full_name: "Адміністратор",
      email: "admin@school.edu",
      password: "admin123",
      role: "super_admin",
    });
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

export default app;
