import express from "express";
import Class from "../models/Class.js";
import Student from "../models/Student.js";
import StudentMaster from "../models/StudentMaster.js";
import protect from "../utils/auth.js";

const router = express.Router();

// Helper function to sort by roll number
function sortByRollNo(rollNoToIdMap) {
  const sortedRollNos = Array.from(rollNoToIdMap.keys()).sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
  return sortedRollNos.map(rollNo => rollNoToIdMap.get(rollNo));
}

/**
 * @route   POST /api/classes
 * @desc    Create a new class and auto-link students of that academic year
 */
router.post("/", protect, async (req, res) => {
  try {
    const { name, academicYear, date } = req.body;

    // Find all students of this academic year from BOTH Student and StudentMaster models
    const studentDocs = await Student.find({ academicYear });
    const studentMasterDocs = await StudentMaster.find({ academicYear });
    
    // Combine and deduplicate by rollNo, then find corresponding Student IDs
    const rollNoToIdMap = new Map();
    
    // First add all students from Student model
    studentDocs.forEach(s => {
      rollNoToIdMap.set(s.rollNo, s._id);
    });
    
    // Then add students from StudentMaster that don't exist in Student
    for (const sm of studentMasterDocs) {
      if (!rollNoToIdMap.has(sm.rollNo)) {
        const existingStudent = await Student.findOne({ rollNo: sm.rollNo });
        if (existingStudent) {
          rollNoToIdMap.set(sm.rollNo, existingStudent._id);
        } else {
          const newStudent = await Student.create({
            rollNo: sm.rollNo,
            name: sm.name,
            academicYear: sm.academicYear
          });
          rollNoToIdMap.set(sm.rollNo, newStudent._id);
        }
      }
    }
    
    // Sort by roll number
    const studentIds = sortByRollNo(rollNoToIdMap);

    const newClass = await Class.create({
      name,
      academicYear,
      date,
      teacherId: req.teacher._id,
      students: studentIds,
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/classes
 * @desc    Get all classes for the logged-in teacher
 */
router.get("/", protect, async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.teacher._id });
    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/classes/:id
 * @desc    Get a single class with populated students (sorted by rollNo)
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).populate("students");
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // Sort students by rollNo
    cls.students.sort((a, b) => {
      const numA = parseInt(a.rollNo);
      const numB = parseInt(b.rollNo);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.rollNo.localeCompare(b.rollNo);
    });

    res.json(cls);
  } catch (error) {
    console.error("Error fetching class:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT /api/classes/:id/refresh-students
 * @desc    Refresh/add missing students to a class from both Student and StudentMaster
 */
router.put("/:id/refresh-students", protect, async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const academicYear = cls.academicYear;
    
    const studentDocs = await Student.find({ academicYear });
    const studentMasterDocs = await StudentMaster.find({ academicYear });
    
    const rollNoToIdMap = new Map();
    
    // Add existing class students
    for (const sId of cls.students) {
      const student = await Student.findById(sId);
      if (student) {
        rollNoToIdMap.set(student.rollNo, student._id);
      }
    }
    
    // Add students from Student model
    studentDocs.forEach(s => {
      rollNoToIdMap.set(s.rollNo, s._id);
    });
    
    // Add students from StudentMaster
    for (const sm of studentMasterDocs) {
      const existingStudent = await Student.findOne({ rollNo: sm.rollNo });
      if (existingStudent) {
        rollNoToIdMap.set(existingStudent.rollNo, existingStudent._id);
      } else {
        const newStudent = await Student.create({
          rollNo: sm.rollNo,
          name: sm.name,
          academicYear: sm.academicYear
        });
        rollNoToIdMap.set(newStudent.rollNo, newStudent._id);
      }
    }
    
    // Sort and update class
    const allStudentIds = sortByRollNo(rollNoToIdMap);
    cls.students = allStudentIds;
    await cls.save();
    
    const updatedClass = await Class.findById(req.params.id).populate("students");
    
    // Sort populated students
    updatedClass.students.sort((a, b) => {
      const numA = parseInt(a.rollNo);
      const numB = parseInt(b.rollNo);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.rollNo.localeCompare(b.rollNo);
    });
    
    res.json({ 
      message: `Class updated with ${allStudentIds.length} students`,
      class: updatedClass 
    });
  } catch (error) {
    console.error("Error refreshing students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   DELETE /api/classes/:id
 * @desc    Delete a class
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Class not found" });

    res.json({ message: "Class deleted" });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
