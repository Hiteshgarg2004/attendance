import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import QRCode from "react-qr-code";
import API from "../api/apiClient";
import { useToast } from "../components/ToastProvider";

// Define frontend URL for QR link
const FRONTEND_URL = "https://attendance-oo1a.vercel.app";

export default function ClassPage() {
  const { id } = useParams();

  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // attendance format:
  // true = present
  // false = absent
  // null = not marked
  const [attendance, setAttendance] = useState({});

  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState(null);

  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [timeLeft, setTimeLeft] = useState(0);

  const [qrStatus, setQrStatus] = useState({
    active: false,
    students: [],
  });

  const { showToast } = useToast();

  /* =========================================================
     FETCH CLASS + ATTENDANCE
  ========================================================= */
  useEffect(() => {
    const fetchClass = async () => {
      try {
        setLoading(true);

        // fetch class
        const classRes = await API.get(`/classes/${id}`);

        setCls(classRes.data);

        const today = getLocalDateString();

        // initialize all students as not marked
        const initialAttendance = {};

        classRes.data.students.forEach((student) => {
          initialAttendance[student._id] = null;
        });

        // fetch attendance
        try {
          const attRes = await API.get(
            `/attendance/${id}`,
            {
              params: { date: today },
            }
          );

          if (
            attRes.data?.records &&
            attRes.data.records.length > 0
          ) {
            attRes.data.records.forEach((r) => {
              // support both student and studentId
              const studentObj =
                r.student || r.studentId;

              const studentId =
                typeof studentObj === "object"
                  ? studentObj?._id?.toString()
                  : studentObj?.toString();

              if (studentId) {
                initialAttendance[studentId] =
                  Boolean(r.present);
              }
            });
          }
        } catch (err) {
          console.log(
            "No attendance found for today"
          );
        }

        setAttendance(initialAttendance);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            "Failed to load class"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [id]);

  /* =========================================================
     QR TIMER
  ========================================================= */
  useEffect(() => {
    if (!qrData) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor(
          (qrData.expiresAt - Date.now()) /
            1000
        )
      );

      setTimeLeft(remaining);

      if (remaining <= 0) {
        setShowQR(false);
        setQrData(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrData]);

  /* =========================================================
     POLL QR STATUS
  ========================================================= */
  useEffect(() => {
    if (!showQR || !qrData) return;

    const fetchQRStatus = async () => {
      try {
        const res = await API.get(
          `/attendance/${id}/qr/status`
        );

        setQrStatus(res.data);

        if (
          res.data.students &&
          res.data.students.length > 0
        ) {
          setAttendance((prev) => {
            const updated = { ...prev };

            res.data.students.forEach((s) => {
              const student =
                cls?.students?.find(
                  (st) =>
                    st.rollNo?.toString() ===
                    (
                      s.rollNumber ||
                      s.rollNo
                    )?.toString()
                );

              if (student) {
                updated[student._id] = true;
              }
            });

            return updated;
          });
        }
      } catch (err) {
        console.error(
          "QR status fetch error",
          err
        );
      }
    };

    fetchQRStatus();

    const interval = setInterval(
      fetchQRStatus,
      5000
    );

    return () => clearInterval(interval);
  }, [showQR, qrData, id, cls]);

  /* =========================================================
     HANDLE CHANGE
  ========================================================= */
  const handleChange = (
    studentId,
    value
  ) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]:
        value === "not_marked"
          ? null
          : value === "present",
    }));
  };

  /* =========================================================
     SUBMIT ATTENDANCE
  ========================================================= */
  const handleSubmit = async () => {
    const records = Object.entries(
      attendance
    )
      .filter(
        ([_, present]) => present !== null
      )
      .map(([studentId, present]) => ({
        studentId,
        present,
      }));

    if (records.length === 0) {
      showToast(
        "No attendance marked",
        "warning"
      );

      return;
    }

    try {
      const today = getLocalDateString();

      await API.post(`/attendance/mark`, {
        classId: id,
        date: today,
        records,
      });

      showToast(
        "Attendance saved successfully",
        "success"
      );

      // NO reload needed now
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message ||
          "Failed to save attendance",
        "error"
      );
    }
  };

  /* =========================================================
     GENERATE QR
  ========================================================= */
  const handleGenerateQR = async () => {
    try {
      const res = await API.post(
        `/attendance/${id}/qr/generate`,
        {
          validityMinutes: 5,
        }
      );

      setQrData(res.data);

      setShowQR(true);

      showToast(
        "QR generated successfully",
        "success"
      );
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message ||
          "Failed to generate QR",
        "error"
      );
    }
  };

  /* =========================================================
     STOP QR
  ========================================================= */
  const handleStopQR = () => {
    setShowQR(false);
    setQrData(null);

    setQrStatus({
      active: false,
      students: [],
    });
  };

  /* =========================================================
     STATS
  ========================================================= */
  const totalStudents =
    cls?.students?.length || 0;

  const presentCount = Object.values(
    attendance
  ).filter((v) => v === true).length;

  const absentCount = Object.values(
    attendance
  ).filter((v) => v === false).length;

  /* =========================================================
     LOADING
  ========================================================= */
  if (loading) {
    return (
      <div className="p-10">
        Loading class...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-red-500">
        {error}
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="p-10">
        Class not found
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* BACK */}
        <Link
          to="/"
          className="text-blue-600"
        >
          ← Back to Dashboard
        </Link>

        {/* HEADER */}
        <div className="bg-white rounded-xl shadow p-6 mt-4 mb-6">
          <h1 className="text-3xl font-bold">
            {cls.name}
          </h1>

          <p className="text-gray-500 mt-1">
            Academic Year:{" "}
            {cls.academicYear}
          </p>

          <div className="flex gap-4 mt-4">
            <div className="bg-blue-100 px-4 py-2 rounded">
              Total: {totalStudents}
            </div>

            <div className="bg-green-100 px-4 py-2 rounded">
              Present: {presentCount}
            </div>

            <div className="bg-red-100 px-4 py-2 rounded">
              Absent: {absentCount}
            </div>
          </div>
        </div>

        {/* QR SECTION */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex gap-4">

            <button
              onClick={handleGenerateQR}
              disabled={showQR}
              className={`px-5 py-3 rounded text-white ${
                showQR
                  ? "bg-gray-400"
                  : "bg-blue-500"
              }`}
            >
              {showQR
                ? "QR Active"
                : "Generate QR"}
            </button>

            {showQR && (
              <button
                onClick={handleStopQR}
                className="bg-red-500 text-white px-5 py-3 rounded"
              >
                Stop QR
              </button>
            )}
          </div>

          {showQR && qrData && (
            <div className="mt-6 flex gap-10 items-start">

              {/* QR */}
              <div className="bg-white p-4 border rounded">
                <QRCode
                  value={qrData.qrData}
                  size={200}
                />
              </div>

              {/* INFO */}
              <div className="flex-1">

                <h2 className="text-2xl font-bold">
                  Time Left:{" "}
                  {Math.floor(timeLeft / 60)}:
                  {String(
                    timeLeft % 60
                  ).padStart(2, "0")}
                </h2>

                <p className="mt-4">
                  Students Marked:{" "}
                  {
                    qrStatus.students
                      ?.length
                  }
                </p>

                {/* LINK */}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mt-6">
                  <p className="font-semibold mb-2">
                    Student Attendance Link
                  </p>

                  <input
                    readOnly
                    value={`${FRONTEND_URL}/student?data=${encodeURIComponent(
                      qrData.qrData
                    )}`}
                    className="w-full border p-2 rounded"
                  />
                </div>

                {/* MARKED */}
                {qrStatus.students &&
                  qrStatus.students.length >
                    0 && (
                    <div className="mt-6">
                      <p className="font-semibold mb-2">
                        Recently Marked:
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {qrStatus.students.map(
                          (s, i) => (
                            <span
                              key={i}
                              className="bg-green-100 text-green-700 px-3 py-1 rounded-full"
                            >
                              {s.rollNumber ||
                                s.rollNo}{" "}
                              - {s.name}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* STUDENTS */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-3xl font-bold mb-6">
            Students
          </h2>

          <div className="space-y-4">
            {cls.students.map((s) => (
              <div
                key={s._id}
                className="bg-gray-100 p-4 rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-bold uppercase">
                    {s.name}
                  </p>

                  <p className="text-gray-500">
                    Roll No: {s.rollNo}
                  </p>
                </div>

                <select
                  value={
                    attendance[s._id] ===
                    null
                      ? "not_marked"
                      : attendance[s._id]
                      ? "present"
                      : "absent"
                  }
                  onChange={(e) =>
                    handleChange(
                      s._id,
                      e.target.value
                    )
                  }
                  className={`px-4 py-2 rounded border ${
                    attendance[s._id] ===
                    true
                      ? "bg-green-100 text-green-700"
                      : attendance[
                          s._id
                        ] === false
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-200"
                  }`}
                >
                  <option value="not_marked">
                    Not Marked
                  </option>

                  <option value="present">
                    Present
                  </option>

                  <option value="absent">
                    Absent
                  </option>
                </select>
              </div>
            ))}
          </div>

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            className="w-full mt-8 bg-green-500 text-white py-4 rounded text-lg font-semibold"
          >
            Submit Attendance
          </button>
        </div>
      </div>
    </div>
  );
}
