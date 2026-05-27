import { useState } from "react";
import { useToast } from "../components/ToastProvider";
import API from "../api/apiClient";
import { useParams } from "react-router-dom";

export default function AddStudent() {
  const { id } = useParams(); // class id
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/students", { name, rollNo, classId: id, academicYear });
      setName("");
      setRollNo("");
      showToast("Student added!", "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add student";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add Student</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter student name"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Roll No</label>
          <input
            type="text"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter roll number"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Academic Year</label>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(parseInt(e.target.value))}
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
          >
            {[2022, 2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Student"}
        </button>
      </form>
    </div>
  );
}
