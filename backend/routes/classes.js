import express from "express";
import Class from "../models/Class.js";
import protect from "../utils/authMiddleware.js";

const router = express.Router();

// ✅ Get all classes for a teacher
router.get("/", protect, async (req, res) => {
  try {
  const classes = await Class.find({ teacherId: req.teacher._id });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching classes" });
  }
});

// ✅ Create a new class
router.post("/", protect, async (req, res) => {
  try {
    const newClass = await Class.create({
      ...req.body,
      teacherId: req.teacher._id,
    });
    res.json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating class" });
  }
});


// DELETE a class by ID
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted', class: deleted });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting class' });
  }
});

export default router;
