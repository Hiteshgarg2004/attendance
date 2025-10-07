import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  attendance: [
    {
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ["Present", "Absent"], default: "Absent" },
    },
  ],
});

const Student = mongoose.model("Student", studentSchema);

export default Student;   // ✅ default export
