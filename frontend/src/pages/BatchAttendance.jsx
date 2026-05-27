import { useEffect, useMemo, useState } from "react";
import API from "../api/apiClient";

function getLocalDateString(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BatchAttendance() {
  const [date, setDate] = useState(getLocalDateString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("[BatchAttendance] fetching for date:", date);

      const summaryRes = await API.get("/attendance/batch-summary", {
        params: { date },
      });
      console.log("[BatchAttendance] batch-summary response:", summaryRes.data);

      const studentsRes = await API.get("/attendance/batch-students", {
        params: { date },
      });
      console.log("[BatchAttendance] batch-students response:", studentsRes.data);


      setSummary({
        ...summaryRes.data,
        batchStudents: studentsRes.data?.batches || [],
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load batch attendance.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const batches = summary?.batches || [];

  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => (b.attendancePercent ?? 0) - (a.attendancePercent ?? 0));
  }, [batches]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
          <p className="text-gray-500">Loading batch attendance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Batch Attendance</h2>
          <p className="text-gray-500 mt-1">Attendance percentage & classes attended per batch (academic year)</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-500 md:ml-auto">
            Showing: <span className="font-semibold text-gray-700">{summary?.date || date}</span>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-gray-400 mb-3">No attendance records found for the selected date.</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-gray-600">
                <div>
                  <span className="font-semibold text-gray-800">Batch (Academic Year)</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Attendance %</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Classes Attended</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Students Considered</span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {sortedBatches.map((b) => {
                const studentBatch = summary?.batchStudents?.find(
                  (sb) => sb.academicYear === b.academicYear
                );

                const students = studentBatch?.students || [];

                return (
                  <div key={b.academicYear} className="px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      <div className="font-semibold text-gray-800">{b.academicYear}</div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            (b.attendancePercent ?? 0) >= 75
                              ? "bg-green-500"
                              : (b.attendancePercent ?? 0) >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <div className="text-gray-800 font-semibold">
                          {Number.isFinite(b.attendancePercent)
                            ? b.attendancePercent.toFixed(2)
                            : "0.00"}%
                        </div>
                      </div>

                      <div className="text-gray-700">
                        {b.classesAttended ?? 0} class
                        {(b.classesAttended ?? 0) !== 1 ? "es" : ""}
                      </div>

                      <div className="text-gray-700">
                        {b.totalStudentsConsidered ?? 0}
                      </div>
                    </div>

                    {students.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                          Student Attendance (Present/Absent)
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="py-2 pr-4">Roll No</th>
                                <th className="py-2 pr-4">Name</th>
                                <th className="py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {students.map((s) => (
                                <tr key={s.studentId?.toString?.() || s.rollNo}>
                                  <td className="py-2 pr-4 text-gray-800">
                                    {s.rollNo}
                                  </td>
                                  <td className="py-2 pr-4 text-gray-800">
                                    {s.name}
                                  </td>
                                  <td className="py-2">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        s.present
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {s.present ? "Present" : "Absent"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

