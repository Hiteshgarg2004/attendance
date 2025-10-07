import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  },
  { timestamps: true } // ✅ automatically track createdAt/updatedAt
);

const Class = mongoose.model("Class", classSchema);

export default Class;
