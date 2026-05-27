import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  name: { type: String, required: true },
  academicYear: { type: Number, required: true }
}, { timestamps: true });

const Student = mongoose.model("Student", studentSchema);
export default Student;
