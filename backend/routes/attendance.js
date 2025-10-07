import express from "express";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import protect from "../utils/authMiddleware.js";

const router = express.Router();

// POST /api/attendance/mark
router.post("/mark", protect, async (req, res) => {
  try {
    const { classId, records } = req.body;
    if (!classId || !Array.isArray(records)) {
      return res.status(400).json({ message: "classId and records are required" });
    }

    const date = new Date().toISOString().split("T")[0];

    // Prevent duplicate for same class+date
    const existing = await Attendance.findOne({ classId, date });
    if (existing) {
      return res.status(400).json({ message: "Attendance already marked today" });
    }

    const attendance = await Attendance.create({ classId, date, records });

    // Update students' attendance arrays (optional)
    // Use Promise.all for concurrency
    await Promise.all(records.map(r =>
      Student.findByIdAndUpdate(r.studentId, {
        $push: { attendance: { date, present: r.present } }
      })
    ));

    res.status(201).json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving attendance" });
  }
});

// GET /api/attendance/class/:classId
router.get("/class/:classId", protect, async (req, res) => {
  try {
    const { classId } = req.params;
    const records = await Attendance.find({ classId }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching records" });
  }
});

export default router;
