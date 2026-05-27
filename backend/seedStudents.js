// seedStudents.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "./models/Student.js"; // make sure this path is correct

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// List of students
const students = [
  { rollNo: "22112082", name: "VANSHIKA SAINI" },
  { rollNo: "22126010", name: "ANUPAM" },
  { rollNo: "22126055", name: "SHUBHI GULATI" },
  { rollNo: "22126038", name: "PALLI SRAVANEE" },
  { rollNo: "22126054", name: "SHRUTI TIWARI" },
  { rollNo: "22126003", name: "ABHINAV ANAND" },
  { rollNo: "22126007", name: "ANKIT" },
  { rollNo: "22126037", name: "MUSKAN" },
  { rollNo: "22126033", name: "MANISH KUMAR" },
  { rollNo: "22126011", name: "ARCHIT AGGARWAL" },
  { rollNo: "22126025", name: "HITESH GARG" },
  { rollNo: "22126026", name: "JITESH BANSAL" },
  { rollNo: "22126061", name: "VISHAL GUPTA" },
  { rollNo: "22126053", name: "SHIKHA GUPTA" },
  { rollNo: "22126039", name: "PARTH BAJPAI" },
  { rollNo: "22126027", name: "JOYJEET BANERJEE" },
  { rollNo: "22126056", name: "SUDHAKAR" },
  { rollNo: "22126049", name: "RIYA" },
  { rollNo: "22126020", name: "DINESH KUMAR KATARIA" },
  { rollNo: "22126030", name: "KRITIKA" },
  // Add remaining students...
];

// Assign academicYear
const studentsWithYear = students.map((s) => ({ ...s, academicYear: 2022 }));

// Seed students into DB
const seedStudents = async () => {
  try {
    await Student.insertMany(studentsWithYear);
    console.log("✅ Students seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding students:", err);
  } finally {
    mongoose.connection.close();
  }
};

seedStudents();
