import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./routes/auth.js";
import classRoutes from "./routes/classes.js";
import studentRoutes from "./routes/students.js";
import attendanceRoutes from "./routes/attendance.js";
import studentMasterRoutes from "./routes/studentMaster.js";
import attendanceBatchStudentsRoutes from "./routes/attendance-batch-students.js";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv from the correct path
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

// Middleware
app.use(
  cors({
    origin: ["https://attendance-fw8v.onrender.com"],
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/teachers", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/students", studentRoutes);
app.use("/students", studentMasterRoutes);
app.use("/api/attendance", attendanceBatchStudentsRoutes);
app.use("/api/attendance", attendanceRoutes);


// Root endpoint
app.get("/", (req, res) => {
  res.send("Attendance Project API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
