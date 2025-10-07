import express from "express";
import Student from "../models/Student.js";
import protect from "../utils/authMiddleware.js";

const router = express.Router();

// ✅ Get all students for a specific class
router.get("/class/:classId", protect, async (req, res) => {
  try {
    const students = await Student.find({ classId: req.params.classId });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students" });
  }
});

// ✅ Add new student to class
router.post("/", protect, async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: "Error adding student" });
  }
});


// DELETE a student by ID
router.delete('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted', student });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student' });
  }
});

export default router;
