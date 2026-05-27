import mongoose from "mongoose";

const studentMasterSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  name: { type: String, required: true },
  academicYear: { type: Number, required: true },
});

export default mongoose.model("StudentMaster", studentMasterSchema);
