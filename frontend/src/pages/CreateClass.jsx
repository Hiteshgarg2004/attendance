import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/apiClient";

export default function CreateClass() {
  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState(2022);
  const [date, setDate] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post("/classes", { name, academicYear, date });
    navigate("/"); // redirect to Dashboard
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-lg mx-auto space-y-4">
      <input
        className="border p-3 w-full"
        placeholder="Class Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="date"
        className="border p-3 w-full"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <select
        className="border p-3 w-full"
        value={academicYear}
        onChange={(e) => setAcademicYear(+e.target.value)}
      >
        {[2022, 2023, 2024, 2025].map((y) => (
          <option key={y}>{y}</option>
        ))}
      </select>
      <button className="bg-blue-600 text-white p-3 rounded w-full">Create Class</button>
    </form>
  );
}
