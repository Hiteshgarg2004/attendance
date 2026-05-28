import express from "express";
import crypto from "crypto";
import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";
import QrSession from "../models/QrSession.js";
import protect from "../utils/auth.js";

const router = express.Router();

// Secret key for QR signature
const QR_SECRET =
  process.env.QR_SECRET || "attendance-secret-key-2024";

// Frontend URL from environment or default
const FRONTEND_URL = process.env.FRONTEND_URL || "https://attendance-oo1a.vercel.app";

/**
 * Generate cryptographic signature for QR token
 */
function generateSignature(classId, timestamp) {
  const data = `${classId}:${timestamp}`;

  return crypto
    .createHmac("sha256", QR_SECRET)
    .update(data)
    .digest("hex");
}

/**
 * Verify QR token signature
 */
function verifySignature(
  token,
  classId,
  timestamp,
  signature
) {
  const expectedSignature = generateSignature(
    classId,
    timestamp
  );

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    signatureBuffer,
    expectedBuffer
  );
}

function getDateRange(date) {
  const [year, month, day] = date.split("-").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error("Invalid date format");
  }

  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

function getAttendanceQuery(date) {
  const { startOfDay, endOfDay } = getDateRange(date);

  return {
    $or: [
      { attendanceDate: date },
      {
        attendanceDate: { $exists: false },
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    ],
  };
}

/* =========================================================
   STATIC ROUTES FIRST
========================================================= */

/**
 * @route   POST /api/attendance/qr/verify
 * @desc    Verify QR and mark attendance
 */
router.post("/qr/verify", async (req, res) => {
  const {
    token,
    rollNo,
    name,
    signature,
    timestamp,
    deviceId,
    location,
  } = req.body;

  if (!token || !rollNo) {
    return res.status(400).json({
      message: "Token and roll number are required",
    });
  }

  const ipAddress =
    req.ip ||
    req.connection.remoteAddress ||
    req.headers["x-forwarded-for"]
      ?.split(",")[0]
      ?.trim() ||
    "unknown";

  const userAgent =
    req.headers["user-agent"] || "unknown";

  try {
    console.log(
      "Verifying attendance, token:",
      token,
      "rollNo:",
      rollNo
    );

    const session = await QrSession.findOne({
      token,
      isActive: true,
    });

    if (!session) {
      return res.status(400).json({
        message: "Invalid or expired QR code",
      });
    }

    if (Date.now() > session.expiresAt.getTime()) {
      session.isActive = false;
      await session.save();

      return res.status(400).json({
        message: "QR code has expired",
      });
    }

    const now = Date.now();

    if (
      session.startTime &&
      now < session.startTime.getTime()
    ) {
      return res.status(400).json({
        message:
          "QR code not yet active.",
      });
    }

    if (
      session.endTime &&
      now > session.endTime.getTime()
    ) {
      session.isActive = false;
      await session.save();

      return res.status(400).json({
        message:
          "QR code has expired.",
      });
    }

    if (signature && timestamp) {
      const isValidSignature =
        verifySignature(
          token,
          session.classId.toString(),
          timestamp,
          signature
        );

      const isMatchingTimestamp =
        String(session.qrTimestamp) ===
        String(timestamp);

      if (
        !isValidSignature ||
        !isMatchingTimestamp
      ) {
        return res.status(400).json({
          message: "Invalid QR signature",
        });
      }
    }

    const cls = await Class.findById(
      session.classId
    ).populate("students");

    if (!cls) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    const student = cls.students.find(
      (s) =>
        s.rollNo &&
        s.rollNo
          .toString()
          .toLowerCase() ===
          rollNo.toString().toLowerCase()
    );

    if (!student) {
      return res.status(404).json({
        message:
          "Student not found in this class",
      });
    }

    if (
      session.studentsMarked.some(
        (markedStudentId) =>
          markedStudentId.toString() ===
          student._id.toString()
      )
    ) {
      return res.status(400).json({
        message:
          "Attendance already marked for this session",
      });
    }

    const attendanceDate = new Date()
      .toISOString()
      .slice(0, 10);

    const existingAttendance =
      await Attendance.findOne({
        studentId: student._id,
        classId: session.classId,
        attendanceDate,
      });

    if (existingAttendance) {
      return res.status(400).json({
        message:
          "Attendance already marked for today",
      });
    }

    await Attendance.create({
      classId: session.classId,
      studentId: student._id,
      attendanceDate,
      present: true,
      ipAddress,
      deviceId: deviceId || null,
      location: location || null,
      userAgent,
      scanTimestamp: new Date(),
    });

    session.studentsMarked.push(student._id);
    await session.save();

    res.json({
      success: true,
      message: `Attendance marked for ${student.name}`,
      studentName: student.name,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message:
          "Attendance already marked for today",
      });
    }

    console.error(
      "Verify Error:",
      err.message,
      err.stack
    );

    res.status(500).json({
      message:
        "Server error while verifying attendance",
      error: err.message,
    });
  }
});

/**
    const { date } = req.query;



    try {
      if (!date) {
        return res.status(400).json({
          message: "Date is required",
        });
      }

      const { startOfDay, endOfDay } = getDateRange(date);

      const classes = await Class.find({
        teacherId: req.teacher._id,
      });

      const byBatch = new Map();

      for (const cls of classes) {
        const totalStudents =
          cls.students?.length || 0;

        if (totalStudents === 0) continue;

        const records =
          await Attendance.find({
            classId: cls._id,
            createdAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          });

        const hasAttendance =
          records.length > 0;

        const presentCount =
          records.reduce(
            (acc, r) =>
              acc + (r.present ? 1 : 0),
            0
          );

        const batchKey =
          cls.academicYear;

        if (!byBatch.has(batchKey)) {
          byBatch.set(batchKey, {
            academicYear: batchKey,
            classesAttended: 0,
            totalStudentsConsidered: 0,
            presentTotal: 0,
          });
        }

        const b = byBatch.get(batchKey);

        if (hasAttendance) {
          b.classesAttended += 1;
          b.totalStudentsConsidered +=
            totalStudents;
          b.presentTotal += presentCount;
        }
      }

      const batches = Array.from(
        byBatch.values()
      ).map((b) => {
        const attendancePercent =
          b.totalStudentsConsidered > 0
            ? (b.presentTotal /
                b.totalStudentsConsidered) *
              100
            : 0;

        return {
          academicYear: b.academicYear,
          classesAttended:
            b.classesAttended,
          attendancePercent,
          totalStudentsConsidered:
            b.totalStudentsConsidered,
        };
      });

      res.json({ date, batches });
    } catch (err) {
      console.error(
        "Error fetching batch summary:",
        err
      );

      res.status(500).json({
        message:
          "Server error while fetching batch attendance",
      });
    }
  }
);

/**
 * @route   POST /api/attendance/mark
 * @desc    Manual attendance entry
 */
router.post(
  "/mark",
  protect,
  async (req, res) => {
    const {
      classId,
      date,
      records,
    } = req.body;

    if (!classId || !records) {
      return res.status(400).json({
        message:
          "Class ID and records are required",
      });
    }

    try {
      console.log(
        "[POST /mark]",
        classId
      );

      const { startOfDay, endOfDay } = getDateRange(date);

      await Attendance.deleteMany({
        classId,
        $or: [
          { attendanceDate: date },
          {
            attendanceDate: { $exists: false },
            createdAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
        ],
      });

      const cls = await Class.findById(
        classId
      ).populate("students");

      if (!cls) {
        return res.status(404).json({
          message: "Class not found",
        });
      }

      const presentMap = new Map();

      records.forEach((r) => {
        if (r.studentId) {
          presentMap.set(
            r.studentId.toString(),
            r.present
          );
        }
      });

      const docs = cls.students.map(
        (student) => ({
          classId,
          studentId: student._id,
          attendanceDate: date,
          present: presentMap.has(
            student._id.toString()
          )
            ? presentMap.get(
                student._id.toString()
              )
            : false,
          ipAddress: "manual-entry",
          userAgent:
            "teacher-dashboard",
        })
      );

      await Attendance.insertMany(docs);

      res.json({
        message:
          "Attendance saved successfully!",
      });
    } catch (err) {
      console.error(
        "Error saving attendance:",
        err
      );

      res.status(500).json({
        message:
          "Server error while saving attendance",
        details: {
          message: err?.message,
          name: err?.name,
          code: err?.code,
        },
      });
    }
  }
);

/**
 * @route   GET /api/attendance
 */
router.get("/", async (req, res) => {
  const { classId, date } = req.query;

  if (!classId || !date) {
    return res.status(400).json({
      message:
        "Class ID and date are required",
    });
  }

  try {
    const { startOfDay, endOfDay } = getDateRange(date);

    const records = await Attendance.find({
      classId,
      $or: [
        { attendanceDate: date },
        {
          attendanceDate: { $exists: false },
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      ],
    }).populate("studentId", "name rollNo");

    const transformedRecords =
      records.map((r) => ({
        student: {
          ...r.studentId.toObject(),
          rollNumber:
            r.studentId.rollNo,
        },
        present: r.present,
      }));

    res.json({
      records: transformedRecords,
    });
  } catch (err) {
    console.error(
      "Error fetching attendance:",
      err
    );

    res.status(500).json({
      message:
        "Server error while fetching attendance",
    });
  }
});

/* =========================================================
   DYNAMIC ROUTES LAST
========================================================= */

/**
 * @route   POST /api/attendance/:classId
 */
router.post(
  "/:classId",
  protect,
  async (req, res) => {
    const { classId } = req.params;
    const { records } = req.body;

    try {
      await Attendance.deleteMany({
        classId,
      });

      const docs = records.map((r) => ({
        classId,
        studentId: r.studentId,
        present: r.present,
        ipAddress: "manual-entry",
        userAgent: "teacher-dashboard",
      }));

      await Attendance.insertMany(docs);

      res.json({
        message:
          "Attendance saved successfully!",
      });
    } catch (err) {
      console.error(
        "Error saving attendance:",
        err
      );

      res.status(500).json({
        message:
          "Server error while saving attendance",
      });
    }
  }
);

/**
 * @route   POST /api/attendance/:classId/qr/generate
 */
router.post(
  "/:classId/qr/generate",
  protect,
  async (req, res) => {
    const { classId } = req.params;

    const {
      validityMinutes = 5,
      startTime,
      endTime,
    } = req.body;

    try {
      console.log(
        "QR Generate - classId:",
        classId
      );

      const cls = await Class.findById(
        classId
      );

      if (!cls) {
        return res.status(404).json({
          message: "Class not found",
        });
      }

      const timestamp = Date.now();
      const validityMs =
        validityMinutes * 60 * 1000;

      const sessionToken = `${classId}-${timestamp}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const signature =
        generateSignature(
          classId,
          timestamp
        );

      const scanStartTime = startTime
        ? new Date(startTime)
        : null;

      const effectiveStartTime =
        scanStartTime?.getTime() ??
        Date.now();

      const scanEndTime = endTime
        ? new Date(endTime)
        : new Date(
            effectiveStartTime +
              validityMs
          );

      await QrSession.updateMany(
        {
          classId,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
            endTime: new Date(),
            expiresAt: new Date(),
          },
        }
      );

      const session = await QrSession.create({
        token: sessionToken,
        classId,
        teacherId: req.teacher?._id,
        qrTimestamp: timestamp,
        expiresAt: scanEndTime,
        startTime: scanStartTime,
        endTime: scanEndTime,
        studentsMarked: [],
      });

      // Create QR data object
      const qrTokenData = {
        token: sessionToken,
        classId,
        timestamp,
        signature,
      };

      const qrSearchParams = new URLSearchParams({
        token: sessionToken,
        classId,
        timestamp: String(timestamp),
        signature,
      });

      // Generate the full URL that should be embedded in the QR code
      const attendanceUrl = `${FRONTEND_URL.replace(/\/$/, "")}/student?${qrSearchParams.toString()}`;

      res.json({
        sessionToken,
        expiresAt:
          session.expiresAt.getTime(),
        scanStartTime:
          session.startTime?.getTime() ||
          null,
        scanEndTime:
          session.endTime?.getTime() ||
          null,
        qrData: attendanceUrl, // This is the URL to be embedded in QR
        qrTokenData, // Raw data for debugging
      });
    } catch (err) {
      console.error(
        "QR Generate Error:",
        err
      );

      res.status(500).json({
        message:
          "Server error while generating QR",
      });
    }
  }
);

router.post(
  "/:classId/qr/stop",
  protect,
  async (req, res) => {
    const { classId } = req.params;

    try {
      await QrSession.updateMany(
        {
          classId,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
            endTime: new Date(),
            expiresAt: new Date(),
          },
        }
      );

      res.json({
        success: true,
        message:
          "QR session stopped successfully",
      });
    } catch (err) {
      console.error(
        "Stop QR Error:",
        err
      );

      res.status(500).json({
        message:
          "Server error while stopping QR",
      });
    }
  }
);

/**
 * @route   GET /api/attendance/:classId/qr/status
 */
router.get(
  "/:classId/qr/status",
  protect,
  async (req, res) => {
    const { classId } = req.params;

    try {
      const activeSession =
        await QrSession.findOne({
          classId,
          isActive: true,
          expiresAt: {
            $gt: new Date(),
          },
        }).sort({ createdAt: -1 });

      if (!activeSession) {
        return res.json({
          active: false,
        });
      }

      const cls = await Class.findById(
        classId
      ).populate("students");

      const markedStudents =
        activeSession.studentsMarked
          .map((markedId) => {
            const student =
              cls.students.find(
                (s) =>
                  s._id.toString() ===
                  markedId
              );

            return student
              ? {
                  rollNumber:
                    student.rollNo,
                  name: student.name,
                }
              : null;
          })
          .filter(Boolean);

      res.json({
        active: true,
        expiresAt:
          activeSession.expiresAt.getTime(),
        markedCount:
          markedStudents.length,
        students: markedStudents,
      });
    } catch (err) {
      console.error(
        "Get Status Error:",
        err
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/**
 * @route   GET /api/attendance/:classId
 */
router.get("/:classId", async (req, res) => {
  const { classId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      message: "Date is required",
    });
  }

  try {
    const { startOfDay, endOfDay } = getDateRange(date);

    const records = await Attendance.find({
      classId,
      $or: [
        { attendanceDate: date },
        {
          attendanceDate: { $exists: false },
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      ],
    }).populate("studentId", "name rollNo");

    const transformedRecords =
      records.map((r) => ({
        student: {
          ...r.studentId.toObject(),
          rollNumber:
            r.studentId.rollNo,
        },
        present: r.present,
      }));

    res.json({
      records: transformedRecords,
    });
  } catch (err) {
    console.error(
      "Error fetching attendance:",
      err
    );

    res.status(500).json({
      message:
        "Server error while fetching attendance",
    });
  }
});

export default router;
