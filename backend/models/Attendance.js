import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    date: { type: Date, required: true },  // ✅ store as Date instead of string
    records: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        present: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true } // ✅ adds createdAt & updatedAt
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
