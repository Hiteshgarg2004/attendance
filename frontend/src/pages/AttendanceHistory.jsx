import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/apiClient";

export default function AttendanceHistory() {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await API.get(`/attendance/class/${id}`);
        setRecords(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [id]);

  if (loading) return <p className="p-6">Loading attendance...</p>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Attendance History</h2>
      {records.length === 0 ? (
        <p>No attendance records yet.</p>
      ) : (
        <div className="space-y-4">
          {records.map(r => (
            <div key={r._id} className="p-4 border rounded bg-white shadow-sm">
              <p className="font-semibold">Date: {r.date}</p>
              <p>Present: {r.records.filter(x => x.present).length} / {r.records.length}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
