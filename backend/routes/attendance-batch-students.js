import express from "express";
import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";
import protect from "../utils/auth.js";

const router = express.Router();

function unique(arr) {
  return Array.from(new Set(arr));
}

/**
 * GET /api/attendance/batch-students?date=YYYY-MM-DD
 * Returns student-level attendance grouped by academicYear/batch for the given date.
 *
 * NOTE: Batch is treated as academicYear.
 */
router.get("/batch-students", protect, async (req, res) => {
  const { date } = req.query;

  try {
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const classes = await Class.find({ teacherId: req.teacher._id }).populate(
      "students"
    );

    const academicYears = unique(
      classes.map((c) => c.academicYear).filter(Boolean)
    );

    const classIds = classes.map((c) => c._id);

    const [year, month, day] = date.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      classId: { $in: classIds },
      $or: [
        { attendanceDate: date },
        {
          attendanceDate: { $exists: false },
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      ],
    }).populate("studentId", "name rollNo");

    // Map studentId -> present (if any attendance record exists for the day, present is taken from that record)
    // If multiple class records exist for same student on the same day, we treat present as OR.
    const studentPresentMap = new Map();

    for (const r of attendanceRecords) {
      const sid = r.studentId?._id?.toString?.();
      if (!sid) continue;

      const prev = studentPresentMap.get(sid);
      const next = Boolean(r.present);
      studentPresentMap.set(sid, prev ? true : next);
    }

    const batches = academicYears.map((academicYear) => {
      const batchClasses = classes.filter((c) => c.academicYear === academicYear);

      // Gather unique students in this batch (academicYear)
      const studentMap = new Map();
      for (const cls of batchClasses) {
        for (const st of cls.students || []) {
          if (!st?._id) continue;
          const sid = st._id.toString();
          if (!studentMap.has(sid)) {
            studentMap.set(sid, st);
          }
        }
      }

      const students = Array.from(studentMap.values())
        .map((st) => {
          const sid = st._id.toString();
          return {
            studentId: st._id,
            rollNo: st.rollNo,
            name: st.name,
            present: studentPresentMap.has(sid)
              ? studentPresentMap.get(sid)
              : false,
          };
        })
        .sort((a, b) => {
          const na = parseInt(a.rollNo);
          const nb = parseInt(b.rollNo);
          if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
          return String(a.rollNo).localeCompare(String(b.rollNo));
        });

      return {
        academicYear,
        students,
      };
    });

    res.json({ date, batches });
  } catch (err) {
    console.error("Error fetching batch students attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/batch-summary", protect, async (req, res) => {
  const { date } = req.query;

  try {
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const classes = await Class.find({ teacherId: req.teacher._id }).populate(
      "students"
    );

    const classIds = classes.map((c) => c._id);

    const attendanceRecords = await Attendance.find({
      classId: { $in: classIds },
      attendanceDate: date,
    });

    const recordsByClass = new Map();
    attendanceRecords.forEach((record) => {
      const classId = record.classId?.toString();
      if (!classId) return;
      if (!recordsByClass.has(classId)) {
        recordsByClass.set(classId, []);
      }
      recordsByClass.get(classId).push(record);
    });

    const byBatch = new Map();

    for (const cls of classes) {
      const totalStudents = cls.students?.length || 0;
      const records = recordsByClass.get(cls._id.toString()) || [];
      const hasAttendance = records.length > 0;
      const presentCount = records.reduce(
        (acc, r) => acc + (r.present ? 1 : 0),
        0
      );
      const batchKey = cls.academicYear || "Unknown";

      if (!byBatch.has(batchKey)) {
        byBatch.set(batchKey, {
          academicYear: batchKey,
          classesAttended: 0,
          totalStudentsConsidered: 0,
          presentTotal: 0,
        });
      }

      const batch = byBatch.get(batchKey);

      if (hasAttendance) {
        batch.classesAttended += 1;
        batch.totalStudentsConsidered += totalStudents;
        batch.presentTotal += presentCount;
      }
    }

    const batches = Array.from(byBatch.values()).map((b) => ({
      academicYear: b.academicYear,
      classesAttended: b.classesAttended,
      attendancePercent:
        b.totalStudentsConsidered > 0
          ? (b.presentTotal / b.totalStudentsConsidered) * 100
          : 0,
      totalStudentsConsidered: b.totalStudentsConsidered,
    }));

    res.json({ date, batches });
  } catch (err) {
    console.error("Error fetching batch summary:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

