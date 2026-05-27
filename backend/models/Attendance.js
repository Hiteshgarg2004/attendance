import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    attendanceDate: {
      type: String,
      required: true,
      index: true,
    },
    present: {
      type: Boolean,
      default: false,
    },
    // Anti-cheating fields
    ipAddress: {
      type: String,
    },
    deviceId: {
      type: String,
    },
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      accuracy: {
        type: Number,
      },
    },
    userAgent: {
      type: String,
    },
    scanTimestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate attendance records per student per class per day.
attendanceSchema.index(
  { classId: 1, studentId: 1, attendanceDate: 1 },
  { unique: true }
);

attendanceSchema.index({ classId: 1, createdAt: -1 });
attendanceSchema.index({ studentId: 1, createdAt: -1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
