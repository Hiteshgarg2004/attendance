import express from "express";
import Student from "../models/Student.js";
import StudentMaster from "../models/StudentMaster.js";
import Class from "../models/Class.js";
import protect from "../utils/auth.js";

const router = express.Router();

// Get students by year
router.get("/year/:year", protect, async (req, res) => {
  const year = +req.params.year;
  const students = await Student.find({ academicYear: year });
  res.json(students);
});

// Get students for a specific class (sorted by rollNo)
router.get("/", async (req, res) => {
  const { classId } = req.query;
  
  if (!classId) {
    return res.status(400).json({ message: "Class ID is required" });
  }

  try {
    // Get the class with populated students
    const cls = await Class.findById(classId).populate("students");
    
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Transform to include rollNumber field and sort by rollNo
    const students = cls.students.map(s => ({
      _id: s._id,
      name: s.name,
      rollNo: s.rollNo,
      rollNumber: s.rollNo, // For compatibility with frontend
      academicYear: s.academicYear
    }));

    // Sort by roll number
    students.sort((a, b) => {
      const numA = parseInt(a.rollNo);
      const numB = parseInt(b.rollNo);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.rollNo.localeCompare(b.rollNo);
    });

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a new student
router.post("/", protect, async (req, res) => {
  try {
    const { name, rollNo, academicYear, classId } = req.body;

    // Create student in Student collection
    const student = await Student.create({
      name,
      rollNo,
      academicYear
    });

    // Also add to StudentMaster for consistency
    await StudentMaster.findOneAndUpdate(
      { rollNo },
      { name, rollNo, academicYear },
      { upsert: true, new: true }
    );

    // If classId is provided, add student to that class
    if (classId) {
      await Class.findByIdAndUpdate(classId, {
        $addToSet: { students: student._id }
      });
    }

    res.status(201).json(student);
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
