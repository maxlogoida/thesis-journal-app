import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { User } from "./models/User";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import subjectRoutes from "./routes/subjects";
import groupRoutes from "./routes/groups";
import studentSubjectRoutes from "./routes/studentSubjects";
import scheduleRoutes from "./routes/schedule";
import gradeRoutes from "./routes/grades";
import notificationRoutes from "./routes/notifications";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI!);
  isConnected = true;
  const exists = await User.findOne({ role: "super_admin" });
  if (!exists) {
    await User.create({
      full_name: "Адміністратор",
      email: "admin@school.edu",
      password: "admin123",
      role: "super_admin",
    });
  }
}

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    next(e);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/student-subjects", studentSubjectRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/notifications", notificationRoutes);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT ?? 4000;
  connectDB()
    .then(() => {
      app.listen(PORT, () =>
        console.log(`Server running on http://localhost:${PORT}`),
      );
    })
    .catch(console.error);
}

export default app;
