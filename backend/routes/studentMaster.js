import express from "express";
import StudentMaster from "../models/StudentMaster.js";

const router = express.Router();

// Get students by academic year
router.get("/year/:year", async (req, res) => {
  const students = await StudentMaster.find({
    academicYear: Number(req.params.year)
  });
  res.json(students);
});

export default router;
