import express from "express";
import jwt from "jsonwebtoken";
import Teacher from "../models/Teacher.js";

const router = express.Router();

// helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * @route   POST /api/teachers/signup
 * @desc    Register a new teacher
 */
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    // check if teacher already exists
    const existingTeacher = await Teacher.findOne({ username });
    if (existingTeacher) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const teacher = await Teacher.create({ username, password });

    res.status(201).json({
      _id: teacher._id,
      username: teacher.username,
      token: generateToken(teacher._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while signing up", error });
  }
});

/**
 * @route   POST /api/teachers/login
 * @desc    Login teacher
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ username });

    if (teacher && (await teacher.matchPassword(password))) {
      res.json({
        _id: teacher._id,
        username: teacher.username,
        token: generateToken(teacher._id),
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error while logging in", error });
  }
});

/**
 * @route   GET /api/teachers/verify
 * @desc    Verify JWT token
 */
router.get("/verify", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teacher = await Teacher.findById(decoded.id).select("-password");
    
    if (!teacher) {
      return res.status(401).json({ message: "Teacher not found" });
    }
    
    res.json({ teacher });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
