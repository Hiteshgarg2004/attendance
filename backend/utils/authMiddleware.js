import jwt from "jsonwebtoken";
import Teacher from "../models/Teacher.js";

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teacher = await Teacher.findById(decoded.id).select("-password");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    req.teacher = teacher;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default protect;
