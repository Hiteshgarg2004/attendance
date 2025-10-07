import { useEffect, useState } from "react";
import { useToast } from "../components/ToastProvider";
import { useParams, Link } from "react-router-dom";
import API from "../api/apiClient";

export default function ClassPage() {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await API.get(`/students/class/${id}`);
        setStudents(res.data);
        // initialize attendance default: all false
        const init = {};
        res.data.forEach(s => (init[s._id] = false));
        setAttendance(init);
      } catch (err) {
        setError("Failed to load students.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [id]);

  const handleToggle = (studentId) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSubmitAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, present]) => ({
        studentId,
        present,
      }));

      await API.post("/attendance/mark", { classId: id, records });
      showToast("Attendance saved successfully!", "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save attendance.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-gray-700">Loading students...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h2 className="text-3xl font-bold text-gray-800">Class Students</h2>
        <div className="flex gap-2">
          <Link to={`/attendance/${id}`} className="text-blue-600 hover:underline">
            View Attendance History →
          </Link>
          <Link to={`/class/${id}/add-student`} className="bg-blue-600 text-white py-1 px-3 rounded-lg shadow hover:bg-blue-700 transition-colors">
            + Add Student
          </Link>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="text-gray-600">No students enrolled yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-lg rounded-xl overflow-hidden">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-6 py-3 text-left">Roll No</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-center">Present</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{s.rollNo}</td>
                    <td className="px-6 py-4">{s.name}</td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={attendance[s._id] || false}
                        onChange={() => handleToggle(s._id)}
                        className="h-5 w-5 accent-green-600"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete student ${s.name}?`)) return;
                          try {
                            await API.delete(`/students/${s._id}`);
                            setStudents(students.filter(stu => stu._id !== s._id));
                            showToast("Student deleted!", "success");
                          } catch (err) {
                            showToast(err.response?.data?.message || "Failed to delete student", "error");
                          }
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSubmitAttendance}
            disabled={saving}
            className="mt-6 bg-green-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </>
      )}
    </div>
  );
}
