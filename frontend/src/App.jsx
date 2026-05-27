import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ClassPage from "./pages/ClassPage";
import Header from "./components/Header";
import CreateClass from "./pages/CreateClass";
import StudentAttendance from "./pages/StudentAttendance";
import BatchAttendance from "./pages/BatchAttendance";
import API from "./api/apiClient";


export default function App() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  // Persist login from localStorage
  useEffect(() => {
    const storedTeacher = localStorage.getItem("teacher");
    if (storedTeacher) {
      setTeacher(JSON.parse(storedTeacher));
    }
  }, []);

  // Verify JWT token
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await API.get("/teachers/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeacher(res.data.teacher);
      } catch (err) {
        console.error("Token invalid:", err.response?.data || err.message);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const handleLogin = (teacherData) => {
    setTeacher(teacherData);
    localStorage.setItem("teacher", JSON.stringify(teacherData));
  };

  const handleLogout = () => {
    localStorage.clear();
    setTeacher(null);
  };

  if (loading) return <p className="p-6 text-gray-700">Loading...</p>;

  return (
    <Router>
      {teacher && <Header teacher={teacher} onLogout={handleLogout} />}
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/student" element={<StudentAttendance />} />
        <Route
          path="/"
          element={teacher ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={teacher ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/class/:id"
          element={teacher ? <ClassPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/create-class"
          element={teacher ? <CreateClass /> : <Navigate to="/login" />}
        />
        <Route
          path="/batch-attendance"
          element={teacher ? <BatchAttendance /> : <Navigate to="/login" />}
        />
        {/* Catch-all redirect */}

        <Route
          path="*"
          element={<Navigate to={teacher ? "/" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}
